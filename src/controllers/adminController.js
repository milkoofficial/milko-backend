const productService = require('../services/productService');
const productImageModel = require('../models/productImage');
const productVariationModel = require('../models/productVariation');
const productReviewModel = require('../models/productReview');
const bannerService = require('../services/bannerService');
const userModel = require('../models/user');
const subscriptionModel = require('../models/subscription');
const subscriptionService = require('../services/subscriptionService');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const { query } = require('../config/database');

/**
 * Admin Controller
 * Handles admin HTTP requests
 */

// ========== Products ==========

/**
 * Get all products (admin view)
 * GET /api/admin/products
 */
const getAllProducts = async (req, res, next) => {
  try {
    const products = await productService.getAllProducts();

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create product
 * POST /api/admin/products
 */
const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body, req.file);

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update product
 * PUT /api/admin/products/:id
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.updateProduct(id, req.body, req.file);

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product by ID with details
 * GET /api/admin/products/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id, true);

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product
 * DELETE /api/admin/products/:id
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await productService.deleteProduct(id);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Product Images ==========

/**
 * Add product image
 * POST /api/admin/products/:id/images
 */
const addProductImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { displayOrder = 0 } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Image file is required',
      });
    }

    const uploadResult = await uploadImage(req.file.buffer, {
      resource_type: 'image',
      folder: 'milko/products',
    });

    const image = await productImageModel.createProductImage(id, uploadResult.url, displayOrder);

    res.status(201).json({
      success: true,
      data: image,
      message: 'Image added successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product image
 * DELETE /api/admin/products/:id/images/:imageId
 */
const deleteProductImage = async (req, res, next) => {
  try {
    const { imageId } = req.params;
    const image = await productImageModel.deleteProductImage(imageId);

    if (image) {
      // Delete from Cloudinary
      try {
        const urlParts = image.imageUrl.split('/');
        const publicId = urlParts.slice(-2).join('/').split('.')[0];
        await deleteImage(`milko/products/${publicId}`);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Product Variations ==========

/**
 * Add product variation
 * POST /api/admin/products/:id/variations
 */
const addProductVariation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { size, priceMultiplier = 1.0, isAvailable = true, displayOrder = 0 } = req.body;

    if (!size) {
      return res.status(400).json({
        success: false,
        error: 'Size is required',
      });
    }

    const variation = await productVariationModel.createProductVariation(
      id,
      size,
      priceMultiplier,
      isAvailable,
      displayOrder
    );

    res.status(201).json({
      success: true,
      data: variation,
      message: 'Variation added successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update product variation
 * PUT /api/admin/products/:id/variations/:variationId
 */
const updateProductVariation = async (req, res, next) => {
  try {
    const { variationId } = req.params;
    const variation = await productVariationModel.updateProductVariation(variationId, req.body);

    res.json({
      success: true,
      data: variation,
      message: 'Variation updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product variation
 * DELETE /api/admin/products/:id/variations/:variationId
 */
const deleteProductVariation = async (req, res, next) => {
  try {
    const { variationId } = req.params;
    await productVariationModel.deleteProductVariation(variationId);

    res.json({
      success: true,
      message: 'Variation deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Product Reviews ==========

/**
 * Add product review (admin can add reviews)
 * POST /api/admin/products/:id/reviews
 */
const addProductReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewerName, rating, comment, isApproved = true } = req.body;

    if (!reviewerName || !rating) {
      return res.status(400).json({
        success: false,
        error: 'Reviewer name and rating are required',
      });
    }

    const review = await productReviewModel.createProductReview(id, {
      userId: null,
      reviewerName,
      rating,
      comment,
      isApproved,
    });

    res.status(201).json({
      success: true,
      data: review,
      message: 'Review added successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update product review
 * PUT /api/admin/products/:id/reviews/:reviewId
 */
const updateProductReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const review = await productReviewModel.updateProductReview(reviewId, req.body);

    res.json({
      success: true,
      data: review,
      message: 'Review updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product review
 * DELETE /api/admin/products/:id/reviews/:reviewId
 */
const deleteProductReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    await productReviewModel.deleteProductReview(reviewId);

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Users ==========

/**
 * Get all users
 * GET /api/admin/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await userModel.getAllUsers();

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * GET /api/admin/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ========== Subscriptions ==========

/**
 * Get all subscriptions
 * GET /api/admin/subscriptions
 */
const getAllSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await subscriptionModel.getAllSubscriptions();

    res.json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Pause subscription (admin)
 * POST /api/admin/subscriptions/:id/pause
 */
const pauseSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = await subscriptionService.pauseSubscription(id, null); // Admin bypass

    res.json({
      success: true,
      data: subscription,
      message: 'Subscription paused',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resume subscription (admin)
 * POST /api/admin/subscriptions/:id/resume
 */
const resumeSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = await subscriptionService.resumeSubscription(id, null); // Admin bypass

    res.json({
      success: true,
      data: subscription,
      message: 'Subscription resumed',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Deliveries ==========

/**
 * Get delivery schedule
 * GET /api/admin/deliveries?date=YYYY-MM-DD
 */
const getDeliveries = async (req, res, next) => {
  try {
    const { date } = req.query;
    const deliveryDate = date || new Date().toISOString().split('T')[0];

    const result = await query(
      `SELECT ds.*, s.user_id, s.litres_per_day, s.delivery_time,
              p.name as product_name, u.name as user_name, u.email as user_email
       FROM delivery_schedules ds
       LEFT JOIN subscriptions s ON ds.subscription_id = s.id
       LEFT JOIN products p ON s.product_id = p.id
       LEFT JOIN users u ON s.user_id = u.id
       WHERE ds.delivery_date = $1
       ORDER BY ds.delivery_time`,
      [deliveryDate]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update delivery status
 * PUT /api/admin/deliveries/:id
 */
const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'delivered', 'skipped', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
      });
    }

    const result = await query(
      `UPDATE delivery_schedules 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Delivery status updated',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Banners ==========

/**
 * Get all banners (admin view)
 * GET /api/admin/banners
 */
const getAllBanners = async (req, res, next) => {
  try {
    const banners = await bannerService.getAllBanners();

    res.json({
      success: true,
      data: banners,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create banner
 * POST /api/admin/banners
 */
const createBanner = async (req, res, next) => {
  try {
    const banner = await bannerService.createBanner(req.body, req.file);

    res.status(201).json({
      success: true,
      data: banner,
      message: 'Banner created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update banner
 * PUT /api/admin/banners/:id
 */
const updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await bannerService.updateBanner(id, req.body, req.file);

    res.json({
      success: true,
      data: banner,
      message: 'Banner updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete banner
 * DELETE /api/admin/banners/:id
 */
const deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    await bannerService.deleteBanner(id);

    res.json({
      success: true,
      message: 'Banner deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Products
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  // Product Images
  addProductImage,
  deleteProductImage,
  // Product Variations
  addProductVariation,
  updateProductVariation,
  deleteProductVariation,
  // Product Reviews
  addProductReview,
  updateProductReview,
  deleteProductReview,
  // Users
  getAllUsers,
  getUserById,
  // Subscriptions
  getAllSubscriptions,
  pauseSubscription,
  resumeSubscription,
  // Deliveries
  getDeliveries,
  updateDeliveryStatus,
  // Banners
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};

