/**
 * Activity Service — Log hệ thống cho báo cáo & biểu đồ
 *
 * Ghi tất cả mọi thứ, không cần hash chain.
 * Dùng cho dashboard, analytics, vẽ biểu đồ.
 */

const ActivityLog = require('../models/ActivityLog.model');

/**
 * Ghi 1 activity log
 * @param {Object} data
 * @param {string} data.action - loại hành động
 * @param {string|null} data.userId - user thực hiện
 * @param {string|null} data.resourceType - loại resource
 * @param {string|null} data.resourceId - ID resource
 * @param {Object} data.metadata - dữ liệu bổ sung
 * @param {Object} req - Express request (lấy IP, user-agent)
 */
const log = async (data, req = null) => {
  try {
    await ActivityLog.create({
      user: data.userId || null,
      action: data.action,
      resource_type: data.resourceType || null,
      resource_id: data.resourceId || null,
      metadata: data.metadata || {},
      ip_address: req ? (req.ip || req.connection?.remoteAddress) : null,
      user_agent: req ? req.headers['user-agent'] : null,
      performed_at: new Date(),
    });
  } catch (err) {
    // Activity log KHÔNG được phép crash server
    console.error('ActivityLog write failed:', err.message);
  }
};

module.exports = { log };
