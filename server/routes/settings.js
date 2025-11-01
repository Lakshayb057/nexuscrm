const express = require('express');
const { getSettings, updateSettings, resetSettings } = require('../controllers/settingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getSettings);
router.put('/', protect, authorize('admin'), updateSettings);
router.post('/reset', protect, authorize('admin'), resetSettings);

module.exports = router;
