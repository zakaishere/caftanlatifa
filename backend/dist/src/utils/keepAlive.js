/**
 * Pings the health endpoint of the application.
 *
 * ⚠️ IMPORTANT: In-app keep-alive loops (setInterval) will NOT keep
 * Render Free Tier services awake reliably because the process sleeps
 * and pauses all timers. Use an external monitor (UptimeRobot, etc.)
 * to ping this service from outside.
 */
export const startKeepAlive = (url, intervalMinutes = 5) => {
    const endpoint = '/ping';
    const intervalMs = intervalMinutes * 60 * 1000;
    // Ensure URL is valid and doesn't have duplicate slashes
    const baseUrl = url.replace(/\/$/, '');
    const fullUrl = `${baseUrl}${endpoint}`;
    console.log(`📡 [Keep-Alive] Monitoring initialized for: ${baseUrl}`);
    console.log(`ℹ️  [Keep-Alive] Note: External monitoring is required to prevent Render sleeping.`);
    const ping = async () => {
        const timestamp = new Date().toISOString();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        try {
            const response = await fetch(fullUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (response.ok) {
                console.log(`✅ [${timestamp}] Internal health check successful`);
            }
            else {
                console.warn(`⚠️  [${timestamp}] Internal health check returned status ${response.status}`);
            }
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                console.error(`❌ [${timestamp}] Internal health check timed out`);
            }
            else {
                console.error(`❌ [${timestamp}] Internal health check failed:`, error.message);
            }
        }
    };
    // Initial ping after 5 seconds to verify endpoint
    setTimeout(ping, 5000);
    // Regular interval
    setInterval(ping, intervalMs);
};
