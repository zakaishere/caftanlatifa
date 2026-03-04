import 'dotenv/config';
import app from './app.js';
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    if (!isProduction) {
        console.log('ℹ️  [Keep-Alive] External pings enabled (see .github/workflows/keep-alive.yml).');
    }
    else {
        console.log('ℹ️  [Keep-Alive] External pings enabled (see .github/workflows/keep-alive.yml).');
    }
});
