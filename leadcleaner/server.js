'use strict';

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const { createUsageTracker } = require('./src/services/usage-tracker');
const { createEnrichRouter } = require('./src/routes/enrich');
const { createUsageRouter }  = require('./src/routes/usage');

const PORT          = parseInt(process.env.PORT, 10) || 3000;
const APOLLO_KEY    = process.env.APOLLO_API_KEY || '';
const MONTHLY_LIMIT = parseInt(process.env.APOLLO_MONTHLY_LIMIT, 10) || 30020;

if (!APOLLO_KEY) {
  console.warn('[startup] APOLLO_API_KEY not set in .env');
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const usageTracker = createUsageTracker({
  monthlyLimit: MONTHLY_LIMIT,
  usageFile: path.join(__dirname, 'usage.json'),
});

app.use('/api', createUsageRouter({ usageTracker }));
app.use('/api', createEnrichRouter({ apiKey: APOLLO_KEY, usageTracker }));

app.listen(PORT, () => {
  console.log(`Lead Cleaner → http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  console.log('\nServer stopped.');
  process.exit(0);
});
