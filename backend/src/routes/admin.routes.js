'use strict';

const express = require('express');
const { adminAuth } = require('../middleware/adminAuth');
const c = require('../controllers/admin.controller');

const router = express.Router();

router.use(adminAuth);

// Read endpoints for the admin dashboard.
router.get('/stats', c.getStats);
router.get('/pool', c.getPool);
router.get('/users', c.listUsers);
router.get('/hospitals', c.listHospitals);
router.get('/claims', c.listClaims);

// Mutations.
router.post('/claims/:id/approve', c.approveFlaggedClaim);
router.post('/hospitals', c.createHospital);
router.post('/hospitals/:id/verify', c.verifyHospital);
router.post('/hospitals/:id/clear-flag', c.clearHospitalFlag);

router.post('/jobs/run-premium-burn', c.triggerPremiumBurn);
router.post('/jobs/run-coverage-reset', c.triggerCoverageReset);
router.post('/jobs/run-hospital-anomaly-scan', c.triggerHospitalAnomalyScan);

// Dev-only: simulate a Squad funding webhook from the API.
router.post('/dev/fund-user', c.devFundUser);

module.exports = router;
