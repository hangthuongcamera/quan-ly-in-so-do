const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    customerCode: {
        type: String,
        unique: true,
        sparse: true, // Cho phép nhiều document có giá trị null, nhưng nếu có giá trị thì phải là duy nhất
        trim: true,
    },
    companyName: {
        type: String,
        required: [true, 'Tên công ty/khách hàng là bắt buộc.'],
        trim: true,
    },
    contactPerson: {
        type: String,
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    note: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true, // Tự động thêm trường createdAt và updatedAt
});

const Customer = mongoose.model('Customer', CustomerSchema);

module.exports = Customer;