# CLAUDE.md — Doxee Marketing AI

Doxee marketing automation repo. Built by Leonardo Bellani (April–June 2026).

---

## Repo structure

```
doxee-marketing-ai/
├── leadcleaner/       # Node.js — XLSX web app → Apollo enrichment → scoring
├── deal-engagement/   # Python — HubSpot deals → Excel report
├── event-mailer/      # Python — Outlook RSVP dashboard + cross-client invites
└── README-TEMPLATE.md # Standard template for new automations
```

Each automation is self-contained and has its own README, stack and environment variables.

---

## Stack by project

| Project | Runtime | Key dependencies | Secrets |
|---|---|---|---|
| `leadcleaner` | Node.js | Express, xlsx, axios | `APOLLO_API_KEY` in `.env` |
| `deal-engagement` | Python 3.8+ | requests, openpyxl, streamlit, PyYAML | `HUBSPOT_TOKEN` in `src/.env` |
| `event-mailer` | Python 3.8+ | Microsoft Graph API, icalendar, openpyxl | Azure AD app credentials in `config.json` |

---

## Before touching any code

1. Read the README of the specific folder — it holds the flow, the configurable parameters and the constraints.
2. Secrets are shared via one age-encrypted file at the repo root (`secrets.env.age`) — see `SECRETS.md`. The launchers decrypt it and inject the values as environment variables (`APOLLO_API_KEY`, `HUBSPOT_TOKEN`, `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`). A local `.env` / `config.json` still works as a fallback. Never commit real credentials, `secrets.env` (plaintext) or `age-key.txt`.
3. Do not edit `usage.json` in `leadcleaner/` — it's the Apollo call counter and is managed by the server.

---

## Important constraints

**Apollo (LeadCleaner)**
- The active plan has a monthly credit limit configured in `APOLLO_MONTHLY_LIMIT` (default: 30,020).
- The local counter (`usage.json`) only tracks calls made through LeadCleaner. If Apollo is also used by other tools, the real balance in the Apollo dashboard will be lower.
- The enrichment endpoint is `POST /people/match` — it consumes a credit even when it finds no match.
- Always handle the 429 case (`quota exhausted`) before running large batches.

**HubSpot (Deal Engagement)**
- The app is read-only: it never writes anything to HubSpot.
- The token is a Private App token (prefix `pat-eu1-...`). Required scopes: `crm.lists.read`, `crm.objects.deals.read`, `crm.objects.contacts.read`, `crm.objects.companies.read`, `crm.associations.read`.
- Historical data from before April 2026 is not synced with Salesforce.
- The cache lives in `src/data/cache/`. Keep it current by disabling the flag when you need fresh data.

**Microsoft Graph (Event Mailer)**
- Requires a registered Azure AD app with the correct permissions (see `event-mailer/INSTALL.md`).
- RSVP replies from Gmail and non-Microsoft clients are read from the organiser's inbox via API, not from the direct Exchange notification.

---

## Lead scoring (LeadCleaner)

The logic is in `leadcleaner/src/services/scoring.js`. Range: -15 → +25.

| Condition | Points |
|---|---|
| Job title in the target list (C-level, IT leadership) | +5 |
| Negative job title (Student, HR) | -15 |
| Industry in the target list (Banking, Telco, IT Services…) | +10 |
| Company size ≥ 500 employees | +5 |

To update the lists, edit `TARGET_TITLES`, `NEGATIVE_TITLES`, `TARGET_INDUSTRIES` directly in that file.

---

## Deal Engagement — main parameters

| Parameter | Common values |
|---|---|
| `list_id` | `17621` (2026 opps) / `17603` (current month) |
| `score_property` | `lead_score_contacts_total` / `lead_score_contacts_engagement` |
| `score_threshold` | `null` excludes only unscored contacts; `5` → only Medium+High |

Configuration in `deal-engagement/src/config.yaml`.

---

## Adding a new automation

1. Create a new folder in the root.
2. Copy `README-TEMPLATE.md` and fill it in.
3. Add the row to the table in the main README.
4. Add a `start.command` (Mac) and a `start.bat` (Windows) if it's a local app, both in the automation's root folder.
5. Always add a `.env.example` / `config.example.json` — never files with real credentials.

---

## Contacts

Leonardo Bellani — lbellani@doxee.com  
Emanuela Disperati — edisperati@doxee.com  
Ref: Judith Schuder (Marketing)
