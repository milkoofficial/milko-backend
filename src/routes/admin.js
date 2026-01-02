const express = require('express');
const router = express.Router();
const multer = require('multer');
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

/**
 * Admin Routes
 * Base path: /api/admin
 * All routes require authentication AND admin role
 */

// Apply authentication and admin check to all routes
router.use(authenticate);
router.use(requireAdmin);

// Configure multer for image uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Products
router.get('/products', adminController.getAllProducts);
router.post('/products', upload.single('image'), adminController.createProduct);
router.put('/products/:id', upload.single('image'), adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Users
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);

// Subscriptions
router.get('/subscriptions', adminController.getAllSubscriptions);
router.post('/subscriptions/:id/pause', adminController.pauseSubscription);
router.post('/subscriptions/:id/resume', adminController.resumeSubscription);

// Deliveries
router.get('/deliveries', adminController.getDeliveries);
router.put('/deliveries/:id', adminController.updateDeliveryStatus);

module.exports = router;

