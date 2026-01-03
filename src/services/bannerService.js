const bannerModel = require('../models/banner');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * Banner Service
 * Handles banner business logic
 */

/**
 * Get all active banners (for homepage)
 * @returns {Promise<Array>} Array of active banners
 */
const getActiveBanners = async () => {
  return await bannerModel.getActiveBanners();
};

/**
 * Get all banners (for admin)
 * @returns {Promise<Array>} Array of all banners
 */
const getAllBanners = async () => {
  return await bannerModel.getAllBanners();
};

/**
 * Get banner by ID
 * @param {string} bannerId - Banner ID
 * @returns {Promise<Object>} Banner object
 */
const getBannerById = async (bannerId) => {
  const banner = await bannerModel.getBannerById(bannerId);
  if (!banner) {
    throw new NotFoundError('Banner');
  }
  return banner;
};

/**
 * Create new banner (admin only)
 * @param {Object} bannerData - Banner data
 * @param {Object} imageFile - Image file (required)
 * @returns {Promise<Object>} Created banner
 */
const createBanner = async (bannerData, imageFile) => {
  const { title, description, orderIndex, isActive } = bannerData;

  // Validate image file is required
  if (!imageFile) {
    throw new ValidationError('Image file is required');
  }

  // Upload image to Cloudinary
  const uploadResult = await uploadImage(imageFile.buffer, {
    resource_type: 'image',
    folder: 'milko/banners',
  });

  return await bannerModel.createBanner({
    title,
    description,
    imageUrl: uploadResult.url,
    imagePublicId: uploadResult.publicId,
    orderIndex: orderIndex ? parseInt(orderIndex) : 0,
    isActive: isActive !== undefined ? isActive : true,
  });
};

/**
 * Update banner (admin only)
 * @param {string} bannerId - Banner ID
 * @param {Object} updates - Fields to update
 * @param {Object} imageFile - New image file (optional)
 * @returns {Promise<Object>} Updated banner
 */
const updateBanner = async (bannerId, updates, imageFile = null) => {
  const banner = await bannerModel.getBannerById(bannerId);
  if (!banner) {
    throw new NotFoundError('Banner');
  }

  // Handle image upload if new image provided
  if (imageFile) {
    // Delete old image from Cloudinary
    if (banner.imagePublicId) {
      try {
        await deleteImage(banner.imagePublicId);
      } catch (error) {
        console.error('Failed to delete old banner image:', error);
        // Continue even if deletion fails
      }
    }

    // Upload new image
    const uploadResult = await uploadImage(imageFile.buffer, {
      resource_type: 'image',
      folder: 'milko/banners',
    });

    updates.imageUrl = uploadResult.url;
    updates.imagePublicId = uploadResult.publicId;
  }

  // Handle orderIndex conversion
  if (updates.orderIndex !== undefined) {
    updates.orderIndex = parseInt(updates.orderIndex);
  }

  return await bannerModel.updateBanner(bannerId, updates);
};

/**
 * Delete banner (admin only)
 * @param {string} bannerId - Banner ID
 * @returns {Promise<Object>} Deleted banner
 */
const deleteBanner = async (bannerId) => {
  const banner = await bannerModel.getBannerById(bannerId);
  if (!banner) {
    throw new NotFoundError('Banner');
  }

  // Delete image from Cloudinary
  if (banner.imagePublicId) {
    try {
      await deleteImage(banner.imagePublicId);
    } catch (error) {
      console.error('Failed to delete banner image from Cloudinary:', error);
      // Continue with database deletion even if Cloudinary deletion fails
    }
  }

  // Delete from database
  return await bannerModel.deleteBanner(bannerId);
};

module.exports = {
  getActiveBanners,
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
};

