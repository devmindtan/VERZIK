const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // mỗi user chỉ có 1 wallet
    },
    address: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    encrypted_private_key: {
      type: String,
      required: true,
      select: false, // mặc định không trả về khi query
    },
    is_system_generated: {
      type: Boolean,
      default: true, // true = hệ thống tạo cho Google user
    },
  },
  {
    timestamps: true,
  }
);

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
