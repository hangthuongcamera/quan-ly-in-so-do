const express = require('express');
const router = express.Router();
const { getAllCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomerById } = require('../controllers/customerController');

// Định nghĩa route cho GET và POST trên /api/customers
router.route('/')
    .get(getAllCustomers)
    .post(createCustomer);

// Định nghĩa route cho GET, PUT và DELETE trên /api/customers/:id
router.route('/:id')
    .get(getCustomerById)
    .put(updateCustomer)
    .delete(deleteCustomer);

module.exports = router;