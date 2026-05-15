'use strict';

const express = require('express');
const authRoutes = require('./auth.routes');
const healthRoutes = require('./health.routes');
const webhookRoutes = require('./webhook.routes');
const hospitalRoutes = require('./hospital.routes');
const userRoutes = require('./user.routes');
const adminRoutes = require('./admin.routes');
const notificationRoutes = require('./notification.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/hospital', hospitalRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
