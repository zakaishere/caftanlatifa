import { ZodError } from 'zod';

export function describeSeedError(error: unknown): string {
    if (error instanceof ZodError) {
        return error.issues.map(issue => {
            const field = issue.path[0];
            if (field === 'SEED_ADMIN_EMAIL') return 'SEED_ADMIN_EMAIL is missing or is not a valid email address.';
            if (field === 'SEED_ADMIN_PASSWORD') return 'SEED_ADMIN_PASSWORD is missing or must contain 12–72 characters.';
            return 'Invalid seed configuration.';
        }).filter((message, index, messages) => messages.indexOf(message) === index).join(' ');
    }
    const failure = error as { code?: string; message?: string } | null;
    const code = failure?.code;
    const message = failure?.message ?? '';
    if (code === 'P1011' || /self.signed|certificate|TLS connection/i.test(message)) {
        return 'Database TLS validation failed. Check DATABASE_URL uses sslmode=verify-full&sslrootcert=/etc/secrets/ca.pem and that ca.pem contains the CA certificate for this Aiven project.';
    }
    if (code === 'ENOENT') return 'A configured file is missing. Check the Aiven CA Secret File exists and sslrootcert points to its exact path.';
    if (code === 'P1000' || code === '28P01') return 'Database authentication failed. Check the database username and password in DATABASE_URL.';
    if (code === 'P1001' || code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ETIMEDOUT') {
        return 'Database is unreachable. Check the Aiven hostname, port, service status, and allowed IP addresses.';
    }
    if (code === 'P2021' || code === 'P2022') return 'The admin database schema is missing or outdated. Run prisma migrate deploy against this database.';
    return 'Could not initialize the admin account. Check database access and that migrations have completed. No credentials were logged.';
}
