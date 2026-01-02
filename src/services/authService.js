const userModel = require('../models/user');
const { generateToken } = require('../utils/jwt');
const { ValidationError, AuthenticationError } = require('../utils/errors');

/**
 * Auth Service
 * Handles authentication business logic
 */

/**
 * Register a new customer
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} User and token
 */
const register = async (userData) => {
  const { name, email, password } = userData;

  // Check if user already exists
  const existingUser = await userModel.findByEmail(email);
  if (existingUser) {
    throw new ValidationError('Email already registered');
  }

  // Create user (default role is 'customer')
  const user = await userModel.createUser({
    name,
    email,
    password,
    role: 'customer',
  });

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Remove password from response
  const { password_hash, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User and token
 */
const login = async (email, password) => {
  // Find user by email
  const user = await userModel.findByEmail(email);
  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await userModel.verifyPassword(password, user.password_hash);
  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Remove password from response
  const { password_hash, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
};

/**
 * Get current user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User object
 */
const getCurrentUser = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  return user;
};

module.exports = {
  register,
  login,
  getCurrentUser,
};

