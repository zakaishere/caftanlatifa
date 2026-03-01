import 'dotenv/config';
import app from './app.js';
import { startKeepAlive } from './utils/keepAlive.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);

    // Start keep-alive pinging if on production (Render)
    if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
        startKeepAlive(process.env.RENDER_EXTERNAL_URL);
    } else if (process.env.NODE_ENV === 'production') {
        // Fallback to localhost if external URL not provided, though external is better for keeping the service active
        startKeepAlive(`http://localhost:${PORT}`);
    }
});
