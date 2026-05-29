const app = require('../src/app');
const connectDB = require('../src/config/database');

// Kết nối tới MongoDB
connectDB();

module.exports = app;
