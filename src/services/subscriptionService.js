const subscriptionModel = require('../models/subscription');
const productModel = require('../models/product');
const { createOrder } = require('../config/razorpay');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * Subscription Service
 * Handles subscription business logic
 */

/**
 * Create a new subscription
 * Creates subscription record and Razorpay order for payment
 * @param {Object} subscriptionData - Subscription data
 * @returns {Promise<Object>} Subscription and Razorpay order
 */
const createSubscription = async (subscriptionData) => {
  const { userId, productId, litresPerDay, durationMonths, deliveryTime } = subscriptionData;

  // Validate product exists and is active
  const product = await productModel.getProductById(productId);
  if (!product) {
    throw new NotFoundError('Product');
  }

  if (!product.is_active) {
    throw new ValidationError('Product is not available');
  }

  // Calculate dates
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + durationMonths);

  // Calculate total amount (price per litre * litres per day * days in duration)
  const daysInDuration = durationMonths * 30;
  const totalAmount = product.price_per_litre * litresPerDay * daysInDuration;
  const amountInPaise = Math.round(totalAmount * 100); // Convert to paise

  // Create Razorpay order
  const razorpayOrder = await createOrder({
    amount: amountInPaise,
    currency: 'INR',
    receipt: `milko_sub_${userId}_${Date.now()}`,
    notes: {
      userId,
      productId,
      litresPerDay,
      durationMonths,
      deliveryTime,
    },
  });

  // Create subscription record (status: pending until payment confirmed via webhook)
  const subscription = await subscriptionModel.createSubscription({
    userId,
    productId,
    litresPerDay,
    durationMonths,
    deliveryTime,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    razorpaySubscriptionId: razorpayOrder.id,
  });

  return {
    subscription,
    razorpayOrder: {
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: razorpayOrder.id,
    },
  };
};

/**
 * Activate subscription after payment confirmation
 * Called by webhook handler after successful payment
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise<Object>} Updated subscription
 */
const activateSubscription = async (subscriptionId) => {
  const subscription = await subscriptionModel.getSubscriptionById(subscriptionId);
  if (!subscription) {
    throw new NotFoundError('Subscription');
  }

  // Update status to active
  await subscriptionModel.updateSubscriptionStatus(subscriptionId, 'active');

  // Generate delivery schedules
  await subscriptionModel.generateDeliverySchedules(
    subscriptionId,
    subscription.start_date,
    subscription.end_date
  );

  return await subscriptionModel.getSubscriptionById(subscriptionId);
};

/**
 * Pause subscription
 * @param {string} subscriptionId - Subscription ID
 * @param {string|null} userId - User ID (for authorization check, null for admin)
 * @returns {Promise<Object>} Updated subscription
 */
const pauseSubscription = async (subscriptionId, userId) => {
  const subscription = await subscriptionModel.getSubscriptionById(subscriptionId);
  if (!subscription) {
    throw new NotFoundError('Subscription');
  }

  // Check authorization (user owns subscription or is admin - userId is null for admin)
  if (userId && subscription.user_id !== userId) {
    throw new ValidationError('Unauthorized');
  }

  if (subscription.status !== 'active') {
    throw new ValidationError('Only active subscriptions can be paused');
  }

  return await subscriptionModel.updateSubscriptionStatus(subscriptionId, 'paused');
};

/**
 * Resume subscription
 * @param {string} subscriptionId - Subscription ID
 * @param {string|null} userId - User ID (for authorization check, null for admin)
 * @returns {Promise<Object>} Updated subscription
 */
const resumeSubscription = async (subscriptionId, userId) => {
  const subscription = await subscriptionModel.getSubscriptionById(subscriptionId);
  if (!subscription) {
    throw new NotFoundError('Subscription');
  }

  // Check authorization (userId is null for admin)
  if (userId && subscription.user_id !== userId) {
    throw new ValidationError('Unauthorized');
  }

  if (subscription.status !== 'paused') {
    throw new ValidationError('Only paused subscriptions can be resumed');
  }

  return await subscriptionModel.updateSubscriptionStatus(subscriptionId, 'active');
};

/**
 * Cancel subscription
 * @param {string} subscriptionId - Subscription ID
 * @param {string} userId - User ID (for authorization check)
 * @returns {Promise<Object>} Updated subscription
 */
const cancelSubscription = async (subscriptionId, userId) => {
  const subscription = await subscriptionModel.getSubscriptionById(subscriptionId);
  if (!subscription) {
    throw new NotFoundError('Subscription');
  }

  // Check authorization
  if (subscription.user_id !== userId) {
    throw new ValidationError('Unauthorized');
  }

  return await subscriptionModel.updateSubscriptionStatus(subscriptionId, 'cancelled');
};

module.exports = {
  createSubscription,
  activateSubscription,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
};

