'use strict';

const express = require('express');
const validateRequest = require('../middleware/validateRequest');
const { authRequired } = require('../middleware/auth');
const { registerBody, loginBody } = require('../validators/auth.validator');
const { register, login, me } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', validateRequest({ body: registerBody }), register);
router.post('/login', validateRequest({ body: loginBody }), login);
router.get('/me', authRequired, me);

module.exports = router;
