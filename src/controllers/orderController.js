const ServiceOrder = require('../models/serviceOrderModel');
const mongoose = require('mongoose');
const { reallocatePayments } = require('../services/paymentAllocationService');

/**
 * @desc    Tạo một đơn hàng mới (dịch vụ thủ công)
 * @route   POST /api/orders
 * @access  Public
 */
const createOrder = async (req, res) => {
    const { customerId, orderDate, items, totalAmount, note } = req.body;

    if (!customerId || !items || items.length === 0) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin khách hàng và dịch vụ.' });
    }

    try {
        const newOrder = await ServiceOrder.create({ customerId, orderDate, items, totalAmount, note });
        await reallocatePayments(customerId);
        const savedOrder = await ServiceOrder.findById(newOrder._id);
        res.status(201).json(savedOrder);
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(' ') });
        }
        res.status(500).json({ message: 'Lỗi máy chủ khi tạo đơn hàng mới.', error: error.message });
    }
};

/**
 * @desc    Lấy danh sách tất cả đơn hàng
 * @route   GET /api/orders
 * @access  Public
 */
const getAllOrders = async (req, res) => {
    try {
        const orders = await ServiceOrder.find({})
            .populate('customerId', 'companyName customerCode phone address') // Lấy thông tin khách hàng đầy đủ
            .sort({ orderDate: -1 }); // Sắp xếp theo ngày tạo đơn mới nhất

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách đơn hàng.', error: error.message });
    }
};

/**
 * @desc    Lấy thông tin chi tiết một đơn hàng
 * @route   GET /api/orders/:id
 * @access  Public
 */
const getOrderById = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID đơn hàng không hợp lệ.' });
    }

    try {
        const order = await ServiceOrder.findById(id).populate('customerId', 'companyName customerCode phone address');
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy chi tiết đơn hàng.', error: error.message });
    }
};

/**
 * @desc    Xóa một đơn hàng
 * @route   DELETE /api/orders/:id
 * @access  Public
 */
const deleteOrder = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID đơn hàng không hợp lệ.' });
    }

    try {
        const deletedOrder = await ServiceOrder.findByIdAndDelete(id);
        if (!deletedOrder) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        }
        await reallocatePayments(deletedOrder.customerId);
        res.status(200).json({ message: 'Đơn hàng đã được xóa thành công.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ khi xóa đơn hàng.', error: error.message });
    }
};

/**
 * @desc    Cập nhật thông tin một đơn hàng
 * @route   PUT /api/orders/:id
 * @access  Public
 */
const updateOrder = async (req, res) => {
    const { id } = req.params;
    const { customerId, orderDate, items, totalAmount, status, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID đơn hàng không hợp lệ.' });
    }

    try {
        const order = await ServiceOrder.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        }

        // Kiểm tra xem đơn hàng đã được thanh toán hoặc có ghi nhận thanh toán chưa để khóa sửa
        const isLocked = (order.paidAmount || 0) > 0 || order.status === 'paid';
        if (isLocked) {
            return res.status(400).json({ message: 'Đơn hàng đã có ghi nhận thanh toán, không thể chỉnh sửa.' });
        }

        const oldCustomerId = order.customerId;

        // Cập nhật các trường thông tin đơn hàng
        if (customerId) order.customerId = customerId;
        if (orderDate) order.orderDate = orderDate;
        if (items) order.items = items;
        if (totalAmount !== undefined) order.totalAmount = totalAmount;
        if (note !== undefined) order.note = note;

        // Xử lý logic trạng thái khi lưu
        if (status) {
            if (status === 'paid') {
                order.status = 'paid';
                order.paidAmount = order.totalAmount; // Đồng bộ đã trả
            } else {
                order.status = 'unpaid';
                order.paidAmount = 0; // Trở về chưa thanh toán
            }
        }

        await order.save();
        await reallocatePayments(order.customerId);

        // Nếu thay đổi khách hàng, phân bổ lại cho khách hàng cũ
        if (customerId && oldCustomerId.toString() !== customerId.toString()) {
            await reallocatePayments(oldCustomerId);
        }

        const savedOrder = await ServiceOrder.findById(order._id);
        res.status(200).json(savedOrder);
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(' ') });
        }
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật đơn hàng.', error: error.message });
    }
};

module.exports = {
    createOrder,
    getAllOrders,
    getOrderById,
    deleteOrder,
    updateOrder,
};