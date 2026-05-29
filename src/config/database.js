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
        if (mongoose.connection.readyState >= 1) return;
        
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI is not defined in env!');
            return;
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully.');
        await seedAdmin();
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        // Không thoát tiến trình để tránh crash instance trên Vercel
    }
};

module.exports = connectDB;