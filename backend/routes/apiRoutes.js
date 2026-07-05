const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

// Import JWT authentication and role validation middlewares
const { verifyToken, verifyAdmin } = require('../middleware/jwtAuth');

// Import upload middleware for admin product creations/edits
const upload = require('../middleware/upload');

// Import validators
const { registerValidationRules, apiCheckoutValidationRules, validate } = require('../middleware/validator');

// ==========================================
// 1. PUBLIC AUTH & USER PUBLIC ENDPOINTS
// ==========================================
router.post('/auth/login', apiController.apiLogin);
router.post('/auth/register', registerValidationRules(), validate, apiController.apiRegister);
router.post('/auth/forgot-password', apiController.apiForgotPassword);
router.post('/auth/reset-password/:token', apiController.apiResetPassword);
router.post('/auth/logout', apiController.apiLogout);

// ==========================================
// 2. PUBLIC STORE ENDPOINTS
// ==========================================
router.get('/products', apiController.getApiProducts);
router.get('/products/:id', apiController.getApiProductById);
router.get('/search-autocomplete', apiController.getSearchAutocomplete);
router.get('/categories', apiController.getApiCategories);
router.get('/featured-offers', apiController.getFeaturedOffers);
router.post('/newsletter/subscribe', apiController.subscribeApiNewsletter);
router.get('/products/:id/reviews', apiController.getApiReviews);

// ==========================================
// 3. PROTECTED USER ENDPOINTS (Requires JWT)
// ==========================================
router.get('/user/profile', verifyToken, apiController.getApiProfile);

// Shopping Cart (Database Persisted)
router.get('/cart', verifyToken, apiController.getApiCart);
router.post('/cart/add', verifyToken, apiController.addApiCart);
router.post('/cart/update', verifyToken, apiController.updateApiCart);
router.post('/cart/remove', verifyToken, apiController.removeApiCart);

// Wishlist
router.get('/wishlist', verifyToken, apiController.getApiWishlist);
router.post('/wishlist/add', verifyToken, apiController.addApiWishlist);
router.post('/wishlist/remove', verifyToken, apiController.removeApiWishlist);

// Orders & Checkout
router.post('/orders', verifyToken, apiCheckoutValidationRules(), validate, apiController.submitApiOrder);
router.get('/orders', verifyToken, apiController.getApiOrders);
router.get('/orders/:id', verifyToken, apiController.getApiOrderById);
router.get('/orders/:id/invoice', verifyToken, apiController.downloadApiInvoice);

// Coupon & Review Submission
router.post('/checkout/apply-coupon', verifyToken, apiController.applyApiCoupon);
router.post('/products/:id/reviews', verifyToken, apiController.addApiReview);
router.post('/products/:id/review', verifyToken, apiController.addApiReview);

// ==========================================
// 4. PROTECTED ADMIN ENDPOINTS (Requires JWT & Admin Role)
// ==========================================
router.get('/admin/dashboard', verifyToken, verifyAdmin, apiController.getAdminDashboard);
router.post('/admin/products', verifyToken, verifyAdmin, upload.single('image'), apiController.addAdminProduct);
router.put('/admin/products/:id', verifyToken, verifyAdmin, upload.single('image'), apiController.updateAdminProduct);
router.delete('/admin/products/:id', verifyToken, verifyAdmin, apiController.deleteAdminProduct);

router.get('/admin/orders', verifyToken, verifyAdmin, apiController.getAdminOrders);
router.post('/admin/orders/status/:id', verifyToken, verifyAdmin, apiController.updateAdminOrderStatus);
router.get('/admin/analytics', verifyToken, verifyAdmin, apiController.getAdminAnalytics);
router.get('/admin/settings/global-sale', verifyToken, verifyAdmin, apiController.getGlobalSaleSetting);
router.post('/admin/settings/global-sale', verifyToken, verifyAdmin, apiController.updateGlobalSaleSetting);

router.get('/admin/users', verifyToken, verifyAdmin, apiController.getAdminUsers);
router.post('/admin/users/role/:id', verifyToken, verifyAdmin, apiController.toggleAdminUserRole);

router.get('/admin/reviews', verifyToken, verifyAdmin, apiController.getAdminReviews);
router.delete('/admin/reviews/:id', verifyToken, verifyAdmin, apiController.deleteAdminReview);

module.exports = router;