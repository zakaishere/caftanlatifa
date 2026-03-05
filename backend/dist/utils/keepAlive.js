import https from 'https';
import http from 'http';
export function startKeepAlive(serviceUrl) {
    const url = new URL(serviceUrl + '/ping');
    const protocol = url.protocol === 'https:' ? https : http;
    const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
    function ping() {
        const req = protocol.request({
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname,
            method: 'GET',
            timeout: 10000,
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log(`[${new Date().toISOString()}] ✅ Keep-alive ping OK — status ${res.statusCode} — ${data.trim()}`);
            });
        });
        req.on('error', (err) => {
            console.error(`[${new Date().toISOString()}] ❌ Keep-alive ping failed: ${err.message}`);
        });
        req.on('timeout', () => {
            console.error(`[${new Date().toISOString()}] ❌ Keep-alive ping timed out`);
            req.destroy();
        });
        req.end();
    }
    console.log(`📡 Keep-alive started — pinging ${url.href} every 5 minutes`);
    ping(); // immediate first ping
    setInterval(ping, INTERVAL_MS);
}
