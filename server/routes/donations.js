const express = require('express');
const { protect, checkPermission } = require('../middleware/auth');
const { 
  getDonations, 
  createDonation, 
  updateDonation, 
  deleteDonation, 
  exportDonations,
  getMonthlyDonationStatus,
  updateSubscriptionStatus
} = require('../controllers/donationController');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(checkPermission('donations', 'read'), getDonations)
  .post(checkPermission('donations', 'create'), createDonation);

router.get('/export', checkPermission('donations', 'export'), exportDonations);

// Monthly donation status routes
router.get('/monthly/status', checkPermission('donations', 'read'), getMonthlyDonationStatus);

router.route('/:id')
  .put(checkPermission('donations', 'update'), updateDonation)
  .delete(checkPermission('donations', 'delete'), deleteDonation);

router.put('/:id/subscription', checkPermission('donations', 'update'), updateSubscriptionStatus);

module.exports = router;
