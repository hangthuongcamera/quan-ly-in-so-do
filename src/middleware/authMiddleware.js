const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware xác thực token
exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Lấy token từ header
            token = req.headers.authorization.split(' ')[1];

            // Xác thực token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_change_me');

            // Lấy thông tin user (không lấy password)
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Người dùng không tồn tại' });
            }

            if (!req.user.isActive) {
                return res.status(401).json({ success: false, message: 'Tài khoản đã bị khóa' });
            }

            next();
        } catch (error) {
            console.error('Lỗi xác thực JWT:', error);
            res.status(401).json({ success: false, message: 'Không có quyền truy cập, token không hợp lệ' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Không có quyền truy cập, không tìm thấy token' });
    }
};

// Middleware kiểm tra quyền admin
exports.adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Không có quyền truy cập (yêu cầu quyền Admin)' });
    }
};
