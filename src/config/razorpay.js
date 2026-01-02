const Razorpay = require('razorpay');
require('dotenv').config();

/**
 * Razorpay Configuration
 * Payment gateway for subscription payments (India)
 */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay subscription
 * @param {Object} options - Subscription options
 * @param {number} options.amount - Amount in paise (e.g., 10000 = ₹100)
 * @param {string} options.planId - Razorpay plan ID (or create plan on the fly)
 * @param {number} options.customerId - Razorpay customer ID
 * @returns {Promise<Object>} Razorpay subscription object
 */
const createSubscription = async (options) => {
  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: options.planId,
      customer_notify: 1,
      total_count: options.totalCount || 1, // Number of billing cycles
      start_at: options.startAt || Math.floor(Date.now() / 1000) + 60, // Start in 60 seconds
    });
    return subscription;
  } catch (error) {
    console.error('Razorpay subscription creation error:', error);
    throw new Error('Failed to create subscription');
  }
};

/**
 * Create a Razorpay order (for one-time payments)
 * @param {Object} options - Order options
 * @param {number} options.amount - Amount in paise
 * @param {string} options.currency - Currency (default: INR)
 * @param {string} options.receipt - Receipt ID
 * @returns {Promise<Object>} Razorpay order object
 */
const createOrder = async (options) => {
  try {
    const order = await razorpay.orders.create({
      amount: options.amount, // Amount in paise
      currency: options.currency || 'INR',
      receipt: options.receipt,
      notes: options.notes || {},
    });
    return order;
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    throw new Error('Failed to create order');
  }
};

/**
 * Verify webhook signature
 * @param {string} signature - Webhook signature
 * @param {string} orderId - Order ID
 * @param {string} paymentId - Payment ID
 * @returns {boolean} True if signature is valid
 */
const verifyWebhookSignature = (signature, orderId, paymentId) => {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expectedSignature === signature;
};

/**
 * Get payment details
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} Payment details
 */
const getPayment = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Razorpay get payment error:', error);
    throw new Error('Failed to fetch payment');
  }
};

module.exports = {
  razorpay,
  createSubscription,
  createOrder,
  verifyWebhookSignature,
  getPayment,
};

