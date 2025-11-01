const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPageConfigs,
  getPageConfig,
  updatePageConfig,
  resetPageConfig,
  getAvailablePages
} = require('../controllers/pageConfigController');

// All routes are protected and require admin access
router.use(protect);
router.use(authorize('admin'));

// Get all page configurations
router.get('/', getPageConfigs);

// Get available pages
router.get('/available-pages', getAvailablePages);

// Get single page configuration
router.get('/:pageName', getPageConfig);

// Update page configuration
router.put('/:pageName', updatePageConfig);

// Reset page configuration to default
router.delete('/:pageName/reset', resetPageConfig);

module.exports = router;
