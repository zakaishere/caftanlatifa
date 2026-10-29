import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';

// Preserve credentials changed in Settings on subsequent deployments.
export async function seedAdmin(prisma: PrismaClient) {
    if (await prisma.adminUser.count() > 0) {
        console.log('Admin already exists; keeping current credentials.');
        return;
    }
    const credentials = z.object({
        SEED_ADMIN_EMAIL: z.string().trim().email(),
        SEED_ADMIN_PASSWORD: z.string().min(12).max(72),
    }).parse(process.env);
    await prisma.adminUser.upsert({
        where: { username: 'admin' }, update: {},
        create: {
            username: 'admin', email: credentials.SEED_ADMIN_EMAIL.toLowerCase(),
            password: await bcrypt.hash(credentials.SEED_ADMIN_PASSWORD, 12),
        },
    });
    console.log('Initial admin created. Change credentials in Settings after signing in.');
}
