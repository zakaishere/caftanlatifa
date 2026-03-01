import 'dotenv/config';
import prisma from '../lib/prisma.js';
import bcrypt from 'bcrypt';
async function createAdmin() {
    const username = 'admin';
    const email = 'admin@example.com';
    const password = 'admin-password-123'; // USER: Change this after first login
    console.log('Creating admin user...');
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = await prisma.adminUser.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                username
            },
            create: {
                username,
                email,
                password: hashedPassword
            }
        });
        console.log('✅ Admin user created/updated successfully!');
        console.log(`   Username: ${admin.username}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Password: ${password}`);
    }
    catch (error) {
        console.error('❌ Error creating admin user:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
createAdmin();
