const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware cơ bản
app.use(cors()); // Cho phép các request từ domain khác (frontend)
app.use(express.json()); // Để parse JSON body

// Import các routes
const customerRoutes = require('./routes/customerRoutes');
const orderRoutes = require('./routes/orderRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// --- CÁC ROUTE API SẼ ĐƯỢỢC ĐẶT Ở ĐÂY ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings/pricing', settingsRoutes);
app.use('/api', paymentRoutes);
app.get('/api', (req, res) => {
    res.json({ message: 'Welcome to the Garment Services API' });
});

// --- CẤU HÌNH PHỤC VỤ FRONTEND ---
// Dòng này chỉ định thư mục `public` để chứa các file tĩnh của frontend
app.use(express.static(path.join(__dirname, '../public')));

// Route "catch-all" này sẽ xử lý tất cả các request không khớp với API hoặc file tĩnh ở trên.
// Nó đảm bảo rằng ứng dụng trang đơn (SPA) của chúng ta hoạt động đúng cách bằng cách
// luôn trả về file index.html cho các đường dẫn phía client (ví dụ: /customers, /orders).
app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public', 'index.html'));
});

module.exports = app;