'use strict';

const mongoose = require('mongoose');
const config = require('./env');
const logger = require('./logger');

mongoose.set('strictQuery', true);

async function connect() {
  mongoose.connection.on('connected', () => {
    logger.info({ host: mongoose.connection.host }, 'mongo: connected');
  });
  mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'mongo: connection error');
  });
  mongoose.connection.on('disconnected', () => {
    logger.warn('mongo: disconnected');
  });

  await mongoose.connect(config.mongo.uri, {
    serverSelectionTimeoutMS: 15000,
    maxPoolSize: 10,
  });

  return mongoose.connection;
}

async function disconnect() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('mongo: gracefully disconnected');
  }
}

module.exports = { connect, disconnect, mongoose };
