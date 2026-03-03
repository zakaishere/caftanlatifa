// External keep-alive pinger (run from GitHub Actions or another always-on host)
// Uses the same logic as the working script from your other project.
import 'dotenv/config';

const SERVICE_URL = (process.env.SERVICE_URL || '').replace(/\/$/, '');
const ENDPOINT = process.env.ENDPOINT || '/ping';
const INTERVAL_MINUTES = Number(process.env.INTERVAL_MINUTES || 5);
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 10_000);

if (!SERVICE_URL) {
  console.error('❌ SERVICE_URL is required (e.g. https://your-app.onrender.com)');
  process.exit(1);
}

const fullUrl = `${SERVICE_URL}${ENDPOINT}`;
console.log(`📡 Keep-alive targeting: ${fullUrl}`);
console.log(`⏱️  Interval: ${INTERVAL_MINUTES} minute(s), timeout: ${TIMEOUT_MS} ms`);

const ping = async () => {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(fullUrl, { signal: controller.signal });
    clearTimeout(timer);
    const elapsed = Date.now() - start;
    if (res.ok) {
      console.log(`✅ ${new Date().toISOString()} ${res.status} in ${elapsed}ms`);
    } else {
      console.error(`⚠️  ${new Date().toISOString()} non-200 (${res.status}) in ${elapsed}ms`);
      process.exitCode = 1;
    }
  } catch (err) {
    clearTimeout(timer);
    const elapsed = Date.now() - start;
    console.error(`❌ ${new Date().toISOString()} error in ${elapsed}ms:`, err.message || err);
    process.exitCode = 1;
  }
};

// initial ping then interval
ping();
setInterval(ping, INTERVAL_MINUTES * 60 * 1000);
