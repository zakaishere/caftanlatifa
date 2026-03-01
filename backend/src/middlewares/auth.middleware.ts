import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth.js';
import { AppError } from '../utils/errors.js';

// req.user type augmentation lives in src/types/express.d.ts

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
    const token = req.cookies?.admin_token as string | undefined;

    if (!token) {
        return next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
    }

    try {
        req.user = verifyToken(token);
        next();
    } catch (err) {
        next(err);
    }
}
