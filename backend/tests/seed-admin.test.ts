import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import type { PrismaClient } from '@prisma/client';
import { seedAdmin } from '../src/lib/seed-admin.js';

test('first admin is hashed; rerunning after changing email and password preserves the account', async () => {
    const previousEmail = process.env.SEED_ADMIN_EMAIL;
    const previousPassword = process.env.SEED_ADMIN_PASSWORD;
    let stored: { username: string; email: string; password: string } | undefined;
    const prisma = {
        adminUser: {
            count: async () => stored ? 1 : 0,
            upsert: async ({ create }: { create: typeof stored }) => { stored = create; },
        },
    } as unknown as PrismaClient;
    try {
        process.env.SEED_ADMIN_EMAIL = 'OWNER@example.com';
        process.env.SEED_ADMIN_PASSWORD = 'test-only-password-123';
        await seedAdmin(prisma);
        assert.equal(stored?.email, 'owner@example.com');
        assert.notEqual(stored?.password, process.env.SEED_ADMIN_PASSWORD);
        assert.ok(await bcrypt.compare(process.env.SEED_ADMIN_PASSWORD, stored!.password));
        stored!.email = 'changed@example.com';
        stored!.password = 'changed-password-hash';
        delete process.env.SEED_ADMIN_EMAIL;
        delete process.env.SEED_ADMIN_PASSWORD;
        await seedAdmin(prisma);
        assert.equal(stored?.email, 'changed@example.com');
        assert.equal(stored?.password, 'changed-password-hash');
        stored = undefined;
        await assert.rejects(seedAdmin(prisma));
        assert.equal(stored, undefined);
    } finally {
        if (previousEmail === undefined) delete process.env.SEED_ADMIN_EMAIL;
        else process.env.SEED_ADMIN_EMAIL = previousEmail;
        if (previousPassword === undefined) delete process.env.SEED_ADMIN_PASSWORD;
        else process.env.SEED_ADMIN_PASSWORD = previousPassword;
    }
});
