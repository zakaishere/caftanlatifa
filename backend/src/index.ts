import 'dotenv/config';
import app from './app.js';
import { startKeepAlive } from './utils/keepAlive.js';

const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.listen(PORT, () => {
    console.log(`Server running`);

    if (!isProduction) {
        const keepAliveUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVICE_URL || process.env.RENDER_SERVICE_URL;

        if (keepAliveUrl) {
            startKeepAlive(keepAliveUrl);
        } else {
            console.log('ℹ️  [Keep-Alive] Skipping dev keep-alive: No SERVICE_URL/RENDER_EXTERNAL_URL configured.');
        }
    } else {
        console.log('ℹ️  [Keep-Alive] Disabled in production. Use external pings (see .github/workflows/keep-alive.yml).');
    }
});
