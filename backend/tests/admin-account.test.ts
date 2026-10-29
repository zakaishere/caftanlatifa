import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';

test('account changes require current password and keep password hashes private', async () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_SECRET = 'isolated-test-secret';
    const { default: prisma } = await import('../src/lib/prisma.js');
    const { AdminService } = await import('../src/services/admin.service.js');
    const { updateAccountSchema } = await import('../src/validators/admin.validator.js');
    const password = await bcrypt.hash('old-test-password', 4);
    let writes = 0;
    let updated: any;
    const findUnique = prisma.adminUser.findUnique;
    const update = prisma.adminUser.update;
    prisma.adminUser.findUnique = (async () => ({ id: 'owner', email: 'old@example.com', password })) as any;
    prisma.adminUser.update = (async (args: any) => {
        writes++;
        updated = args;
        return { id: 'owner', username: 'admin', email: args.data.email, createdAt: new Date() };
    }) as any;
    try {
        await assert.rejects(AdminService.updateAccount('owner', {
            email: 'new@example.com', currentPassword: 'incorrect',
        }), /Current password is incorrect/);
        assert.equal(writes, 0);
        const result = await AdminService.updateAccount('owner', updateAccountSchema.parse({
            email: ' NEW@example.com ', currentPassword: 'old-test-password', newPassword: 'new-test-password',
        }));
        assert.equal(result.email, 'new@example.com');
        assert.equal('password' in result, false);
        assert.ok(await bcrypt.compare('new-test-password', updated.data.password));
        assert.equal(updated.where.id, 'owner');
        await AdminService.updateAccount('owner', { email: 'email-only@example.com', currentPassword: 'old-test-password' });
        assert.equal('password' in updated.data, false);
        assert.equal(updateAccountSchema.safeParse({ email: 'bad', currentPassword: 'old-test-password' }).success, false);
        assert.equal(updateAccountSchema.safeParse({ email: 'a@example.com', currentPassword: 'old-test-password', newPassword: 'short' }).success, false);
    } finally {
        prisma.adminUser.findUnique = findUnique;
        prisma.adminUser.update = update;
        await prisma.$disconnect();
    }
});
