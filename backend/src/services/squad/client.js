'use strict';

const axios = require('axios');
const config = require('../../config/env');
const logger = require('../../config/logger');

const squadClient = axios.create({
  baseURL: config.squad.baseUrl,
  timeout: 30_000,
  headers: {
    Authorization: `Bearer ${config.squad.secretKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

squadClient.interceptors.request.use((req) => {
  logger.debug(
    { method: req.method, url: req.url, baseURL: req.baseURL },
    'squad: outgoing request'
  );
  return req;
});

squadClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const ctx = {
      method: err.config?.method,
      url: err.config?.url,
      status: err.response?.status,
      data: err.response?.data,
      message: err.message,
    };
    logger.error({ squad: ctx }, 'squad: response error');
    return Promise.reject(err);
  }
);

module.exports = squadClient;
