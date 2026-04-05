const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

/**
 * Parse JWT nếu có, không bắt buộc.
 * Gắn req.user nếu token hợp lệ.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (user && user.is_active) {
      req.user = user;
    } else {
      req.user = null;
    }
  } catch (error) {
    req.user = null;
  }
  next();
};

/**
 * Bắt buộc JWT. Trả 401 nếu không có hoặc không hợp lệ.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Yêu cầu đăng nhập' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Tài khoản không hợp lệ hoặc đã bị vô hiệu' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    return res.status(500).json({ error: 'Lỗi xác thực' });
  }
};

module.exports = {
  optionalAuth,
  requireAuth,
};
