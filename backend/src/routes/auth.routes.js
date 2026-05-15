'use strict';

const express = require('express');
const validateRequest = require('../middleware/validateRequest');
const { authRequired } = require('../middleware/auth');
const v = require('../validators/auth.validator');
const c = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', validateRequest({ body: v.registerBody }), c.register);
router.post('/login', validateRequest({ body: v.loginBody }), c.login);

// Two-step OTP login.
router.post('/login/request-otp', validateRequest({ body: v.requestOtpBody }), c.requestLoginOtp);
router.post('/login/verify-otp', validateRequest({ body: v.verifyOtpBody }), c.verifyLoginOtp);

// Forgot/reset password.
router.post('/forgot-password', validateRequest({ body: v.forgotPasswordBody }), c.forgotPassword);
router.post('/reset-password', validateRequest({ body: v.resetPasswordBody }), c.resetPassword);

router.get('/me', authRequired, c.me);

module.exports = router;
