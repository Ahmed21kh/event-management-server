const express = require('express');
const router = express.Router()
const customerController = require("../controller/customerControler");
const bodyParser = require('body-parser');

router.post('/add-customer', bodyParser.json({ extended: true }),customerController.addCustomer)
router.get('/get-customers',customerController.getCustomers)

module.exports = router