require('dotenv').config(); // Tải các biến môi trường từ file .env
const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 5000;

// Kết nối tới MongoDB
connectDB();

// Chỉ khởi chạy server cổng cố định khi chạy dưới local (không chạy trên Vercel)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app; // BẮT BUỘC phải export để Vercel Serverless Function hoạt động