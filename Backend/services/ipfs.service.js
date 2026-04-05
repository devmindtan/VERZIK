/**
 * IPFS Service — Upload/Pin/Retrieve files trên IPFS node
 *
 * API: http://100.114.63.52/ipfs-api/ (Kubo/Go-IPFS HTTP API)
 * Gateway: http://100.114.63.52/ipfs/
 */

const axios = require('axios');
const FormData = require('form-data');

const IPFS_API_URL = process.env.IPFS_API_URL || 'http://100.114.63.52/ipfs-api';
const IPFS_GATEWAY_URL = process.env.IPFS_GATEWAY_URL || 'http://100.114.63.52/ipfs';

/**
 * Upload binary data lên IPFS
 * @param {Buffer|Uint8Array} data - dữ liệu binary
 * @param {string} [fileName] - tên file (optional, dùng cho metadata)
 * @returns {Object} { cid, size }
 */
const upload = async (data, fileName = 'encrypted.bin') => {
  const form = new FormData();
  form.append('file', Buffer.from(data), {
    filename: fileName,
    contentType: 'application/octet-stream',
  });

  const response = await axios.post(`${IPFS_API_URL}/api/v0/add`, form, {
    headers: form.getHeaders(),
    params: {
      'cid-version': 1,       // CIDv1 để ra chuẩn bafy...
      pin: true,               // Pin ngay khi upload
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  return {
    cid: response.data.Hash,   // CIDv1 string (bafy...)
    size: parseInt(response.data.Size, 10),
  };
};

/**
 * Lấy URL truy cập file qua IPFS Gateway
 * @param {string} cid
 * @returns {string} Gateway URL
 */
const getGatewayUrl = (cid) => {
  return `${IPFS_GATEWAY_URL}/${cid}`;
};

/**
 * Kiểm tra file đã tồn tại trên IPFS chưa
 * @param {string} cid
 * @returns {boolean}
 */
const exists = async (cid) => {
  try {
    await axios.post(`${IPFS_API_URL}/api/v0/block/stat`, null, {
      params: { arg: cid },
      timeout: 5000,
    });
    return true;
  } catch {
    return false;
  }
};

/**
 * Pin 1 CID đã tồn tại
 * @param {string} cid
 */
const pin = async (cid) => {
  await axios.post(`${IPFS_API_URL}/api/v0/pin/add`, null, {
    params: { arg: cid },
    timeout: 30000,
  });
};

module.exports = { upload, getGatewayUrl, exists, pin };
