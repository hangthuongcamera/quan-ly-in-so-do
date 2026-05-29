const express = require('express');
const router = express.Router();
const { createOrder, getAllOrders, getOrderById, deleteOrder, updateOrder } = require('../controllers/orderController');

router.route('/')
    .post(createOrder)
    .get(getAllOrders);

router.route('/:id')
    .get(getOrderById)
    .put(updateOrder)
    .delete(deleteOrder);

module.exports = router;