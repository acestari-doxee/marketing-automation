'use strict';

const fetch = require('node-fetch');

const APOLLO_MATCH_URL = 'https://api.apollo.io/api/v1/people/match';

async function matchPerson({ apiKey, email, firstName, lastName }) {
  if (!apiKey) throw new Error('matchPerson: apiKey is required');
  if (!email && !firstName && !lastName) throw new Error('matchPerson: provide at least email or name');

  const payload = {};
  if (email)     payload.email      = email;
  if (firstName) payload.first_name = firstName;
  if (lastName)  payload.last_name  = lastName;

  const apolloRes = await fetch(APOLLO_MATCH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
    body: JSON.stringify(payload),
  });

  const rawText = await apolloRes.text();
  let json;
  try {
    json = JSON.parse(rawText);
  } catch (_) {
    return {
      ok: false,
      status: apolloRes.status,
      jobTitle: null, company: null, companySize: null, industry: null, country: null,
      errorMessage: `Apollo returned non-JSON: ${rawText.slice(0, 100)}`,
    };
  }

  if (!apolloRes.ok) {
    return {
      ok: false,
      status: apolloRes.status,
      jobTitle: null, company: null, companySize: null, industry: null, country: null,
      errorMessage: json.message || json.error || 'Apollo API error',
    };
  }

  const person = json.person || null;
  return {
    ok: true,
    status: apolloRes.status,
    jobTitle:    person?.title || null,
    company:     person?.organization?.name || null,
    companySize: person?.organization?.estimated_num_employees || null,
    industry:    person?.organization?.industry || null,
    country:     person?.country || null,
    errorMessage: null,
  };
}

module.exports = { matchPerson };
