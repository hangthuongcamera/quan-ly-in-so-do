const Customer = require('../models/customerModel');
const mongoose = require('mongoose');
/**
 * @desc    Lấy danh sách tất cả khách hàng
 * @route   GET /api/customers
 * @access  Public
 */
const getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.find({}).sort({ createdAt: -1 }); // Sắp xếp theo ngày tạo mới nhất
        res.status(200).json(customers);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách khách hàng.', error: error.message });
    }
};

/**
 * @desc    Tạo một khách hàng mới
 * @route   POST /api/customers
 * @access  Public
 */
const createCustomer = async (req, res) => {
    const { customerCode, companyName, contactPerson, phone, address, note } = req.body;

    try {
        const newCustomer = await Customer.create({
            customerCode: customerCode || undefined, // Gửi undefined để Mongoose không lưu trường rỗng
            companyName,
            contactPerson,
            phone,
            address,
            note
        });
        res.status(201).json(newCustomer);
    } catch (error) {
        // Xử lý lỗi validation từ Mongoose
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(' ') });
        }
        // Xử lý lỗi trùng lặp mã khách hàng (unique index)
        if (error.code === 11000) {
            return res.status(400).json({ message: `Mã khách hàng '${customerCode}' đã tồn tại.` });
        }
        res.status(500).json({ message: 'Lỗi máy chủ khi tạo khách hàng mới.', error: error.message });
    }
};

/**
 * @desc    Cập nhật thông tin khách hàng
 * @route   PUT /api/customers/:id
 * @access  Public
 */
const updateCustomer = async (req, res) => {
    const { id } = req.params;
    const { customerCode, companyName, contactPerson, phone, address, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID khách hàng không hợp lệ.' });
    }

    try {
        const updatedCustomer = await Customer.findByIdAndUpdate(
            id,
            { customerCode, companyName, contactPerson, phone, address, note },
            { new: true, runValidators: true, context: 'query' } // `new: true` để trả về document đã được cập nhật
        );

        if (!updatedCustomer) {
            return res.status(404).json({ message: 'Không tìm thấy khách hàng.' });
        }

        res.status(200).json(updatedCustomer);
    } catch (error) {
        // Xử lý lỗi validation từ Mongoose
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(' ') });
        }
        // Xử lý lỗi trùng lặp mã khách hàng (unique index)
        if (error.code === 11000) {
            return res.status(400).json({ message: `Mã khách hàng '${customerCode}' đã tồn tại.` });
        }
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật khách hàng.', error: error.message });
    }
};

/**
 * @desc    Xóa một khách hàng
 * @route   DELETE /api/customers/:id
 * @access  Public
 */
const deleteCustomer = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID khách hàng không hợp lệ.' });
    }

    try {
        const deletedCustomer = await Customer.findByIdAndDelete(id);

        if (!deletedCustomer) {
            return res.status(404).json({ message: 'Không tìm thấy khách hàng.' });
        }

        res.status(200).json({ message: 'Khách hàng đã được xóa thành công.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ khi xóa khách hàng.', error: error.message });
    }
};

/**
 * @desc    Lấy thông tin chi tiết một khách hàng
 * @route   GET /api/customers/:id
 * @access  Public
 */
const getCustomerById = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID khách hàng không hợp lệ.' });
    }

    try {
        const customer = await Customer.findById(id);

        if (!customer) {
            return res.status(404).json({ message: 'Không tìm thấy khách hàng.' });
        }

        res.status(200).json(customer);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy thông tin khách hàng.', error: error.message });
    }
};

module.exports = {
    getAllCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
};