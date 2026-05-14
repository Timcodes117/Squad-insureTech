'use strict';

const express = require('express');
const { handleSquadWebhook } = require('../controllers/webhook.controller');

const router = express.Router();

// No auth middleware — signature verification happens inside the controller.
// req.rawBody is captured in app.js via express.json({ verify }).
router.post('/squad', handleSquadWebhook);

module.exports = router;
