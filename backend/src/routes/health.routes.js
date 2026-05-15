'use strict';

const express = require('express');
const mongoose = require('mongoose');
const config = require('../config/env');
const { getRedis } = require('../config/redis');

const router = express.Router();

const VERSION = '1.0.0';

function mongoStatus() {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}

async function redisStatus() {
  const client = getRedis();
  if (!client) return 'disconnected';
  try {
    const pong = await client.ping();
    return pong === 'PONG' ? 'connected' : 'disconnected';
  } catch {
    return 'disconnected';
  }
}

function squadStatus() {
  return config.squad.secretKey ? 'configured' : 'missing';
}

function twilioStatus() {
  return config.twilio.accountSid && config.twilio.authToken && config.twilio.phoneNumber
    ? 'configured'
    : 'skipped';
}

router.get('/', async (_req, res) => {
  const [redis] = await Promise.all([redisStatus()]);
  res.json({
    success: true,
    data: {
      service: 'betahealth-api',
      version: VERSION,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      mongo: mongoStatus(),
      redis,
      squad: squadStatus(),
      twilio: twilioStatus(),
    },
  });
});

module.exports = router;
