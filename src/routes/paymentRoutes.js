const express = require('express');
const router = express.Router();
const { createPayment, getReceivables, getAllPayments } = require('../controllers/paymentController');

// Route cho việc thanh toán
router.route('/payments')
    .post(createPayment)
    .get(getAllPayments);

// Route cho việc xem công nợ
router.get('/receivables', getReceivables);

module.exports = router;
