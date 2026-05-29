const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, 'Khách hàng là bắt buộc.']
    },
    amount: {
        type: Number,
        required: [true, 'Số tiền thanh toán là bắt buộc.']
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    note: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
