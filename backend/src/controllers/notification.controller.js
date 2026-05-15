'use strict';

const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Notification = require('../models/Notification');

const list = asyncHandler(async (req, res) => {
  const { page, limit, unreadOnly } = req.query;
  const skip = (page - 1) * limit;

  const filter = { userId: req.user._id };
  if (unreadOnly) filter.isRead = false;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: req.user._id, isRead: false }),
  ]);

  res.json({
    success: true,
    data: {
      items,
      total,
      unreadCount,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    },
  });
});

const unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ userId: req.user._id, isRead: false });
  res.json({ success: true, data: { count } });
});

const markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!n) throw AppError.notFound('Notification not found');
  res.json({ success: true, data: { notification: n.toJSON() } });
});

const markAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  res.json({ success: true, data: { updated: result.modifiedCount || 0 } });
});

const remove = asyncHandler(async (req, res) => {
  const result = await Notification.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!result) throw AppError.notFound('Notification not found');
  res.json({ success: true, message: 'Notification deleted' });
});

module.exports = { list, unreadCount, markRead, markAllRead, remove };
