const PriceSetting = require('../models/PriceSetting');

// Dữ liệu mặc định nếu chưa có cài đặt trong DB
const defaultSettings = {
    markerPricing: [
        { id: 1, chargeWidth: 160, maxWidth: 159.99, unitPrice: 10000, isActive: true },
        { id: 2, chargeWidth: 185, maxWidth: 169.99, unitPrice: 12000, isActive: true },
        { id: 3, chargeWidth: 200, maxWidth: 999, unitPrice: 15000, isActive: true }
    ],
    markerCreationFee: 50000,
    gradingRate: 50000,
    designRate: 200000,
    digitizingRate: 80000,
    pdfTitle: 'DỊCH VỤ THIẾT KẾ & IN SƠ ĐỒ MAY MẶC',
    pdfAddress: 'Địa chỉ: 456 Đường XYZ, Quận Tân Bình, TP. HCM',
    pdfPhone: 'Điện thoại: 0987.654.321',
    pdfEmail: 'Email: support@insodo.com',
    pdfCreator: 'Lê Văn A',
};

// Hàm helper để lấy hoặc tạo cài đặt
const getOrCreateSettings = async () => {
    let settings = await PriceSetting.findOne({ singleton: 'singleton' });
    if (!settings) {
        console.log('No price settings found. Creating default settings.');
        settings = await PriceSetting.create(defaultSettings);
    }
    return settings;
};

/**
 * @desc    Lấy cài đặt bảng giá
 * @route   GET /api/settings/pricing
 * @access  Private
 */
const getPricingSettings = async (req, res) => {
    try {
        const settings = await getOrCreateSettings();
        res.json(settings);
    } catch (error) {
        console.error('Error fetching pricing settings:', error);
        res.status(500).json({ message: 'Lỗi khi lấy dữ liệu cài đặt bảng giá.', error: error.message });
    }
};

/**
 * @desc    Cập nhật cài đặt bảng giá
 * @route   PUT /api/settings/pricing
 * @access  Private
 */
const updatePricingSettings = async (req, res) => {
    try {
        const updatedSettings = await PriceSetting.findOneAndUpdate(
            { singleton: 'singleton' },
            req.body,
            { new: true, upsert: true, runValidators: true }
        );
        res.json(updatedSettings);
    } catch (error) {
        console.error('Error updating pricing settings:', error);
        res.status(400).json({ message: 'Lỗi khi cập nhật cài đặt bảng giá.', error: error.message });
    }
};

module.exports = {
    getPricingSettings,
    updatePricingSettings,
};