const express = require('express');
const cors = require('cors');
const songRoutes = require('./routes/songRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const testRoutes = require('./routes/testRoutes');

const app = express();

app.use(cors({ 
    origin: [
        'http://localhost:5173', 
        'https://sangatamizh-music-premium.vercel.app',
        process.env.FRONTEND_URL // Allow dynamic frontend URL from Env Vars
    ].filter(Boolean), // Filter out undefined if env var is not set
    credentials: true
}));
app.use(express.json());

// Mount Routes
app.use('/api', songRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/test', testRoutes);

// Health Check
app.get('/', (req, res) => res.send('Sangatamizh Music Backend v2'));

module.exports = app;
