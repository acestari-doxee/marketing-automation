'use strict';

const express    = require('express');
const apollo     = require('../services/apollo');
const { computeScore }       = require('../services/scoring');
const { QuotaExceededError } = require('../services/usage-tracker');

function createEnrichRouter({ apiKey, usageTracker }) {
  const router = express.Router();

  router.post('/enrich', async (req, res) => {
    const { email, first_name: firstName, last_name: lastName } = req.body || {};

    if (!email && !firstName && !lastName) {
      return res.status(400).json({ error: 'Provide at least email or first/last name.' });
    }

    // Controlla quota
    try {
      usageTracker.assertCanCall();
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        return res.status(429).json({
          error: 'Apollo monthly quota exhausted.',
          calls_used: err.used,
          monthly_limit: err.limit,
        });
      }
      throw err;
    }

    // Chiama Apollo
    let result;
    try {
      result = await apollo.matchPerson({ apiKey, email, firstName, lastName });
    } catch (err) {
      return res.status(502).json({ error: 'Network error contacting Apollo.' });
    }

    // Registra la chiamata (sempre, anche se non trovato)
    usageTracker.recordCall();

    if (!result.ok) {
      return res.status(result.status || 502).json({ error: result.errorMessage });
    }

    const score = computeScore({
      jobTitle:    result.jobTitle,
      industry:    result.industry,
      companySize: result.companySize,
    });

    const summary = usageTracker.getSummary();

    return res.json({
      job_title:       result.jobTitle,
      company:         result.company,
      company_size:    result.companySize,
      revenue:         result.revenue,
      industry:        result.industry,
      country:         result.country,
      score,
      calls_used:      summary.calls_used,
      calls_remaining: summary.calls_remaining,
    });
  });

  return router;
}

module.exports = { createEnrichRouter };
