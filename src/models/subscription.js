const { query, getClient } = require('../config/database');
const { transformSubscription } = require('../utils/transform');

/**
 * Subscription Model
 * Handles all database operations for subscriptions
 */

/**
 * Create a new subscription
 * @param {Object} subscriptionData - Subscription data
 * @returns {Promise<Object>} Created subscription (camelCase format)
 */
const createSubscription = async (subscriptionData) => {
  const {
    userId,
    productId,
    litresPerDay,
    durationMonths,
    deliveryTime,
    startDate,
    endDate,
    razorpaySubscriptionId,
  } = subscriptionData;

  const result = await query(
    `INSERT INTO subscriptions 
     (user_id, product_id, litres_per_day, duration_months, delivery_time, 
      start_date, end_date, razorpay_subscription_id, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW(), NOW())
     RETURNING *`,
    [userId, productId, litresPerDay, durationMonths, deliveryTime, startDate, endDate, razorpaySubscriptionId]
  );

  // Fetch with product data for transformation
  return await getSubscriptionById(result.rows[0].id);
};

/**
 * Get all subscriptions for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of subscriptions (camelCase format)
 */
const getSubscriptionsByUserId = async (userId) => {
  const result = await query(
    `SELECT s.*, p.name as product_name, p.description as product_description, 
            p.price_per_litre, p.image_url as product_image_url
     FROM subscriptions s
     LEFT JOIN products p ON s.product_id = p.id
     WHERE s.user_id = $1
     ORDER BY s.created_at DESC`,
    [userId]
  );

  return result.rows.map(transformSubscription);
};

/**
 * Get all subscriptions (for admin)
 * @returns {Promise<Array>} Array of all subscriptions (camelCase format)
 */
const getAllSubscriptions = async () => {
  const result = await query(
    `SELECT s.*, p.name as product_name, p.description as product_description,
            p.price_per_litre, p.image_url as product_image_url,
            u.name as user_name, u.email as user_email
     FROM subscriptions s
     LEFT JOIN products p ON s.product_id = p.id
     LEFT JOIN users u ON s.user_id = u.id
     ORDER BY s.created_at DESC`
  );

  return result.rows.map(transformSubscription);
};

/**
 * Get subscription by ID
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise<Object|null>} Subscription object or null (camelCase format)
 */
const getSubscriptionById = async (subscriptionId) => {
  const result = await query(
    `SELECT s.*, p.name as product_name, p.description as product_description, 
            p.price_per_litre, p.image_url as product_image_url
     FROM subscriptions s
     LEFT JOIN products p ON s.product_id = p.id
     WHERE s.id = $1`,
    [subscriptionId]
  );

  return transformSubscription(result.rows[0] || null);
};

/**
 * Update subscription status
 * @param {string} subscriptionId - Subscription ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated subscription (camelCase format)
 */
const updateSubscriptionStatus = async (subscriptionId, status) => {
  const result = await query(
    `UPDATE subscriptions 
     SET status = $1, updated_at = NOW() 
     WHERE id = $2
     RETURNING *`,
    [status, subscriptionId]
  );

  // Need to fetch with product data for transformation
  return await getSubscriptionById(subscriptionId);
};

/**
 * Generate delivery schedules for a subscription
 * Creates daily delivery entries from start_date to end_date, skipping paused dates
 * @param {string} subscriptionId - Subscription ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Array of created delivery schedules
 */
const generateDeliverySchedules = async (subscriptionId, startDate, endDate) => {
  const client = await getClient();
  const schedules = [];
  
  try {
    await client.query('BEGIN');

    // Get paused dates for this subscription
    const pausedDatesResult = await client.query(
      'SELECT date FROM paused_dates WHERE subscription_id = $1',
      [subscriptionId]
    );
    const pausedDates = new Set(
      pausedDatesResult.rows.map(row => row.date.toISOString().split('T')[0])
    );

    // Generate dates from start to end
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];

      // Skip paused dates
      if (!pausedDates.has(dateStr)) {
        const result = await client.query(
          `INSERT INTO delivery_schedules (subscription_id, delivery_date, status, created_at)
           VALUES ($1, $2, 'pending', NOW())
           ON CONFLICT (subscription_id, delivery_date) DO NOTHING
           RETURNING *`,
          [subscriptionId, dateStr]
        );

        if (result.rows.length > 0) {
          schedules.push(result.rows[0]);
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    await client.query('COMMIT');
    return schedules;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createSubscription,
  getSubscriptionsByUserId,
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscriptionStatus,
  generateDeliverySchedules,
};

