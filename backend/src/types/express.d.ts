import { AdminTokenPayload } from '../utils/auth.js';

declare global {
    namespace Express {
        interface Request {
            user?: AdminTokenPayload;
        }
    }
}
