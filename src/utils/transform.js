/**
 * Data Transformation Utilities
 * Converts database snake_case to API camelCase
 */

/**
 * Transform subscription row from database to API format
 * @param {Object} row - Database row with snake_case
 * @returns {Object} API format with camelCase
 */
const transformSubscription = (row) => {
  if (!row) return null;

  return {
    id: String(row.id),
    userId: String(row.user_id),
    productId: String(row.product_id),
    product: row.product_name ? {
      id: String(row.product_id),
      name: row.product_name,
      description: row.product_description,
      pricePerLitre: parseFloat(row.price_per_litre),
      imageUrl: row.product_image_url,
      isActive: row.product_id ? true : false, // Assume active if product exists
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    } : undefined,
    litresPerDay: parseFloat(row.litres_per_day),
    durationMonths: parseInt(row.duration_months),
    deliveryTime: row.delivery_time,
    status: row.status,
    startDate: row.start_date?.toISOString().split('T')[0],
    endDate: row.end_date?.toISOString().split('T')[0],
    razorpaySubscriptionId: row.razorpay_subscription_id,
    createdAt: row.created_at?.toISOString(),
    updatedAt: row.updated_at?.toISOString(),
  };
};

/**
 * Transform product row from database to API format
 * @param {Object} row - Database row with snake_case
 * @returns {Object} API format with camelCase
 */
const transformProduct = (row) => {
  if (!row) return null;

  return {
    id: String(row.id),
    name: row.name,
    description: row.description,
    pricePerLitre: parseFloat(row.price_per_litre),
    imageUrl: row.image_url,
    isActive: row.is_active,
    createdAt: row.created_at?.toISOString(),
    updatedAt: row.updated_at?.toISOString(),
  };
};

/**
 * Transform user row from database to API format
 * @param {Object} row - Database row with snake_case
 * @returns {Object} API format with camelCase
 */
const transformUser = (row) => {
  if (!row) return null;

  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at?.toISOString(),
    updatedAt: row.updated_at?.toISOString(),
  };
};

module.exports = {
  transformSubscription,
  transformProduct,
  transformUser,
};

