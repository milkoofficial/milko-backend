const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate } = require('../middleware/auth');

/**
 * Subscription Routes (Customer)
 * Base path: /api/subscriptions
 * All routes require authentication
 */

router.use(authenticate); // All routes require authentication

router.get('/', subscriptionController.getMySubscriptions);
router.get('/:id', subscriptionController.getSubscriptionById);
router.post('/', subscriptionController.createSubscription);
router.post('/:id/pause', subscriptionController.pauseSubscription);
router.post('/:id/resume', subscriptionController.resumeSubscription);
router.post('/:id/cancel', subscriptionController.cancelSubscription);

module.exports = router;

