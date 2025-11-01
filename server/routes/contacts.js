const express = require('express');
const {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  exportContacts
} = require('../controllers/contactController');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(checkPermission('contacts', 'read'), getContacts)
  .post(checkPermission('contacts', 'create'), createContact);

router.route('/export')
  .get(checkPermission('contacts', 'export'), exportContacts);

router.route('/:id')
  .get(checkPermission('contacts', 'read'), getContact)
  .put(checkPermission('contacts', 'update'), updateContact)
  .delete(checkPermission('contacts', 'delete'), deleteContact);

module.exports = router;
