/**
 * CID Service — Sinh IPFS-compatible CIDv1 từ binary data
 *
 * Chuẩn: CIDv1 + raw codec (0x55) + SHA-256 multihash
 * Output: Base32-lower "bafy..." string (multibase 'b' prefix)
 *
 * Không cần thư viện ngoài — dùng crypto native của Node.js
 * + manual varint/multicodec encoding.
 */

const crypto = require('crypto');

// ─── Multicodec / Multihash constants ───
const CID_VERSION = 0x01;
const RAW_CODEC = 0x55;           // raw binary
const SHA2_256_CODE = 0x12;       // multihash function code
const SHA2_256_LENGTH = 0x20;     // 32 bytes

// ─── Base32 (RFC 4648, lowercase, no padding) ───
const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

const encodeBase32Lower = (bytes) => {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }

  return output;
};

// ─── Unsigned varint encoding ───
const encodeVarint = (value) => {
  const bytes = [];
  while (value > 0x7f) {
    bytes.push((value & 0x7f) | 0x80);
    value >>>= 7;
  }
  bytes.push(value & 0x7f);
  return Buffer.from(bytes);
};

/**
 * Sinh CIDv1 từ raw binary data
 *
 * Format: <cid-version><codec><multihash>
 * Multihash: <hash-fn-code><digest-size><digest>
 *
 * @param {Buffer|Uint8Array} data - dữ liệu binary cần tạo CID
 * @returns {string} CIDv1 base32-lower (bafk...)
 */
const generateCID = (data) => {
  // SHA-256 hash
  const digest = crypto.createHash('sha256').update(data).digest();

  // Assemble CID bytes: version + codec + multihash
  const versionVarint = encodeVarint(CID_VERSION);
  const codecVarint = encodeVarint(RAW_CODEC);
  const hashFnVarint = encodeVarint(SHA2_256_CODE);
  const hashLenVarint = encodeVarint(SHA2_256_LENGTH);

  const cidBytes = Buffer.concat([
    versionVarint,
    codecVarint,
    hashFnVarint,
    hashLenVarint,
    digest,
  ]);

  // Base32-lower encode với prefix 'b' (multibase)
  return 'b' + encodeBase32Lower(cidBytes);
};

/**
 * Verify CID: decode và so sánh SHA-256 digest
 *
 * @param {string} cid - CIDv1 base32-lower string
 * @param {Buffer|Uint8Array} data - dữ liệu gốc
 * @returns {boolean} true nếu CID khớp với data
 */
const verifyCID = (cid, data) => {
  const expectedCID = generateCID(data);
  return cid === expectedCID;
};

module.exports = { generateCID, verifyCID };
