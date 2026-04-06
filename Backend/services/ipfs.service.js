/**
 * IPFS Service — thao tác Kubo HTTP API
 *
 * Endpoints:
 * 1) add đơn lẻ: /api/v0/add
 * 2) add wrap dir: /api/v0/add?wrap-with-directory=true
 * 3) pin: /api/v0/pin/add?arg=<cid>
 */

const axios = require('axios');
const FormData = require('form-data');

const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');
const toNodeBaseUrl = (value) => {
  const trimmed = trimTrailingSlash(value || '');
  if (!trimmed) return null;
  return trimmed.endsWith('/ipfs-api') ? trimTrailingSlash(trimmed.replace(/\/ipfs-api$/, '')) : trimmed;
};

const IPFS_API_URL = trimTrailingSlash(process.env.IPFS_API_URL || 'http://100.114.63.52/ipfs-api');
const IPFS_GATEWAY_URL = trimTrailingSlash(process.env.IPFS_GATEWAY_URL || 'http://100.114.63.52/ipfs');
const DEFAULT_PIN_NODE_BASES = [
  'http://100.86.141.119:5001',
  'http://100.114.63.52:5001',
  'http://100.70.28.67:5001',
];

const PIN_NODE_BASES = (() => {
  const fromEnv = (process.env.IPFS_PIN_NODE_URLS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const candidates = fromEnv.length > 0 ? fromEnv : DEFAULT_PIN_NODE_BASES;
  const normalized = [...new Set(candidates.map(toNodeBaseUrl).filter(Boolean))];
  return normalized;
})();

const ADD_URL = `${IPFS_API_URL}/api/v0/add`;
const PIN_ADD_URL = `${IPFS_API_URL}/api/v0/pin/add`;
const BLOCK_STAT_URL = `${IPFS_API_URL}/api/v0/block/stat`;

const parseAddResponse = (payload) => {
  if (!payload) return [];

  if (typeof payload === 'object' && !Array.isArray(payload) && payload.Hash) {
    return [{
      name: payload.Name || '',
      cid: payload.Hash,
      size: Number(payload.Size || 0),
    }];
  }

  const text = Buffer.isBuffer(payload) ? payload.toString('utf8') : String(payload);
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const item = JSON.parse(line);
    return {
      name: item.Name || '',
      cid: item.Hash,
      size: Number(item.Size || 0),
    };
  });
};

const addFromForm = async (form, params = {}) => {
  const response = await axios.post(ADD_URL, form, {
    headers: form.getHeaders(),
    params: {
      'cid-version': 1,
      pin: false,
      ...params,
    },
    responseType: 'text',
    transitional: {
      forcedJSONParsing: false,
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeout: 60_000,
  });

  return parseAddResponse(response.data);
};

/**
 * 1) add đơn lẻ /api/v0/add
 */
const addSingle = async (data, fileName = 'encrypted.bin', contentType = 'application/octet-stream') => {
  const form = new FormData();
  form.append('file', Buffer.from(data), {
    filename: fileName,
    contentType,
  });

  const entries = await addFromForm(form);
  const first = entries[0];
  if (!first || !first.cid) {
    throw new Error('IPFS add(single) did not return CID');
  }

  return first;
};

/**
 * 2) add file + metadata với wrap-with-directory=true
 */
const addWithMetadataDirectory = async ({
  fileData,
  fileName = 'encrypted.bin',
  metadataData,
  metadataFileName = 'metadata.json',
  directoryName = 'bundle',
}) => {
  const form = new FormData();

  form.append('file', Buffer.from(fileData), {
    filename: `${directoryName}/${fileName}`,
    contentType: 'application/octet-stream',
  });

  form.append('file', Buffer.from(metadataData), {
    filename: `${directoryName}/${metadataFileName}`,
    contentType: 'application/json',
  });

  const entries = await addFromForm(form, { 'wrap-with-directory': true });
  if (!entries.length) {
    throw new Error('IPFS add(wrap-with-directory) returned empty result');
  }

  const directoryEntry = entries[entries.length - 1];
  const fileEntry = entries.find((entry) => entry.name.endsWith(`/${fileName}`) || entry.name === fileName);
  const metadataEntry = entries.find((entry) => {
    return entry.name.endsWith(`/${metadataFileName}`) || entry.name === metadataFileName;
  });

  return {
    directoryCid: directoryEntry?.cid || null,
    fileCid: fileEntry?.cid || null,
    metadataCid: metadataEntry?.cid || null,
    entries,
  };
};

/**
 * 3) pin /api/v0/pin/add?arg=<cid>
 */
const pin = async (cid) => {
  if (!cid) {
    throw new Error('CID is required for pin');
  }

  const response = await axios.post(PIN_ADD_URL, null, {
    params: { arg: cid },
    timeout: 30_000,
  });

  const pinned = response.data?.Pins?.[0] || cid;
  return { cid: pinned };
};

const pinOnNode = async (cid, nodeBaseUrl) => {
  if (!cid) {
    throw new Error('CID is required for pin');
  }
  const base = toNodeBaseUrl(nodeBaseUrl);
  if (!base) {
    throw new Error('nodeBaseUrl is required');
  }

  const url = `${base}/api/v0/pin/add`;
  const response = await axios.post(url, null, {
    params: { arg: cid },
    timeout: 30_000,
  });
  const pinned = response.data?.Pins?.[0] || cid;
  return { node: base, cid: pinned, ok: true };
};

const pinOnAllNodes = async (cid, options = {}) => {
  const strict = options.strict !== false;
  const nodeBases = options.nodeBases && options.nodeBases.length
    ? options.nodeBases.map(toNodeBaseUrl).filter(Boolean)
    : PIN_NODE_BASES;
  const minSuccess = Number(options.minSuccess ?? Math.min(2, nodeBases.length));

  if (!nodeBases.length) {
    throw new Error('No IPFS pin nodes configured');
  }

  const settled = await Promise.allSettled(nodeBases.map((base) => pinOnNode(cid, base)));
  const results = settled.map((item, idx) => {
    const node = nodeBases[idx];
    if (item.status === 'fulfilled') return item.value;
    return { node, cid, ok: false, error: item.reason?.message || String(item.reason) };
  });

  const successCount = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  if (strict && successCount < minSuccess) {
    throw new Error(
      `Pin quorum not met (${successCount}/${results.length}, required ${minSuccess}). Failed node(s): ${failed.map((f) => f.node).join(', ')}`
    );
  }

  return results;
};

const getGatewayUrl = (cid) => `${IPFS_GATEWAY_URL}/${cid}`;

const exists = async (cid) => {
  try {
    await axios.post(BLOCK_STAT_URL, null, {
      params: { arg: cid },
      timeout: 5_000,
    });
    return true;
  } catch {
    return false;
  }
};

// Backward-compatible alias
const upload = async (data, fileName = 'encrypted.bin') => {
  const single = await addSingle(data, fileName, 'application/octet-stream');
  return { cid: single.cid, size: single.size };
};

module.exports = {
  addSingle,
  addWithMetadataDirectory,
  pin,
  pinOnNode,
  pinOnAllNodes,
  PIN_NODE_BASES,
  getGatewayUrl,
  exists,
  upload,
};
