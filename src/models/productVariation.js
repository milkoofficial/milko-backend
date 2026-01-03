const { query } = require('../config/database');

/**
 * Product Variation Model
 * Handles database operations for product variations (sizes)
 */

/**
 * Create a new product variation
 */
const createProductVariation = async (productId, size, priceMultiplier = 1.0, isAvailable = true, displayOrder = 0) => {
  const result = await query(
    `INSERT INTO product_variations (product_id, size, price_multiplier, is_available, display_order, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING *`,
    [productId, size, priceMultiplier, isAvailable, displayOrder]
  );

  return {
    id: result.rows[0].id.toString(),
    productId: result.rows[0].product_id.toString(),
    size: result.rows[0].size,
    priceMultiplier: parseFloat(result.rows[0].price_multiplier),
    isAvailable: result.rows[0].is_available,
    displayOrder: result.rows[0].display_order,
    createdAt: result.rows[0].created_at.toISOString(),
    updatedAt: result.rows[0].updated_at.toISOString(),
  };
};

/**
 * Get all variations for a product
 */
const getProductVariations = async (productId) => {
  const result = await query(
    `SELECT * FROM product_variations 
     WHERE product_id = $1 
     ORDER BY display_order ASC, created_at ASC`,
    [productId]
  );

  return result.rows.map(row => ({
    id: row.id.toString(),
    productId: row.product_id.toString(),
    size: row.size,
    priceMultiplier: parseFloat(row.price_multiplier),
    isAvailable: row.is_available,
    displayOrder: row.display_order,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }));
};

/**
 * Update a product variation
 */
const updateProductVariation = async (variationId, updates) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  Object.keys(updates).forEach((key) => {
    const dbKey = key === 'priceMultiplier' ? 'price_multiplier' :
                  key === 'isAvailable' ? 'is_available' :
                  key === 'displayOrder' ? 'display_order' : key;
    
    fields.push(`${dbKey} = $${paramCount}`);
    values.push(updates[key]);
    paramCount++;
  });

  fields.push(`updated_at = NOW()`);
  values.push(variationId);

  const result = await query(
    `UPDATE product_variations 
     SET ${fields.join(', ')} 
     WHERE id = $${paramCount}
     RETURNING *`,
    values
  );

  if (!result.rows[0]) return null;

  const row = result.rows[0];
  return {
    id: row.id.toString(),
    productId: row.product_id.toString(),
    size: row.size,
    priceMultiplier: parseFloat(row.price_multiplier),
    isAvailable: row.is_available,
    displayOrder: row.display_order,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
};

/**
 * Delete a product variation
 */
const deleteProductVariation = async (variationId) => {
  const result = await query(
    'DELETE FROM product_variations WHERE id = $1 RETURNING *',
    [variationId]
  );

  return result.rows[0] ? {
    id: result.rows[0].id.toString(),
    productId: result.rows[0].product_id.toString(),
    size: result.rows[0].size,
  } : null;
};

module.exports = {
  createProductVariation,
  getProductVariations,
  updateProductVariation,
  deleteProductVariation,
};

