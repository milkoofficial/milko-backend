const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const { transformUser } = require('../utils/transform');

/**
 * User Model
 * Handles all database operations for users
 */

/**
 * Create a new user
 * @param {Object} userData - User data (name, email, password, role)
 * @returns {Promise<Object>} Created user (without password, camelCase format)
 */
const createUser = async (userData) => {
  const { name, email, password, role = 'customer' } = userData;

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await query(
    `INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, hashedPassword, role]
  );

  return transformUser(result.rows[0]);
};

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null
 */
const findByEmail = async (email) => {
  const result = await query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  return result.rows[0] || null;
};

/**
 * Find user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User object or null (camelCase format)
 */
const findById = async (userId) => {
  const result = await query(
    'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );

  return transformUser(result.rows[0] || null);
};

/**
 * Get all users (for admin)
 * @param {Object} options - Query options (limit, offset)
 * @returns {Promise<Array>} Array of users (camelCase format)
 */
const getAllUsers = async (options = {}) => {
  const { limit = 100, offset = 0 } = options;

  const result = await query(
    `SELECT id, name, email, role, created_at, updated_at 
     FROM users 
     ORDER BY created_at DESC 
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return result.rows.map(transformUser);
};

/**
 * Verify password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if password matches
 */
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user (camelCase format)
 */
const updateUser = async (userId, updates) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  Object.keys(updates).forEach((key) => {
    if (key !== 'password') {
      fields.push(`${key} = $${paramCount}`);
      values.push(updates[key]);
      paramCount++;
    }
  });

  if (updates.password) {
    const hashedPassword = await bcrypt.hash(updates.password, 10);
    fields.push(`password_hash = $${paramCount}`);
    values.push(hashedPassword);
    paramCount++;
  }

  fields.push(`updated_at = NOW()`);
  values.push(userId);

  const result = await query(
    `UPDATE users 
     SET ${fields.join(', ')} 
     WHERE id = $${paramCount}
     RETURNING id, name, email, role, created_at, updated_at`,
    values
  );

  return transformUser(result.rows[0]);
};

module.exports = {
  createUser,
  findByEmail,
  findById,
  getAllUsers,
  verifyPassword,
  updateUser,
};

