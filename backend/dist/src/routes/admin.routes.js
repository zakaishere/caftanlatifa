import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { requireAdmin } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.js';
const router = Router();
// ─── Public auth routes (no token required) ───────────────────────────────────
router.post('/login', AdminController.login);
router.post('/register', AdminController.register);
// ─── All routes below require a valid admin JWT cookie ────────────────────────
router.use(requireAdmin);
// Auth – current user
router.get('/me', AdminController.me);
router.post('/logout', AdminController.logout);
// Dashboard
router.get('/stats', AdminController.getStats);
// Products
router.post('/upload', upload.single('image'), AdminController.uploadImage);
router.get('/products', AdminController.getProducts);
router.post('/products', AdminController.createProduct);
router.patch('/products/:id', AdminController.updateProduct);
router.put('/products/:id', AdminController.updateProduct);
router.delete('/products/:id', AdminController.deleteProduct);
// Categories
router.get('/categories', AdminController.getCategories);
router.post('/categories', AdminController.createCategory);
router.delete('/categories/:id', AdminController.deleteCategory);
// Orders
router.get('/orders', AdminController.getOrders);
router.patch('/orders/:id/status', AdminController.updateOrderStatus);
// Settings
router.get('/settings', AdminController.getSettings);
router.patch('/settings', AdminController.updateSettings);
export default router;
