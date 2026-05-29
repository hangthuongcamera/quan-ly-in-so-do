const Customer = require('../models/customerModel');
const ServiceOrder = require('../models/serviceOrderModel');
const Payment = require('../models/paymentModel');
const { reallocatePayments } = require('../services/paymentAllocationService');

/**
 * @desc    Ghi nhận một giao dịch thanh toán mới
 * @route   POST /api/payments
 * @access  Public
 */
const createPayment = async (req, res) => {
    const { customerId, amount, note } = req.body;

    if (!customerId || amount === undefined || amount === null) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin khách hàng và số tiền thanh toán.' });
    }

    try {
        const paymentAmount = Number(amount);
        if (isNaN(paymentAmount)) {
            return res.status(400).json({ message: 'Số tiền thanh toán không hợp lệ.' });
        }

        const payment = await Payment.create({
            customerId,
            amount: paymentAmount,
            note
        });

        // Phân bổ lại thanh toán cho toàn bộ đơn hàng của khách hàng theo cơ chế FIFO
        await reallocatePayments(customerId);

        res.status(201).json(payment);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ khi ghi nhận thanh toán.', error: error.message });
    }
};

/**
 * @desc    Lấy tổng hợp công nợ của tất cả khách hàng
 * @route   GET /api/receivables
 * @access  Public
 */
const getReceivables = async (req, res) => {
    try {
        // Lấy toàn bộ danh sách khách hàng
        const customers = await Customer.find({});

        // Lập bản đồ tính toán công nợ từng khách hàng
        const receivables = await Promise.all(customers.map(async (customer) => {
            // Tổng tiền các đơn hàng
            const orders = await ServiceOrder.find({ customerId: customer._id });
            const totalAmount = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

            // Tổng tiền đã thanh toán
            const payments = await Payment.find({ customerId: customer._id });
            const paidAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

            const remainingAmount = totalAmount - paidAmount;

            return {
                id: customer._id,
                _id: customer._id,
                customerCode: customer.customerCode,
                companyName: customer.companyName || customer.contactPerson || 'Không xác định',
                totalAmount,
                paidAmount,
                remainingAmount
            };
        }));

        res.status(200).json(receivables);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy dữ liệu công nợ.', error: error.message });
    }
};

/**
 * @desc    Lấy toàn bộ lịch sử thanh toán
 * @route   GET /api/payments
 * @access  Public
 */
const getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find({})
            .populate('customerId', 'companyName customerCode contactPerson')
            .sort({ createdAt: -1 });
        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy lịch sử thanh toán.', error: error.message });
    }
};

module.exports = {
    createPayment,
    getReceivables,
    getAllPayments
};
