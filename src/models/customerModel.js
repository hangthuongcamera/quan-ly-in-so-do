const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    customerCode: {
        type: String,
        unique: true, // Đảm bảo mỗi mã khách hàng là duy nhất
        trim: true,   // Loại bỏ khoảng trắng thừa ở đầu và cuối
        uppercase: true // Tự động chuyển thành chữ hoa
    },
    companyName: {
        type: String,
        trim: true
    },
    contactPerson: {
        type: String,
        trim: true,
        required: [true, 'Người liên hệ là bắt buộc.']
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    note: {
        type: String,
        trim: true
    }
}, {
    timestamps: true // Tự động thêm hai trường `createdAt` và `updatedAt`
});

// Hook để tự động tạo customerCode trước khi lưu
customerSchema.pre('save', async function(next) {
    // Chỉ thực hiện khi tạo mới và customerCode không được cung cấp hoặc là chuỗi rỗng
    if (this.isNew && (!this.customerCode || this.customerCode.trim() === '')) {
        const lastCustomer = await this.constructor.findOne({}, {}, { sort: { 'createdAt': -1 } });
        let nextIdNumber = 1;
        if (lastCustomer && lastCustomer.customerCode) {
            // Tìm số ở cuối mã khách hàng, ví dụ: KH001 -> 1
            const match = lastCustomer.customerCode.match(/\d+$/);
            if (match) {
                nextIdNumber = parseInt(match[0], 10) + 1;
            }
        }
        this.customerCode = `KH${String(nextIdNumber).padStart(3, '0')}`;
    }
    next();
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;