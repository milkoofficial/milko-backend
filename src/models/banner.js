const { query } = require('../config/database');

/**
 * Banner Model
 * Handles all database operations for banners
 */

/**
 * Transform banner from database format (snake_case) to API format (camelCase)
 * @param {Object} banner - Banner row from database
 * @returns {Object|null} Transformed banner or null
 */
const transformBanner = (banner) => {
  if (!banner) return null;
  
  return {
    id: banner.id,
    title: banner.title,
    description: banner.description,
    imageUrl: banner.image_url,
    imagePublicId: banner.image_public_id,
    orderIndex: banner.order_index,
    isActive: banner.is_active,
    createdAt: banner.created_at?.toISOString(),
    updatedAt: banner.updated_at?.toISOString(),
  };
};

/**
 * Create a new banner
 * @param {Object} bannerData - Banner data
 * @returns {Promise<Object>} Created banner (camelCase format)
 */
const createBanner = async (bannerData) => {
  const { title, description, imageUrl, imagePublicId, orderIndex = 0, isActive = true } = bannerData;

  const result = await query(
    `INSERT INTO banners (title, description, image_url, image_public_id, order_index, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     RETURNING *`,
    [title, description, imageUrl, imagePublicId, orderIndex, isActive]
  );

  return transformBanner(result.rows[0]);
};

/**
 * Get all active banners (for homepage - ordered by order_index)
 * @returns {Promise<Array>} Array of active banners (camelCase format)
 */
const getActiveBanners = async () => {
  const result = await query(
    'SELECT * FROM banners WHERE is_active = true ORDER BY order_index ASC, created_at DESC'
  );

  return result.rows.map(transformBanner);
};

/**
 * Get all banners (for admin - includes inactive)
 * @returns {Promise<Array>} Array of all banners (camelCase format)
 */
const getAllBanners = async () => {
  const result = await query(
    'SELECT * FROM banners ORDER BY order_index ASC, created_at DESC'
  );

  return result.rows.map(transformBanner);
};

/**
 * Get banner by ID
 * @param {string} bannerId - Banner ID
 * @returns {Promise<Object|null>} Banner object or null (camelCase format)
 */
const getBannerById = async (bannerId) => {
  const result = await query(
    'SELECT * FROM banners WHERE id = $1',
    [bannerId]
  );

  return transformBanner(result.rows[0] || null);
};

/**
 * Update banner
 * @param {string} bannerId - Banner ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated banner (camelCase format)
 */
const updateBanner = async (bannerId, updates) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  Object.keys(updates).forEach((key) => {
    // Map camelCase to snake_case
    const dbKey = key === 'imageUrl' ? 'image_url' : 
                  key === 'imagePublicId' ? 'image_public_id' :
                  key === 'orderIndex' ? 'order_index' : 
                  key === 'isActive' ? 'is_active' : key;
    
    fields.push(`${dbKey} = $${paramCount}`);
    values.push(updates[key]);
    paramCount++;
  });

  fields.push(`updated_at = NOW()`);
  values.push(bannerId);

  const result = await query(
    `UPDATE banners 
     SET ${fields.join(', ')} 
     WHERE id = $${paramCount}
     RETURNING *`,
    values
  );

  return transformBanner(result.rows[0]);
};

/**
 * Delete banner (hard delete - also deletes image from Cloudinary)
 * @param {string} bannerId - Banner ID
 * @returns {Promise<Object>} Deleted banner (camelCase format)
 */
const deleteBanner = async (bannerId) => {
  const result = await query(
    `DELETE FROM banners 
     WHERE id = $1
     RETURNING *`,
    [bannerId]
  );

  return transformBanner(result.rows[0]);
};

module.exports = {
  createBanner,
  getActiveBanners,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
};

