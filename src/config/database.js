const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
    try {
        const count = await User.countDocuments();
        if (count === 0) {
            await User.create({
                username: 'admin',
                password: 'admin123',
                displayName: 'Quản trị viên',
                role: 'admin',
                permissions: {
                    dashboard: true,
                    customers: true,
                    marker: true,
                    manualServices: true,
                    orders: true,
                    debt: true,
                    debtSettlement: true,
                    settings: true
                }
            });
            console.log('Đã tạo tài khoản Admin mặc định (admin / admin123)');
        }
    } catch (error) {
        console.error('Lỗi khi tạo tài khoản Admin:', error.message);
    }
};

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully.');
        await seedAdmin();
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        // Thoát khỏi tiến trình với mã lỗi 1 nếu không thể kết nối
        process.exit(1);
    }
};

module.exports = connectDB;