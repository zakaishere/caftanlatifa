import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import "dotenv/config";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
async function main() {
    console.log('🌱 Seeding database...');
    // ── Admin User ────────────────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash('adminpassword123', 10);
    const admin = await prisma.adminUser.upsert({
        where: { username: 'admin' },
        update: {},
        create: { username: 'admin', email: 'admin@example.com', password: hashedPassword },
    });
    console.log(`✅ Admin: ${admin.email} / adminpassword123`);
    // ── Settings ─────────────────────────────────────────────────────────────
    await prisma.settings.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            storeName: 'AtlasStore',
            whatsappNumber: '+212600000000',
            supportEmail: 'support@atlasstore.ma',
            businessAddress: 'Casablanca, Morocco',
            freeShippingEnabled: true,
            freeShippingThreshold: 50000, // 500 MAD in cents
            standardDeliveryFee: 5000, // 50 MAD in cents
        },
    });
    console.log('✅ Settings initialized');
    // ── Categories ────────────────────────────────────────────────────────────
    const categoriesData = [
        { name: 'Electronics', slug: 'electronics' },
        { name: 'Home & Office', slug: 'home-office' },
        { name: 'Beauty & Health', slug: 'beauty' },
        { name: 'Fashion', slug: 'fashion' },
        { name: 'Toys & Games', slug: 'toys' },
    ];
    const categoryMap = {};
    for (const cat of categoriesData) {
        const created = await prisma.category.upsert({
            where: { slug: cat.slug },
            update: { name: cat.name },
            create: cat,
        });
        categoryMap[cat.slug] = created.id;
    }
    console.log(`✅ Seeded ${categoriesData.length} categories`);
    // ── Products ──────────────────────────────────────────────────────────────
    // Prices in cents (MAD × 100)
    const productsData = [
        {
            name: 'Pro Wireless Headphones',
            price: 45000,
            description: 'High-fidelity audio with active noise cancellation and 30-hour battery life.',
            images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
            inStock: true,
            categorySlug: 'electronics',
            specs: { Battery: '30h', Connection: 'Bluetooth 5.2', Weight: '250g' },
        },
        {
            name: 'Ergonomic Office Chair',
            price: 120000,
            description: 'Adjustable lumbar support and breathable mesh back for all-day comfort.',
            images: ['https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=800&q=80'],
            inStock: true,
            categorySlug: 'home-office',
            specs: { Material: 'Mesh/Steel', 'Max Load': '120kg', Warranty: '2 Years' },
        },
        {
            name: 'Smart Fitness Watch',
            price: 35000,
            description: 'Track your heart rate, steps, and sleep with this water-resistant smartwatch.',
            images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'],
            inStock: true,
            categorySlug: 'electronics',
            specs: { Waterproof: '5ATM', Sensors: 'HR, SpO2', Battery: '7 Days' },
        },
        {
            name: 'Minimalist Desk Lamp',
            price: 18000,
            description: 'Dimmable LED lamp with wireless charging base.',
            images: ['https://images.unsplash.com/photo-1534073828943-f801091a7d58?w=800&q=80'],
            inStock: false,
            categorySlug: 'home-office',
            specs: { Power: '10W', Light: '3 Color Modes', Feature: 'Qi Charging' },
        },
        {
            name: 'Organic Face Serum',
            price: 22000,
            description: 'Vitamin C enriched serum for glowing and healthy skin.',
            images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80'],
            inStock: true,
            categorySlug: 'beauty',
            specs: { Volume: '30ml', 'Skin Type': 'All', Ingredients: 'Organic' },
        },
        {
            name: 'Mechanical Keyboard',
            price: 85000,
            description: 'Tactile switches with customizable RGB lighting and aluminum frame.',
            images: ['https://images.unsplash.com/photo-1587829741301-dc798b91a603?w=800&q=80'],
            inStock: true,
            categorySlug: 'electronics',
            specs: { Switches: 'Blue/Red', Layout: 'QWERTY', Material: 'Aluminum' },
        },
        {
            name: 'Leather Weekend Bag',
            price: 99000,
            description: 'Premium full-grain leather bag perfect for short trips.',
            images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80'],
            inStock: true,
            categorySlug: 'fashion',
            specs: { Material: 'Leather', Size: '45L', Color: 'Brown' },
        },
        {
            name: 'Ceramic Coffee Set',
            price: 28000,
            description: 'Handcrafted ceramic mugs and pour-over dripper set.',
            images: ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&q=80'],
            inStock: true,
            categorySlug: 'home-office',
            specs: { Pieces: '4 Mugs + Dripper', Material: 'Ceramic', 'Dishwasher Safe': 'Yes' },
        },
        {
            name: 'Moroccan Argan Oil Hair Mask',
            price: 15000,
            description: 'Deep conditioning hair mask with pure Moroccan argan oil.',
            images: ['https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80'],
            inStock: true,
            categorySlug: 'beauty',
            specs: { Volume: '200ml', 'Hair Type': 'All', Origin: 'Morocco' },
        },
        {
            name: 'Kids STEM Building Set',
            price: 32000,
            description: 'Educational robotics kit that teaches coding and engineering.',
            images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
            inStock: true,
            categorySlug: 'toys',
            specs: { Age: '8+', Pieces: '200+', 'Skill Level': 'Beginner' },
        },
        {
            name: 'Slim Leather Wallet',
            price: 25000,
            description: 'Minimalist RFID-blocking genuine leather wallet.',
            images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80'],
            inStock: true,
            categorySlug: 'fashion',
            specs: { Material: 'Genuine Leather', 'Card Slots': '6', RFID: 'Yes' },
        },
        {
            name: 'Portable Bluetooth Speaker',
            price: 38000,
            description: 'Waterproof speaker with 360° sound and 12-hour playtime.',
            images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80'],
            inStock: true,
            categorySlug: 'electronics',
            specs: { Battery: '12h', Waterproof: 'IPX7', Connection: 'Bluetooth 5.0' },
        },
    ];
    let productCount = 0;
    for (const prod of productsData) {
        const { categorySlug, ...productData } = prod;
        const existing = await prisma.product.findFirst({ where: { name: prod.name } });
        if (!existing) {
            await prisma.product.create({
                data: { ...productData, categoryId: categoryMap[categorySlug] },
            });
            productCount++;
        }
    }
    console.log(`✅ Seeded ${productCount} new products (skipped duplicates)`);
    console.log('\n🎉 Database seeded successfully!');
    console.log('   Admin login: admin@example.com / adminpassword123');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
