import { z } from 'zod';
const envSchema = z.object({
    DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
    PORT: z.string().default('3000'),
    JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
    RESEND_API_KEY: z.string().optional(),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    FRONTEND_URL: z.string().url().optional(),
});
const _env = envSchema.safeParse(process.env);
if (!_env.success) {
    console.error('❌  Invalid environment variables:');
    _env.error.issues.forEach((issue) => {
        console.error(`   ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
}
export const env = _env.data;
