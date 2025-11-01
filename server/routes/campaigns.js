const express = require('express');
const { protect, checkPermission } = require('../middleware/auth');
const {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  exportCampaigns,
} = require('../controllers/campaignController');

const router = express.Router();

router.use(protect);

// Allow reading campaigns if user has either campaigns.read OR donations.read/create
const canReadCampaigns = (req, res, next) => {
  try {
    if (req.user.role === 'admin') return next();
    const perms = req.user.permissions || {};
    if (perms.campaigns?.read) return next();
    if (perms.donations?.read || perms.donations?.create) return next();
    return res.status(403).json({ success: false, message: 'Not authorized to read campaigns' });
  } catch (e) {
    return res.status(403).json({ success: false, message: 'Not authorized to read campaigns' });
  }
};

router.route('/')
  .get(canReadCampaigns, getCampaigns)
  .post(checkPermission('campaigns', 'create'), createCampaign);

router.get('/export', checkPermission('campaigns', 'export'), exportCampaigns);

router.route('/:id')
  .put(checkPermission('campaigns', 'update'), updateCampaign)
  .delete(checkPermission('campaigns', 'delete'), deleteCampaign);

module.exports = router;
