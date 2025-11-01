const express = require('express');
const { protect, checkPermission } = require('../middleware/auth');
const { getReceipts, generateReceipts, exportReceipts } = require('../controllers/receiptController');

const router = express.Router();

router.use(protect);

router.get('/', checkPermission('receipts', 'read'), getReceipts);
router.post('/generate', checkPermission('receipts', 'create'), generateReceipts);
router.get('/export', checkPermission('receipts', 'export'), exportReceipts);

module.exports = router;
