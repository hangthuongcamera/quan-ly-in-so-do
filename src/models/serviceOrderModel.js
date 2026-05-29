const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    serviceType: { type: String, required: true },
    serviceTypeLabel: { type: String },
    description: { type: String, trim: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    amount: { type: Number, required: true },
}, { _id: false });

const serviceOrderSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, 'Khách hàng là bắt buộc.']
    },
    orderDate: {
        type: Date,
        required: [true, 'Ngày tạo đơn hàng là bắt buộc.']
    },
    items: [orderItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: [0, 'Tổng tiền không thể âm.']
    },
    paidAmount: {
        type: Number,
        default: 0,
        min: [0, 'Số tiền đã trả không thể âm.']
    },
    status: {
        type: String,
        required: true,
        enum: ['unpaid', 'paid'],
        default: 'unpaid'
    },
    note: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

const ServiceOrder = mongoose.model('ServiceOrder', serviceOrderSchema);

module.exports = ServiceOrder;