import 'dotenv/config';
import app from './app.js';
import { startKeep } from './keep.js';

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);

    startKeep();
});
