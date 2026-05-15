'use strict';

const express = require('express');
const { handleSquadWebhook } = require('../controllers/webhook.controller');

const router = express.Router();

// HMAC verification happens inside the controller, against req.rawBody.
router.post('/squad', handleSquadWebhook);

module.exports = router;
