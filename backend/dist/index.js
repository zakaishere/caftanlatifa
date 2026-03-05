import 'dotenv/config';
import app from './app.js';
import { startKeepAlive } from './utils/keepAlive.js';
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    const serviceUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVICE_URL;
    if (serviceUrl) {
        startKeepAlive(serviceUrl);
    }
    else {
        console.log('ℹ️  Keep-alive skipped: set RENDER_EXTERNAL_URL or SERVICE_URL to enable.');
    }
});
