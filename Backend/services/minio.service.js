const minioClient = require('../config/minio');
require('dotenv').config();

const bucketName = process.env.MINIO_BUCKET_NAME;

/**
 * Upload file lên MinIO
 */
const uploadFile = async (fileName, fileBuffer, mimeType) => {
  const metaData = {
    'Content-Type': mimeType,
  };

  await minioClient.putObject(bucketName, fileName, fileBuffer, fileBuffer.length, metaData);

  return `https://${process.env.MINIO_ENDPOINT}/${bucketName}/${fileName}`;
};

/**
 * Kiểm tra file có tồn tại trên MinIO không (dựa trên hash prefix)
 * Tìm tất cả files bắt đầu bằng hash
 */
const fileExistsByHash = async (hash) => {
  return new Promise((resolve, reject) => {
    const objectsList = [];
    const stream = minioClient.listObjects(bucketName, hash, false);

    stream.on('data', (obj) => {
      objectsList.push(obj);
    });

    stream.on('error', (err) => {
      reject(err);
    });

    stream.on('end', () => {
      resolve(objectsList.length > 0 ? objectsList[0] : null);
    });
  });
};

/**
 * Tạo presigned URL để xem nội dung file (hết hạn sau VIEW_TOKEN_TTL_SECONDS)
 */
const getPresignedUrl = async (fileName) => {
  const ttl = parseInt(process.env.VIEW_TOKEN_TTL_SECONDS) || 300;
  const url = await minioClient.presignedGetObject(bucketName, fileName, ttl);
  return url;
};

/**
 * Stream object từ MinIO — dùng cho serve-binary
 */
const getObjectStream = async (objectName) => {
  return minioClient.getObject(bucketName, objectName);
};

module.exports = {
  uploadFile,
  fileExistsByHash,
  getPresignedUrl,
  getObjectStream,
};