import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import { errorHandler, AppError } from './utils/errors.js';
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

// Routes
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

app.get('/ping', (_req, res) => {
    res.json({ status: 'ok' });
});

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Zod validation error formatter (must be before global error handler)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
