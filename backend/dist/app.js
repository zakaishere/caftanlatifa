import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import { errorHandler } from './utils/errors.js';
import publicRoutes from './routes/public.routes.js';
import adminRoutes from './routes/admin.routes.js';
const app = express();
// Middlewares
app.use(helmet());
app.use(cors({
    credentials: true,
    origin: env.FRONTEND_URL || 'http://localhost:3001',
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
// Health checks (must be before authentication/complex routes)
app.get('/ping', (req, res) => {
    const ts = new Date().toISOString();
    console.log(`[ping] ${ts} ${req.ip || 'unknown'}`);
    res.status(200).send('pong');
});
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// Routes
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);
// Zod validation error formatter (must be before global error handler)
app.use((err, req, res, next) => {
    if (err instanceof ZodError) {
        return res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request data',
                issues: err.issues.map((i) => ({
                    path: i.path.join('.'),
                    message: i.message,
                })),
            },
        });
    }
    next(err);
});
// Global Error Handler
app.use(errorHandler);
export default app;
