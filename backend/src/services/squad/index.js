'use strict';

const client = require('./client');
const { createVirtualAccount } = require('./virtualAccount');
const {
  buildTransferReference,
  lookupAccount,
  initiateTransfer,
  requeryTransfer,
} = require('./transfer');
const { verifyWebhookSignature } = require('./webhooks');

module.exports = {
  client,
  createVirtualAccount,
  buildTransferReference,
  lookupAccount,
  initiateTransfer,
  requeryTransfer,
  verifyWebhookSignature,
};
