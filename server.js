require('dotenv').config(); // Tải các biến môi trường từ file .env
const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 5000;

// Kết nối tới MongoDB (sẽ được kích hoạt ở bước sau)
connectDB();

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});