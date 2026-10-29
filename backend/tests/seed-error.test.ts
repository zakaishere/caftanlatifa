import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { describeSeedError } from '../src/lib/seed-error.js';

test('seed errors identify invalid variables without printing their values', () => {
    const parsed = z.object({
        SEED_ADMIN_EMAIL: z.string().email(),
        SEED_ADMIN_PASSWORD: z.string().min(12),
    }).safeParse({ SEED_ADMIN_EMAIL: 'private-invalid-email', SEED_ADMIN_PASSWORD: 'secret' });
    assert.equal(parsed.success, false);
    if (parsed.success) return;
    const message = describeSeedError(parsed.error);
    assert.match(message, /SEED_ADMIN_EMAIL/);
    assert.match(message, /SEED_ADMIN_PASSWORD/);
    assert.doesNotMatch(message, /private-invalid-email|secret/);
});

test('database failures are explained without exposing connection strings', () => {
    const message = describeSeedError({ code: 'P1011', message: 'postgresql://user:secret@host TLS connection failed' });
    assert.match(message, /TLS validation failed/);
    assert.doesNotMatch(message, /user:secret/);
    assert.match(describeSeedError({ code: 'P2021' }), /schema is missing/);
    assert.match(describeSeedError({ code: 'ENOENT' }), /file is missing/);
    assert.doesNotMatch(describeSeedError(new Error('postgresql://user:secret@host')), /user:secret/);
});
