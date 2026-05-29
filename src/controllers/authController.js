const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Hàm tạo JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key_change_me', {
        expiresIn: '7d',
    });
};

// @desc    Đăng nhập user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tài khoản và mật khẩu' });
        }

        const user = await User.findOne({ username });

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác' });
        }

        if (!user.isActive) {
            return res.status(401).json({ success: false, message: 'Tài khoản đã bị khóa' });
        }

        res.json({
            success: true,
            data: {
                _id: user._id,
                username: user.username,
                displayName: user.displayName,
                role: user.role,
                permissions: user.permissions,
                token: generateToken(user._id)
            }
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Lấy thông tin user hiện tại
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
