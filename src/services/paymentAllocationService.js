const ServiceOrder = require('../models/serviceOrderModel');
const Payment = require('../models/paymentModel');

/**
 * Phân bổ lại toàn bộ thanh toán cho các đơn hàng của một khách hàng theo cơ chế FIFO.
 * Đảm bảo số tiền đã trả (paidAmount) và trạng thái (status) trên từng đơn hàng
 * luôn phản ánh chính xác lịch sử thanh toán thực tế của khách hàng đó.
 * 
 * @param {string} customerId ID của khách hàng
 */
const reallocatePayments = async (customerId) => {
    if (!customerId) return;

    // 1. Lấy toàn bộ giao dịch thanh toán của khách hàng, sắp xếp tăng dần theo thời gian (FIFO)
    const payments = await Payment.find({ customerId }).sort({ paymentDate: 1, createdAt: 1 });
    const totalPaymentAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // 2. Lấy toàn bộ đơn hàng của khách hàng, sắp xếp tăng dần theo thời gian tạo đơn
    const orders = await ServiceOrder.find({ customerId }).sort({ orderDate: 1, createdAt: 1 });

    // 3. Phân bổ tuần tự tổng số tiền đã trả vào từng đơn hàng
    let remainingAmountToAllocate = totalPaymentAmount;

    for (const order of orders) {
        const orderTotal = order.totalAmount || 0;
        
        if (remainingAmountToAllocate >= orderTotal) {
            // Thanh toán đủ cho đơn hàng
            order.paidAmount = orderTotal;
            order.status = 'paid';
            remainingAmountToAllocate -= orderTotal;
        } else if (remainingAmountToAllocate > 0) {
            // Thanh toán một phần cho đơn hàng
            order.paidAmount = remainingAmountToAllocate;
            order.status = 'unpaid';
            remainingAmountToAllocate = 0;
        } else {
            // Chưa có thanh toán nào được phân bổ tới đơn hàng này
            order.paidAmount = 0;
            order.status = 'unpaid';
        }
        
        // Lưu thay đổi vào DB
        await order.save();
    }
};

module.exports = {
    reallocatePayments
};
