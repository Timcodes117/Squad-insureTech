'use strict';

const express = require('express');
const validateRequest = require('../middleware/validateRequest');
const { authRequired } = require('../middleware/auth');
const v = require('../validators/notification.validator');
const c = require('../controllers/notification.controller');

const router = express.Router();

router.use(authRequired);

router.get('/', validateRequest({ query: v.listQuery }), c.list);
router.get('/unread-count', c.unreadCount);
router.post('/read-all', c.markAllRead);
router.post('/:id/read', c.markRead);
router.delete('/:id', c.remove);

module.exports = router;
