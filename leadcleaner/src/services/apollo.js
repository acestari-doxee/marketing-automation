/**
 * Apollo.io client — isolates outbound calls to Apollo's /people/match endpoint.
 *
 * Questo è l'unico posto del codice che parla con Apollo.
 * Il resto del progetto chiama `matchPerson(...)` e non sa nulla
 * di URL, header, parsing della risposta.
 *
 * Perché isolato: se un giorno Apollo cambia endpoint, o passiamo
 * a `/organization/match` per motivi GDPR (vedi PUBLICATION_PLAN.md
 * riga 151, mitigazione GDPR), modifichiamo SOLO questo file.
 */

'use strict';

const fetch = require('node-fetch');

const APOLLO_MATCH_URL = 'https://api.apollo.io/api/v1/people/match';

/**
 * Calls Apollo /people/match and returns normalized fields.
 *
 * @param {object} params
 * @param {string} params.apiKey     Apollo API key (iniettata dal chiamante, mai letta da env qui).
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
 * Non throwa su errori Apollo: ritorna sempre un oggetto con `ok: false`
 * così il chiamante può decidere se loggare, contare la quota, restituire 502 ecc.
 * Throwa solo su errori di rete/parsing irrecuperabili.
 */
async function matchPerson({ apiKey, email, firstName, lastName }) {
  if (!apiKey) {
    throw new Error('apolloClient.matchPerson: apiKey is required');
  }
  if (!email && !firstName && !lastName) {
    throw new Error('apolloClient.matchPerson: provide at least email or name fields');
  }

  // Costruisco il payload solo con i campi presenti.
  // Apollo accetta match parziale: se non hai l'email cerca per nome+cognome.
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
    // Apollo ha risposto qualcosa di non-JSON (pagina HTML di rate limit, errore 5xx).
    // Non è un crash: segnaliamo al chiamante che la risposta è inutilizzabile.
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

  // Apollo può tornare 200 anche senza match: person = null.
  // È una "call consumata senza dati".
  const person = json.person || null;
  return {
    ok: true,
    status: apolloRes.status,
    jobTitle: person?.title || null,
    company: person?.organization?.name || null,
    companySize: person?.organization?.estimated_num_employees || null,
    // Fatturato grezzo (USD). Apollo usa `organization_revenue`; alcune risposte
    // espongono `annual_revenue`. 0/null = sconosciuto → il mapping lo tratta come vuoto.
    revenue: person?.organization?.organization_revenue ?? person?.organization?.annual_revenue ?? null,
    industry: person?.organization?.industry || null,
    country: person?.country || null,
    errorMessage: null,
  };
}

module.exports = { matchPerson };
