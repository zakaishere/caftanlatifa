import 'dotenv/config';
import prisma from '../lib/prisma.js';
import { seedAdmin } from '../lib/seed-admin.js';

try {
    await seedAdmin(prisma);
} catch {
    console.error('Admin seed failed. Check SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD (12-72 characters), and database access.');
    process.exitCode = 1;
} finally {
    await prisma.$disconnect();
}
