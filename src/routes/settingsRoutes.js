const express = require('express');
const router = express.Router();
const { getPricingSettings, updatePricingSettings } = require('../controllers/settingsController');

// @route   GET /api/settings/pricing
// @desc    Lấy toàn bộ cài đặt bảng giá
// @access  Private (sẽ cần middleware xác thực sau này)
router.get('/', getPricingSettings);

// @route   PUT /api/settings/pricing
// @desc    Cập nhật cài đặt bảng giá
// @access  Private
router.put('/', updatePricingSettings);

module.exports = router;