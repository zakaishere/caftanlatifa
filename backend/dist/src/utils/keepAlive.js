/**
 * Pings the health endpoint of the application to keep it alive.
 * This is useful for free-tier hosting like Render that sleeps after inactivity.
 */
export const startKeepAlive = (url, intervalMinutes = 5) => {
    const intervalMs = intervalMinutes * 60 * 1000;
    console.log(`[Keep-Alive] Starting keep-alive for ${url} every ${intervalMinutes} minutes.`);
    setInterval(async () => {
        try {
            // Using native fetch available in Node.js 18+
            const response = await fetch(`${url}/health`);
            if (response.ok) {
                console.log(`[Keep-Alive] Ping successful: ${new Date().toISOString()}`);
            }
            else {
                console.warn(`[Keep-Alive] Ping failed with status: ${response.status}`);
            }
        }
        catch (error) {
            console.error(`[Keep-Alive] Error pinging health endpoint:`, error);
        }
    }, intervalMs);
};
