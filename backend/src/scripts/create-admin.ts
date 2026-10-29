import 'dotenv/config';
import prisma from '../lib/prisma.js';
import { seedAdmin } from '../lib/seed-admin.js';
import { describeSeedError } from '../lib/seed-error.js';

try {
    await seedAdmin(prisma);
} catch (error) {
    console.error(`Admin seed failed: ${describeSeedError(error)}`);
    process.exitCode = 1;
} finally {
    await prisma.$disconnect();
}
