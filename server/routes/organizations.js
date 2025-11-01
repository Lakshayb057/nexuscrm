const express = require('express');
const { protect, checkPermission } = require('../middleware/auth');
const { getOrganizations, createOrganization, exportOrganizations, updateOrganization, deleteOrganization } = require('../controllers/organizationController');
const router = express.Router();

router.use(protect);

router.route('/')
  .get(checkPermission('organizations', 'read'), getOrganizations)
  .post(checkPermission('organizations', 'create'), createOrganization);

router.get('/export', checkPermission('organizations', 'export'), exportOrganizations);

router.route('/:id')
  .put(checkPermission('organizations', 'update'), updateOrganization)
  .delete(checkPermission('organizations', 'delete'), deleteOrganization);

module.exports = router;
