# LeadCleaner

Internal Doxee web app to enrich XLSX lead files via the Apollo.io API and compute a quality score.

---

## Quick start

```bash
# Mac: double-click start.command   |   Windows: double-click start.bat
# Or from the terminal:
cd leadcleaner
cp .env.example .env      # then add APOLLO_API_KEY
npm install
node server.js            # → http://localhost:3000
```

---

## Flow

1. Upload an XLSX file with the leads (columns: email, first name, last name)
2. The app maps the headers automatically (IT / EN / DE)
3. Click **Enrich** — the backend calls Apollo `/people/match` for each lead
4. The enriched fields (Job Title, Industry, Company Size) are added to the table
5. Each lead gets a **score** computed server-side
6. Export the result to XLSX

---

## Scoring

| Condition | Points |
|-----------|-------|
| Job title in the target list (C-level, IT leadership) | +5 |
| Negative job title (Student, HR) | -15 |
| Industry in the target list (Banking, Telco, IT Services…) | +10 |
| Company size ≥ 500 employees | +5 |

Range: -15 → +25. The lists are in `src/services/scoring.js`.

---

## Structure

```
leadcleaner/
├── server.js                  # Entry point
├── package.json
├── .env.example               # Environment variables template
├── start.command              # Mac launcher (double-click)
├── start.bat                  # Windows launcher (double-click)
├── usage.json                 # Call counter (gitignored, auto-created)
├── src/
│   ├── routes/
│   │   ├── enrich.js          # POST /api/enrich
│   │   └── usage.js           # GET /api/usage
│   └── services/
│       ├── apollo.js          # Apollo.io client
│       ├── scoring.js         # Lead scoring logic
│       └── usage-tracker.js   # Monthly call tracking
├── public/
│   └── index.html             # SPA (HTML + CSS + JS)
└── test/
    ├── test-apollo.xlsx        # Test XLSX file
    └── prova_apollo1.json      # Sample Apollo response
```

---

## Environment variables

| Variable | Default | Description |
|-----------|---------|-------------|
| `APOLLO_API_KEY` | — | **Required.** Apollo.io API key |
| `APOLLO_MONTHLY_LIMIT` | `30020` | Plan's monthly credit limit |
| `PORT` | `3000` | Server port |

---

## API

### `GET /api/usage`

Returns the calls made through this app in the current month. The counter resets automatically at the start of the month.

```json
{
  "month": "2026-05",
  "calls_used": 11
}
```

### `POST /api/enrich`

Enriches a single lead via Apollo `/people/match`.

```json
// Request
{ "email": "mario.rossi@example.com", "first_name": "Mario", "last_name": "Rossi" }

// Response 200
{
  "job_title": "IT Manager",
  "company": "Acme SpA",
  "company_size": 850,
  "industry": "IT Services",
  "country": "Italy",
  "score": 20,
  "calls_used": 12
}

// Response 200 — no match (credit consumed anyway)
{ "job_title": null, "company": null, "company_size": null, "industry": null, "country": null, "score": 0, "calls_used": 12 }

// Response 429 — quota exhausted
{ "error": "Apollo monthly quota exhausted.", "calls_used": 30020 }
```

---

## Note on Apollo credits

Apollo does not expose the monthly credit balance via its public API. The counter in `usage.json` tracks the calls made **through this app**. If you also use Apollo from other tools (the UI, other clients), the real total in the Apollo dashboard will be higher. Check periodically on [developer.apollo.io → Usage](https://developer.apollo.io/).

---

## Apollo Free / Basic limits

| Plan | Credits/month |
|-------|--------------|
| Free  | 50           |
| Basic | 30,020       |

The active limit is configured in `.env` → `APOLLO_MONTHLY_LIMIT`.

---

## Troubleshooting

**Port 3000 already in use**
```bash
lsof -ti :3000 | xargs kill -9
```

**The server starts but Apollo returns 401**
Check that `APOLLO_API_KEY` in `.env` is correct and not expired.

**All enriched fields are null**
Apollo found no match. The credit is consumed anyway. Try email + full name instead of email alone.

**The counter in the header doesn't match the Apollo dashboard**
Apollo does not expose the balance via API. The local counter only tracks calls made through LeadCleaner. This is normal if you've also used Apollo from other tools.
