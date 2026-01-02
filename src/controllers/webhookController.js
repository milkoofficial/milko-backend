const subscriptionService = require('../services/subscriptionService');
const { verifyWebhookSignature, getPayment } = require('../config/razorpay');
const { ValidationError } = require('../utils/errors');

/**
 * Webhook Controller
 * Handles Razorpay webhook events
 */

/**
 * Handle Razorpay webhook
 * POST /api/webhooks/razorpay
 * 
 * Webhook events to handle:
 * - payment.captured: Payment successful, activate subscription
 * - payment.failed: Payment failed, mark subscription as failed
 * - subscription.activated: Subscription activated
 * - subscription.cancelled: Subscription cancelled
 */
const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    
    // req.body is raw buffer from express.raw() middleware
    const webhookBody = req.body.toString();

    // Verify webhook signature
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(webhookBody)
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature',
      });
    }

    // Parse JSON body
    const body = JSON.parse(webhookBody);
    const event = body.event;
    const payload = body.payload;

    console.log('Razorpay webhook event:', event);

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        // Payment successful - activate subscription
        await handlePaymentCaptured(payload);
        break;

      case 'payment.failed':
        // Payment failed - log for admin review
        await handlePaymentFailed(payload);
        break;

      case 'subscription.activated':
        // Subscription activated
        await handleSubscriptionActivated(payload);
        break;

      case 'subscription.cancelled':
        // Subscription cancelled
        await handleSubscriptionCancelled(payload);
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }

    // Always return 200 to acknowledge webhook receipt
    res.status(200).json({
      success: true,
      message: 'Webhook received',
    });
  } catch (error) {
    console.error('Webhook error:', error);
    // Still return 200 to prevent Razorpay from retrying
    res.status(200).json({
      success: false,
      error: 'Webhook processing failed',
    });
  }
};

/**
 * Handle payment captured event
 */
const handlePaymentCaptured = async (payload) => {
  const payment = payload.payment.entity;
  const orderId = payment.order_id;

  // Find subscription by Razorpay order ID
  const { query } = require('../config/database');
  const result = await query(
    'SELECT id FROM subscriptions WHERE razorpay_subscription_id = $1',
    [orderId]
  );

  if (result.rows.length > 0) {
    const subscriptionId = result.rows[0].id;
    await subscriptionService.activateSubscription(subscriptionId);
    console.log(`Subscription ${subscriptionId} activated after payment`);
  }
};

/**
 * Handle payment failed event
 */
const handlePaymentFailed = async (payload) => {
  const payment = payload.payment.entity;
  console.log('Payment failed:', payment.id, payment.error_description);
  // Log for admin review - could send notification
};

/**
 * Handle subscription activated event
 */
const handleSubscriptionActivated = async (payload) => {
  const subscription = payload.subscription.entity;
  console.log('Subscription activated:', subscription.id);
  // Additional handling if needed
};

/**
 * Handle subscription cancelled event
 */
const handleSubscriptionCancelled = async (payload) => {
  const subscription = payload.subscription.entity;
  console.log('Subscription cancelled:', subscription.id);
  
  // Update subscription status in database
  const { query } = require('../config/database');
  await query(
    'UPDATE subscriptions SET status = $1 WHERE razorpay_subscription_id = $2',
    ['cancelled', subscription.id]
  );
};

module.exports = {
  handleRazorpayWebhook,
};

