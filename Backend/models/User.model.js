const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    display_name: {
      type: String,
      trim: true,
      default: '',
    },
    is_superuser: {
      type: Boolean,
      default: false,
      immutable: true, // chỉ set khi tạo, không thể update qua API
    },
    is_staff: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    organization_name: {
      type: String,
      trim: true,
      default: null,
    },
    organization_type: {
      type: String,
      enum: ['company', 'school', 'government', 'other', null],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ is_superuser: 1 });
userSchema.index({ is_staff: 1 });
userSchema.index({ is_active: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
