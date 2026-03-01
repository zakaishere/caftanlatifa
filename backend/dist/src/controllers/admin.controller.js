import { AdminService } from '../services/admin.service.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { env } from '../config/env.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { loginSchema, registerSchema, createProductSchema, updateProductSchema, createCategorySchema, updateOrderStatusSchema, updateSettingsSchema } from '../validators/admin.validator.js';
const COOKIE_NAME = 'admin_token';
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 1 day in ms
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
};
export class AdminController {
    // ----- Auth -----
    static login = asyncHandler(async (req, res) => {
        const { email, password } = loginSchema.parse(req.body);
        const token = await AdminService.login(email, password);
        res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
        res.json({ message: 'Logged in successfully' });
    });
    static register = asyncHandler(async (req, res) => {
        const data = registerSchema.parse(req.body);
        const token = await AdminService.register(data);
        res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
        res.status(201).json({ message: 'Admin registered successfully' });
    });
    static logout = asyncHandler(async (_req, res) => {
        res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'strict' });
        res.json({ message: 'Logged out successfully' });
    });
    static me = asyncHandler(async (req, res) => {
        const admin = await AdminService.findById(req.user.id);
        res.json(admin);
    });
    // ----- Stats -----
    static getStats = asyncHandler(async (req, res) => {
        const stats = await AdminService.getStats();
        res.json(stats);
    });
    // Products
    static uploadImage = asyncHandler(async (req, res) => {
        if (!req.file) {
            throw new AppError(400, 'No image file provided', 'VALIDATION_ERROR');
        }
        const result = await uploadToCloudinary(req.file.buffer);
        res.status(200).json({ url: result.secure_url, publicId: result.public_id });
    });
    static getProducts = asyncHandler(async (req, res) => {
        const products = await AdminService.getProducts(req.query.search);
        res.json(products);
    });
    static createProduct = asyncHandler(async (req, res) => {
        const validatedData = createProductSchema.parse(req.body);
        const product = await AdminService.createProduct(validatedData);
        res.status(201).json(product);
    });
    static updateProduct = asyncHandler(async (req, res) => {
        const validatedData = updateProductSchema.parse(req.body);
        const product = await AdminService.updateProduct(req.params.id, validatedData);
        res.json(product);
    });
    static deleteProduct = asyncHandler(async (req, res) => {
        await AdminService.deleteProduct(req.params.id);
        res.json({ status: 'deleted' });
    });
    // Categories
    static getCategories = asyncHandler(async (req, res) => {
        const categories = await AdminService.getCategories();
        res.json(categories);
    });
    static createCategory = asyncHandler(async (req, res) => {
        const validatedData = createCategorySchema.parse(req.body);
        const category = await AdminService.createCategory(validatedData);
        res.status(201).json(category);
    });
    static deleteCategory = asyncHandler(async (req, res) => {
        await AdminService.deleteCategory(req.params.id);
        res.json({ status: 'deleted' });
    });
    // Orders
    static getOrders = asyncHandler(async (req, res) => {
        const status = req.query.status;
        const orders = await AdminService.getOrders(status);
        res.json(orders);
    });
    static updateOrderStatus = asyncHandler(async (req, res) => {
        const { status } = updateOrderStatusSchema.parse(req.body);
        const order = await AdminService.updateOrderStatus(req.params.id, status);
        res.json(order);
    });
    // Settings
    static getSettings = asyncHandler(async (req, res) => {
        const settings = await AdminService.getSettings();
        res.json(settings);
    });
    static updateSettings = asyncHandler(async (req, res) => {
        const validatedData = updateSettingsSchema.parse(req.body);
        const settings = await AdminService.updateSettings(validatedData);
        res.json(settings);
    });
}
