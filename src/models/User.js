const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Vui lòng nhập tên đăng nhập'],
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Vui lòng nhập mật khẩu'],
        minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
    },
    displayName: {
        type: String,
        required: [true, 'Vui lòng nhập tên hiển thị']
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    permissions: {
        type: Map,
        of: Boolean,
        default: {
            dashboard: true,
            customers: false,
            marker: false,
            manualServices: false,
            orders: false,
            debt: false,
            debtSettlement: false,
            settings: false
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Middleware chạy trước khi lưu user: mã hóa mật khẩu
userSchema.pre('save', async function(next) {
    // Chỉ mã hóa nếu mật khẩu bị thay đổi (hoặc tạo mới)
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method kiểm tra mật khẩu
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Loại bỏ password khi trả về object user
userSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
