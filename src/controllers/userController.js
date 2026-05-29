const User = require('../models/User');

// @desc    Lấy danh sách tất cả users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Tạo user mới
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
    try {
        const { username, password, displayName, role, permissions, isActive } = req.body;

        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại' });
        }

        const user = await User.create({
            username,
            password,
            displayName,
            role,
            permissions,
            isActive
        });

        res.status(201).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
    }
};

// @desc    Cập nhật user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        // Không cho phép user khác sửa thông tin của admin mặc định
        if (user.username === 'admin' && req.user.username !== 'admin') {
            return res.status(403).json({ success: false, message: 'Không thể chỉnh sửa tài khoản admin hệ thống' });
        }

        user.displayName = req.body.displayName || user.displayName;
        
        // Chỉ admin mới có quyền đổi role và permissions, nhưng check adminOnly ở middleware rồi
        if (req.body.role) user.role = req.body.role;
        if (req.body.permissions) user.permissions = req.body.permissions;
        if (req.body.isActive !== undefined) user.isActive = req.body.isActive;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();
        res.json({ success: true, data: updatedUser });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
    }
};

// @desc    Xóa user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        if (user.username === 'admin') {
            return res.status(403).json({ success: false, message: 'Không thể xóa tài khoản admin hệ thống' });
        }
        
        // Prevent deleting oneself
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Bạn không thể tự xóa tài khoản của mình' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Đã xóa người dùng' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
    }
};
