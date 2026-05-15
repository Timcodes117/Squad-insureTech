'use strict';

const express = require('express');
const validateRequest = require('../middleware/validateRequest');
const { authRequired } = require('../middleware/auth');
const v = require('../validators/user.validator');
const c = require('../controllers/user.controller');

const router = express.Router();

router.use(authRequired);

router.get('/me/wallet', c.getWallet);
router.get('/me/transactions', validateRequest({ query: v.listQuery }), c.listTransactions);
router.get('/me/claims', validateRequest({ query: v.listQuery }), c.listClaims);
router.post('/me/virtual-account/retry', c.retryVirtualAccount);

router.get('/me/withdrawable', c.getWithdrawable);
router.post('/me/withdraw', validateRequest({ body: v.withdrawBody }), c.withdraw);

module.exports = router;
