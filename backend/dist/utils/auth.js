import jwt from 'jsonwebtoken';
import { AppError } from './errors.js';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '1d';
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
}
export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch (err) {
        throw new AppError(401, 'Invalid or expired token', 'UNAUTHORIZED');
    }
}
