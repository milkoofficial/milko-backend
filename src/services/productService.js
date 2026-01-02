const productModel = require('../models/product');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * Product Service
 * Handles product business logic
 */

/**
 * Get all active products (for customers)
 * @returns {Promise<Array>} Array of active products
 */
const getActiveProducts = async () => {
  return await productModel.getActiveProducts();
};

/**
 * Get all products (for admin)
 * @returns {Promise<Array>} Array of all products
 */
const getAllProducts = async () => {
  return await productModel.getAllProducts();
};

/**
 * Get product by ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Product object
 */
const getProductById = async (productId) => {
  const product = await productModel.getProductById(productId);
  if (!product) {
    throw new NotFoundError('Product');
  }
  return product;
};

/**
 * Create new product (admin only)
 * @param {Object} productData - Product data
 * @param {Object} imageFile - Image file (optional)
 * @returns {Promise<Object>} Created product
 */
const createProduct = async (productData, imageFile = null) => {
  const { name, description, pricePerLitre, isActive } = productData;

  // Validate required fields
  if (!name || !pricePerLitre) {
    throw new ValidationError('Name and price are required');
  }

  let imageUrl = null;

  // Upload image if provided
  if (imageFile) {
    const uploadResult = await uploadImage(imageFile.buffer, {
      resource_type: 'image',
      folder: 'milko/products',
    });
    imageUrl = uploadResult.url;
  }

  return await productModel.createProduct({
    name,
    description,
    pricePerLitre,
    imageUrl,
    isActive: isActive !== undefined ? isActive : true,
  });
};

/**
 * Update product (admin only)
 * @param {string} productId - Product ID
 * @param {Object} updates - Fields to update
 * @param {Object} imageFile - New image file (optional)
 * @returns {Promise<Object>} Updated product
 */
const updateProduct = async (productId, updates, imageFile = null) => {
  const product = await productModel.getProductById(productId);
  if (!product) {
    throw new NotFoundError('Product');
  }

  // Handle image upload if new image provided
  if (imageFile) {
    // Delete old image if exists
    if (product.image_url) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = product.image_url.split('/');
        const publicId = urlParts.slice(-2).join('/').split('.')[0];
        await deleteImage(`milko/products/${publicId}`);
      } catch (error) {
        console.error('Error deleting old image:', error);
        // Continue even if deletion fails
      }
    }

    // Upload new image
    const uploadResult = await uploadImage(imageFile.buffer, {
      resource_type: 'image',
      folder: 'milko/products',
    });
    updates.imageUrl = uploadResult.url;
  }

  return await productModel.updateProduct(productId, updates);
};

/**
 * Delete product (admin only)
 * Soft delete by setting is_active to false
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Deleted product
 */
const deleteProduct = async (productId) => {
  const product = await productModel.getProductById(productId);
  if (!product) {
    throw new NotFoundError('Product');
  }

  return await productModel.deleteProduct(productId);
};

module.exports = {
  getActiveProducts,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

