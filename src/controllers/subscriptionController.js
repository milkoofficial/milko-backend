const subscriptionService = require('../services/subscriptionService');
const subscriptionModel = require('../models/subscription');
const { ValidationError } = require('../utils/errors');

/**
 * Subscription Controller
 * Handles subscription HTTP requests
 */

/**
 * Get all subscriptions for current user
 * GET /api/subscriptions
 */
const getMySubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await subscriptionModel.getSubscriptionsByUserId(req.user.id);

    res.json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get subscription by ID
 * GET /api/subscriptions/:id
 */
const getSubscriptionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = await subscriptionModel.getSubscriptionById(id);

    // Check authorization
    if (subscription.user_id !== req.user.id && req.user.role !== 'admin') {
      throw new ValidationError('Unauthorized');
    }

    res.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new subscription
 * POST /api/subscriptions
 */
const createSubscription = async (req, res, next) => {
  try {
    const { productId, litresPerDay, durationMonths, deliveryTime } = req.body;

    if (!productId || !litresPerDay || !durationMonths || !deliveryTime) {
      throw new ValidationError('All fields are required');
    }

    const result = await subscriptionService.createSubscription({
      userId: req.user.id,
      productId,
      litresPerDay,
      durationMonths,
      deliveryTime,
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Subscription created. Please complete payment.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Pause subscription
 * POST /api/subscriptions/:id/pause
 */
const pauseSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = await subscriptionService.pauseSubscription(id, req.user.id);

    res.json({
      success: true,
      data: subscription,
      message: 'Subscription paused',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resume subscription
 * POST /api/subscriptions/:id/resume
 */
const resumeSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = await subscriptionService.resumeSubscription(id, req.user.id);

    res.json({
      success: true,
      data: subscription,
      message: 'Subscription resumed',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel subscription
 * POST /api/subscriptions/:id/cancel
 */
const cancelSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = await subscriptionService.cancelSubscription(id, req.user.id);

    res.json({
      success: true,
      data: subscription,
      message: 'Subscription cancelled',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMySubscriptions,
  getSubscriptionById,
  createSubscription,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
};

