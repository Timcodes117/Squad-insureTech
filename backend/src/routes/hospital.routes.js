'use strict';

const express = require('express');
const validateRequest = require('../middleware/validateRequest');
const { hospitalAuth } = require('../middleware/hospitalAuth');
const v = require('../validators/hospital.validator');
const c = require('../controllers/hospital.controller');

const router = express.Router();

router.post('/register', validateRequest({ body: v.registerBody }), c.registerHospital);

router.get(
  '/users/lookup',
  hospitalAuth,
  validateRequest({ query: v.userLookupQuery }),
  c.lookupUser
);

router.post(
  '/claims',
  hospitalAuth,
  validateRequest({ body: v.submitClaimBody }),
  c.submitClaim
);

router.get(
  '/claims',
  hospitalAuth,
  validateRequest({ query: v.listQuery }),
  c.listClaims
);

module.exports = router;
