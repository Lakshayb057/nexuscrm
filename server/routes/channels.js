const express = require('express');
const { protect, checkPermission } = require('../middleware/auth');
const {
  getChannels,
  createChannel,
  updateChannel,
  deleteChannel,
  exportChannels,
} = require('../controllers/channelController');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(checkPermission('organizations', 'read'), getChannels)
  .post(checkPermission('organizations', 'create'), createChannel);

router.get('/export', checkPermission('organizations', 'export'), exportChannels);

router
  .route('/:id')
  .put(checkPermission('organizations', 'update'), updateChannel)
  .delete(checkPermission('organizations', 'delete'), deleteChannel);

module.exports = router;
