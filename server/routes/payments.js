const express = require('express');
const { protect, checkPermission } = require('../middleware/auth');
const { getPayments } = require('../controllers/donationController');

const router = express.Router();

router.use(protect);

router.get('/', checkPermission('payments', 'read'), getPayments);

module.exports = router;
