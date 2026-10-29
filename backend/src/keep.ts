const FIVE_MINUTES = 5 * 60 * 1000;

export function startKeep(url = process.env.RENDER_EXTERNAL_URL) {
    if (!url) {
        console.log('[keep] Skipped: RENDER_EXTERNAL_URL is not set.');
        return;
    }

    async function ping() {
        try {
            const response = await fetch(url!, { signal: AbortSignal.timeout(10_000) });
            await response.body?.cancel();
            console.log(`[keep] ${new Date().toISOString()} HTTP ${response.status}`);
        } catch {
            console.error('[keep] Request failed; will retry in 5 minutes.');
        }
    }

    void ping();
    return setInterval(() => { void ping(); }, FIVE_MINUTES);
}
