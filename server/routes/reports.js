const express = require('express');
const { protect, checkPermission } = require('../middleware/auth');
const { getReports, getReport, createReport, deleteReport, runReport, exportReport, updateReport } = require('../controllers/reportController');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(checkPermission('reports', 'read'), getReports)
  .post(checkPermission('reports', 'create'), createReport);

router.route('/:id')
  .get(checkPermission('reports', 'read'), getReport)
  .put(checkPermission('reports', 'update'), updateReport)
  .delete(checkPermission('reports', 'delete'), deleteReport);

router.post('/:id/run', checkPermission('reports', 'read'), runReport);
router.get('/:id/export', checkPermission('reports', 'export'), exportReport);

module.exports = router;
