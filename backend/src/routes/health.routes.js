'use strict';

const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/', (_req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'mybodycover-api',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      db: dbStates[mongoose.connection.readyState] || 'unknown',
    },
  });
});

module.exports = router;
