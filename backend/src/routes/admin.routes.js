'use strict';

const express = require('express');
const { adminAuth } = require('../middleware/adminAuth');
const c = require('../controllers/admin.controller');

const router = express.Router();

router.use(adminAuth);

router.post('/claims/:id/approve', c.approveFlaggedClaim);

router.post('/jobs/run-premium-burn', c.triggerPremiumBurn);
router.post('/jobs/run-coverage-reset', c.triggerCoverageReset);
router.post('/jobs/run-hospital-anomaly-scan', c.triggerHospitalAnomalyScan);

router.post('/hospitals/:id/clear-flag', c.clearHospitalFlag);

module.exports = router;
