import 'dotenv/config';
import app from './app.js';
import { startKeepAlive } from './utils/keepAlive.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);

    // Start keep-alive pinging
    const keepAliveUrl = process.env.SERVICE_URL ||
        process.env.RENDER_SERVICE_URL ||
        process.env.RENDER_EXTERNAL_URL;

    if (keepAliveUrl) {
        startKeepAlive(keepAliveUrl);
    } else {
        console.log('ℹ️  [Keep-Alive] Skipping: No SERVICE_URL, RENDER_SERVICE_URL or RENDER_EXTERNAL_URL found in environment.');
    }
});
