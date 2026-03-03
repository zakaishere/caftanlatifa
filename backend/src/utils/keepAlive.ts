/**
 * Pings the health endpoint of the application to keep it alive.
 * This is useful for free-tier hosting like Render that sleeps after inactivity.
 */
export const startKeepAlive = (url: string, intervalMinutes: number = 5) => {
    const endpoint = '/ping';
    const intervalMs = intervalMinutes * 60 * 1000;
    const fullUrl = url.endsWith('/') ? `${url}${endpoint.substring(1)}` : `${url}${endpoint}`;

    console.log(`🚀 [Keep-Alive] Started for: ${url}`);
    console.log(`📡 [Keep-Alive] Endpoint: ${endpoint}`);
    console.log(`⏱️  [Keep-Alive] Interval: ${intervalMinutes} minutes`);
    console.log(`⏰ [Keep-Alive] First ping in 5 seconds...\n`);

    const ping = async () => {
        const timestamp = new Date().toISOString();
        try {
            const response = await fetch(fullUrl);
            const data = await response.json().catch(() => null);

            if (response.ok) {
                console.log(`✅ [${timestamp}] Keep-alive ping successful`);
            } else {
                console.warn(`⚠️  [${timestamp}] Keep-alive ping returned non-ok status (${response.status})`, data);
            }
        } catch (error: any) {
            console.error(`❌ [${timestamp}] Keep-alive ping failed:`, error.message);
            if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                console.error(`   ⚠️  Service might be paused or unreachable.`);
            }
        }
    };

    // Initial ping after 5 seconds
    setTimeout(ping, 5000);

    // Regular interval
    setInterval(ping, intervalMs);
};
