const mongoose = require('mongoose');

const MarkerPricingSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    chargeWidth: { type: Number, required: true },
    maxWidth: { type: Number, required: true },
    unitPrice: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, required: true, default: true }
}, { _id: false }); // Không cần _id cho sub-document

const PriceSettingSchema = new mongoose.Schema({
    // Sử dụng một trường duy nhất để đảm bảo chỉ có một document cài đặt
    singleton: {
        type: String,
        default: 'singleton',
        unique: true,
    },
    markerPricing: [MarkerPricingSchema],
    markerCreationFee: { type: Number, default: 0 },
    gradingRate: { type: Number, default: 0 },
    designRate: { type: Number, default: 0 },
    digitizingRate: { type: Number, default: 0 },
    pdfTitle: { type: String, default: 'DỊCH VỤ THIẾT KẾ & IN SƠ ĐỒ MAY MẶC' },
    pdfAddress: { type: String, default: 'Địa chỉ: 456 Đường XYZ, Quận Tân Bình, TP. HCM' },
    pdfPhone: { type: String, default: 'Điện thoại: 0987.654.321' },
    pdfEmail: { type: String, default: 'Email: support@insodo.com' },
    pdfCreator: { type: String, default: 'Lê Văn A' },
}, {
    timestamps: true // Tự động thêm createdAt và updatedAt
});

module.exports = mongoose.model('PriceSetting', PriceSettingSchema);