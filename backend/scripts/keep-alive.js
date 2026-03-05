require('dotenv').config();

const https = require('https');
const http = require('http');

const SERVICE_URL = (process.env.SERVICE_URL || 'https://pixelart-ubva.onrender.com') + '/ping';
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function ping() {
  const url = new URL(SERVICE_URL);
  const protocol = url.protocol === 'https:' ? https : http;

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
      console.log(`[${new Date().toISOString()}] ✅ Ping OK — status ${res.statusCode} — ${data.trim()}`);
    });
  });

  req.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] ❌ Ping failed: ${err.message}`);
  });

  req.on('timeout', () => {
    console.error(`[${new Date().toISOString()}] ❌ Ping timed out`);
    req.destroy();
  });

  req.end();
}

console.log(`🚀 Keep-alive started — pinging ${SERVICE_URL} every 5 minutes`);
ping(); // immediate first ping

setInterval(ping, INTERVAL_MS);
