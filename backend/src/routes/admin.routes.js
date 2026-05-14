'use strict';

const express = require('express');
const { adminAuth } = require('../middleware/adminAuth');
const c = require('../controllers/admin.controller');

const router = express.Router();

router.use(adminAuth);

router.post('/claims/:id/approve', c.approveFlaggedClaim);

module.exports = router;
