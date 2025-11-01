const express = require('express');
const { protect, checkPermission } = require('../middleware/auth');
const {
  getAgencies,
  createAgency,
  updateAgency,
  deleteAgency,
  exportAgencies,
} = require('../controllers/agencyController');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(checkPermission('organizations', 'read'), getAgencies)
  .post(checkPermission('organizations', 'create'), createAgency);

router.get('/export', checkPermission('organizations', 'export'), exportAgencies);

router
  .route('/:id')
  .put(checkPermission('organizations', 'update'), updateAgency)
  .delete(checkPermission('organizations', 'delete'), deleteAgency);

module.exports = router;
