/**
 * Apollo.io client — isolates outbound calls to Apollo's /people/match endpoint.
 *
 * This is the only place in the code that talks to Apollo.
 * The rest of the project calls `matchPerson(...)` and knows nothing
 * about URLs, headers, or response parsing.
 *
 * Why isolated: if one day Apollo changes endpoint, or we switch
 * to `/organization/match` for GDPR reasons, we change ONLY this file.
 */

'use strict';

const fetch = require('node-fetch');

const APOLLO_MATCH_URL = 'https://api.apollo.io/api/v1/people/match';

/**
 * Calls Apollo /people/match and returns normalized fields.
 *
 * @param {object} params
 * @param {string} params.apiKey     Apollo API key (injected by the caller, never read from env here).
 * @param {string} [params.email]
 * @param {string} [params.firstName]
 * @param {string} [params.lastName]
 *
 * @returns {Promise<{
 *   ok: boolean,
 *   status: number,
 *   jobTitle: string|null,
 *   companySize: number|null,
 *   industry: string|null,
 *   errorMessage: string|null,
 * }>}
 *
 * Does not throw on Apollo errors: always returns an object with `ok: false`
 * so the caller can decide whether to log, count quota, return 502, etc.
 * Throws only on unrecoverable network/parsing errors.
 */
async function matchPerson({ apiKey, email, firstName, lastName }) {
  if (!apiKey) {
    throw new Error('apolloClient.matchPerson: apiKey is required');
  }
  if (!email && !firstName && !lastName) {
    throw new Error('apolloClient.matchPerson: provide at least email or name fields');
  }

  // Build the payload only with the fields present.
  // Apollo accepts partial match: without an email it searches by first+last name.
  const payload = {};
  if (email) payload.email = email;
  if (firstName) payload.first_name = firstName;
  if (lastName) payload.last_name = lastName;

  const apolloRes = await fetch(APOLLO_MATCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  const rawText = await apolloRes.text();
  let json;
  try {
    json = JSON.parse(rawText);
  } catch (_) {
    // Apollo replied with something non-JSON (rate-limit HTML page, 5xx error).
    // Not a crash: signal to the caller that the response is unusable.
    return {
      ok: false,
      status: apolloRes.status,
      jobTitle: null,
      companySize: null,
      industry: null,
      errorMessage: `Apollo returned non-JSON response: ${rawText.slice(0, 100)}`,
    };
  }

  if (!apolloRes.ok) {
    return {
      ok: false,
      status: apolloRes.status,
      jobTitle: null,
      companySize: null,
      industry: null,
      errorMessage: json.message || json.error || 'Apollo API error',
    };
  }

  // Apollo can return 200 even without a match: person = null.
  // It's a "call consumed with no data".
  const person = json.person || null;
  return {
    ok: true,
    status: apolloRes.status,
    jobTitle: person?.title || null,
    company: person?.organization?.name || null,
    companySize: person?.organization?.estimated_num_employees || null,
    // Raw revenue (USD). Apollo uses `organization_revenue`; some responses
    // expose `annual_revenue`. 0/null = unknown → the mapping treats it as empty.
    revenue: person?.organization?.organization_revenue ?? person?.organization?.annual_revenue ?? null,
    industry: person?.organization?.industry || null,
    country: person?.country || null,
    errorMessage: null,
  };
}

module.exports = { matchPerson };
