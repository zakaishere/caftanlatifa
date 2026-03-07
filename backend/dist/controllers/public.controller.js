import { PublicService } from '../services/public.service.js';
import { asyncHandler } from '../utils/errors.js';
import { createOrderSchema, productParamsSchema, contactSchema } from '../validators/public.validator.js';
export class PublicController {
    static getInitData = asyncHandler(async (req, res) => {
        const data = await PublicService.getInitData();
        res.json(data);
    });
    static getProducts = asyncHandler(async (req, res) => {
        const filters = productParamsSchema.parse(req.query);
        const products = await PublicService.getProducts(filters);
        res.json(products);
    });
    static getProductById = asyncHandler(async (req, res) => {
        const product = await PublicService.getProductById(req.params.id);
        res.json(product);
    });
    static getRelatedProducts = asyncHandler(async (req, res) => {
        const products = await PublicService.getRelatedProducts(req.params.id);
        res.json(products);
    });
    static createOrder = asyncHandler(async (req, res) => {
        const validatedData = createOrderSchema.parse(req.body);
        const order = await PublicService.createOrder(validatedData);
        res.status(201).json({ orderId: order.id, status: 'success' });
    });
    static sendMessage = asyncHandler(async (req, res) => {
        contactSchema.parse(req.body);
        // In a real app, send email/whatsapp here.
        res.json({ status: 'success' });
    });
    static getOrders = asyncHandler(async (req, res) => {
        const idsString = req.query.ids;
        if (!idsString) {
            return res.json([]);
        }
        const ids = idsString.split(',').filter(Boolean);
        const orders = await PublicService.getOrdersByIds(ids);
        res.json(orders);
    });
    static searchOrders = asyncHandler(async (req, res) => {
        const query = req.query.q;
        if (!query || query.length < 3) {
            return res.status(400).json({ error: { message: 'Search query must be at least 3 characters long' } });
        }
        const orders = await PublicService.searchOrders(query);
        res.json(orders);
    });
    static cancelOrder = asyncHandler(async (req, res) => {
        const orderId = req.params.id;
        const updatedOrder = await PublicService.cancelOrder(orderId);
        res.json({ status: 'success', order: updatedOrder });
    });
}
