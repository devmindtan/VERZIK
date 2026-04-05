const mongoose = require('mongoose');

/**
 * ActivityLog — Log hệ thống cho báo cáo & biểu đồ
 *
 * Ghi TẤT CẢ hoạt động: verify, view, download, login, consent, v.v.
 * KHÔNG cần tamper-proof — đây là log nội bộ cho analytics.
 * Riêng audit (ViewLog) mới cần hash chain.
 */
const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'verify',           // kiểm tra file chứng thực
        'view',             // xem nội dung tài liệu
        'download',         // tải tài liệu
        'login',            // đăng nhập
        'logout',           // đăng xuất
        'consent',          // ký consent
        'push_document',    // tổ chức push tài liệu
        'create_api_client',// tạo API client
        'purchase_credits', // mua credits
        'subscribe',        // đăng ký gói
      ],
    },
    resource_type: {
      type: String,
      default: null,
      // 'document', 'user', 'api_client', 'billing', etc.
    },
    resource_id: {
      type: String,
      default: null,
      // document_hash, user_id, client_id, etc.
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // Dữ liệu bổ sung tùy action
      // verify: { file_name, file_size, result: 'verified'|'not_verified' }
      // view: { document_hash, organization }
      // login: { provider: 'wallet'|'google' }
    },
    ip_address: {
      type: String,
      default: null,
    },
    user_agent: {
      type: String,
      default: null,
    },
    performed_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes cho query nhanh khi vẽ biểu đồ
activityLogSchema.index({ action: 1, performed_at: -1 });
activityLogSchema.index({ user: 1, performed_at: -1 });
activityLogSchema.index({ performed_at: -1 });
activityLogSchema.index({ resource_type: 1, resource_id: 1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
