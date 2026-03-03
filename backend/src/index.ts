import 'dotenv/config';
import app from './app.js';
import { startKeepAlive } from './utils/keepAlive.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);

    // Start keep-alive pinging if on production (Render)
    if (process.env.NODE_ENV === 'production') {
        const keepAliveUrl = process.env.SERVICE_URL ||
            process.env.RENDER_SERVICE_URL ||
            process.env.RENDER_EXTERNAL_URL ||
            `http://localhost:${PORT}`;

        startKeepAlive(keepAliveUrl);
    }
});
