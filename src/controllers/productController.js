const productService = require('../services/productService');

/**
 * Product Controller
 * Handles product HTTP requests
 */

/**
 * Get all active products (customer view)
 * GET /api/products
 */
const getActiveProducts = async (req, res, next) => {
  try {
    const products = await productService.getActiveProducts();

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product by ID
 * GET /api/products/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActiveProducts,
  getProductById,
};

