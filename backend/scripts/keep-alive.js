/**
 * Keep-Alive Script for Render Free Tier
 * 
 * Pings the health endpoint to prevent service from pausing
 * 
 * Usage:
 *   node scripts/keep-alive.js
 * 
 * Or with custom URL:
 *   SERVICE_URL=https://your-service.onrender.com node scripts/keep-alive.js
 * 
 * Note: This script should run on an external service (like UptimeRobot)
 * or on a separate server. It won't work if your Render service is paused.
 */

require('dotenv').config();

const https = require('https');
const http = require('http');

const SERVICE_URL = process.env.SERVICE_URL || process.env.RENDER_SERVICE_URL || 'https://pixelart-ubva.onrender.com';
// Use 5 minutes by default - Render pauses after 15 minutes, so 5 min gives us 3x safety margin
const INTERVAL_MINUTES = parseInt(process.env.PING_INTERVAL_MINUTES || '5', 10);

// Use /ping endpoint (lighter, no DB check) instead of /health for keep-alive
// This is faster and doesn't require database connection
const ENDPOINT = process.env.KEEP_ALIVE_ENDPOINT || '/ping';

function ping() {
  const url = new URL(`${SERVICE_URL}${ENDPOINT}`);
  const protocol = url.protocol === 'https:' ? https : http;

  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'GET',
    timeout: 10000, // 10 second timeout
  };

  const req = protocol.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      const timestamp = new Date().toISOString();
      try {
        const response = JSON.parse(data);
        if (res.statusCode === 200 && response.status === 'ok') {
          console.log(`✅ [${timestamp}] Ping successful - Service is alive`);
          if (response.database) {
            console.log(`   Database: ${response.database}`);
          }
        } else {
          console.warn(`⚠️  [${timestamp}] Ping returned non-ok status (${res.statusCode}):`, response);
        }
      } catch (err) {
        // If response is not JSON but status is 200, it might still be OK
        if (res.statusCode === 200) {
          console.log(`✅ [${timestamp}] Ping successful (non-JSON response, status 200)`);
        } else {
          console.warn(`⚠️  [${timestamp}] Ping response not JSON (status ${res.statusCode}):`, data.substring(0, 100));
        }
      }
    });
  });

  req.on('error', (err) => {
    const timestamp = new Date().toISOString();
    console.error(`❌ [${timestamp}] Ping failed:`, err.message);
    console.error(`   Error code: ${err.code || 'N/A'}`);
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      console.error(`   ⚠️  Service might be paused. Check Render dashboard.`);
    }
  });

  req.on('timeout', () => {
    const timestamp = new Date().toISOString();
    console.error(`❌ [${timestamp}] Ping timeout after 10 seconds`);
    console.error(`   ⚠️  Service might be paused or slow. Check Render dashboard.`);
    req.destroy();
  });

  req.end();
}

// Ping immediately
console.log(`🚀 Keep-alive started for: ${SERVICE_URL}`);
console.log(`📡 Endpoint: ${ENDPOINT}`);
console.log(`⏱️  Interval: ${INTERVAL_MINUTES} minutes (Render pauses after 15 min)`);
console.log(`⏰ First ping in 5 seconds...\n`);

setTimeout(() => {
  ping();
}, 5000);

// Then ping every X minutes
const intervalMs = INTERVAL_MINUTES * 60 * 1000;
setInterval(ping, intervalMs);

// Keep process alive
process.on('SIGINT', () => {
  console.log('\n👋 Keep-alive stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Keep-alive stopped');
  process.exit(0);
});
