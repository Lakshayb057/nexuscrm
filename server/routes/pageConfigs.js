const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const pageConfigController = require('../controllers/pageConfigController');

// Protect all routes with authentication and admin access
router.use(protect);
router.use(authorize('admin'));

// Get all page configurations
router.get('/', pageConfigController.getPageConfigs);

// Get available pages
router.get('/available-pages', pageConfigController.getAvailablePages);

// Get single page configuration
router.get('/:pageName', pageConfigController.getPageConfig);

// Update page configuration
router.put('/:pageName', pageConfigController.updatePageConfig);

// Reset page configuration to default
router.delete('/:pageName/reset', pageConfigController.resetPageConfig);

module.exports = router;
