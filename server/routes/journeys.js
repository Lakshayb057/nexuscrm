const express = require('express');
const { protect, checkPermission } = require('../middleware/auth');
const { getJourneys, getJourney, getJourneyRuns, createJourney, updateJourney, deleteJourney, activateJourney, deactivateJourney, enrollContacts } = require('../controllers/journeyController');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(checkPermission('journeys', 'read'), getJourneys)
  .post(checkPermission('journeys', 'create'), createJourney);

router.route('/:id')
  .get(checkPermission('journeys', 'read'), getJourney)
  .put(checkPermission('journeys', 'update'), updateJourney)
  .delete(checkPermission('journeys', 'delete'), deleteJourney);

router.post('/:id/activate', checkPermission('journeys', 'update'), activateJourney);
router.post('/:id/deactivate', checkPermission('journeys', 'update'), deactivateJourney);
router.post('/:id/enroll', checkPermission('journeys', 'create'), enrollContacts);
router.get('/:id/runs', checkPermission('journeys', 'read'), getJourneyRuns);

module.exports = router;
