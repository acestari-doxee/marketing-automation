# Deal Engagement Extractor — HubSpot → Excel

Local workflow that starts from a HubSpot deal segment and produces an Excel file matching `hubspot_deal_report.xlsx` (already validated format): for each deal it shows the account, opportunity, amount, close date and all contacts of the account with their lead score.

Runs on a single person's PC. One command, one Excel file.

---

## Output

`output/hubspot_deal_report_<YYYYMMDD_HHmm>.xlsx` with two sheets, matching the approved template:

**Sheet 1 — `Deal Report`** (one row per contact)

| Account Name | Opportunity Name | Amount (€) | Close Date | Contact Name | Job Title | Email | Lead Score |
|---|---|---|---|---|---|---|---|

The four deal columns (Account, Opportunity, Amount, Close Date) appear only on the first row of each group; subsequent contacts of the same deal have those fields blank.

**Sheet 2 — `Legend`**
Lead Score Reference 
≥ 10 → High engagement
5–9 → Medium engagement 
0–4 → Low engagement 
— → Not yet scored

---

## Filter applied

Only contacts with a **`null` / unset score** (shown as `—` in the template) are excluded. All contacts with a numeric score (including 0) are kept: the "Low engagement" label is applied by the legend, not the script. The threshold can be raised in `config.yaml` if needed.

---

## Pipeline

```
[config.yaml] ──▶ run.py ──▶ data/cache/*.json ──▶ output/*.xlsx
   │                 ▲
   │                 │
   └─ list_id,       └─ HubSpot REST API (Private App token)
      score_property,
      score_threshold
```

Steps (idempotent, each caches its own JSON in `data/cache/`):

1. `step1_list_memberships.json` — GET deals in the segment
2. `step2_deals_detail.json` — POST batch read deals (`dealname`, `amount`, `closedate`)
3. `step3_deal_to_companies.json` — POST associations deal → company
4. `step4_companies_detail.json` — POST batch read companies (`name`, `domain`)
5. `step5_company_to_contacts.json` — POST associations company → contact (all account contacts)
6. `step6_contacts_detail.json` — POST batch read contacts (`firstname`, `lastname`, `jobtitle`, `email`, `<score_property>`)
7. **local score filter** — drop contacts with `null` score or below threshold
8. **build XLSX with openpyxl** — template schema

The 6 JSON files already downloaded should be copied to `data/cache/` with the names above. The script skips steps already in cache. For a clean re-run: `rm -rf data/cache/`.

---

## Design decisions

| Decision | Choice | Why |
|---|---|---|
| Language | Python 3.10+ | Already aligned with existing stack (openpyxl). |
| Token | local `.env` | No credentials committed to git. |
| Caching | Per-step JSON files | Fast re-runs, clean debugging. |
| Score threshold | `> null` (default) | Exactly replicates the already-validated file. Configurable. |
| Contact scope | company-wide | The 7 deal-level contacts are too few; the approved file uses company contacts. |
| Score property | `lead_score_contacts_total` | Doxee custom property. Switch to `lead_score_contacts_engagement` to measure only marketing engagement. Change in `config.yaml`. |
| Output | XLSX | Required format, readable by anyone. |

---

## How to run

### Option A — graphical interface (recommended)

Double-click:
- **Mac**: `start.command`
- **Windows**: `start.bat`

The first run installs dependencies (~1 minute). Your browser opens at `http://localhost:8501` with an interface that includes:
- Sidebar for token, list ID, score threshold
- "Generate report" button with progress bar
- 4 KPIs at the top (number of deals, accounts, engaged contacts, total pipeline €)
- Download XLSX button
- Data preview table

To close the app: close the terminal window that opened.

> **Mac — first run**: if the system says "cannot be opened because the developer cannot be verified", right-click the file → Open → Open. Only needed once.

### Option B — command line (for developers / scheduling)

```bash
cd "deal-engagement/src"
python3 -m venv .venv
source .venv/bin/activate           # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                # paste your HubSpot token inside
python run.py
```

Runtime: ~30 sec from scratch, ~3 sec with cache. Output: `output/hubspot_deal_report_<timestamp>.xlsx`.

---

## HubSpot token

> The token and password already exist — ask  acestari@doxee.com  before creating a new one.

Settings → Integrations → Private Apps → Create app. Required scopes:

`crm.lists.read`, `crm.objects.deals.read`, `crm.objects.contacts.read`, `crm.objects.companies.read`, `crm.associations.read`

The token can be entered each time in the app sidebar, **or** saved once in `.env` (copy `.env.example` and paste it in). The token never leaves your PC.

---

## Configuration (`config.yaml`)

```yaml
list_id: 17603
score_property: lead_score_contacts_total   # or lead_score_contacts_engagement
score_threshold: null                        # null = exclude only unscored. Set 1 / 5 / 10 for stricter filters
output_dir: ./output
cache_dir: ./data/cache
```

---

## What it does not do (by design)

- No activities, no lookback window. Score is the engagement proxy.
- Read-only on HubSpot. No writes.
- No scheduling, no n8n. Double-click the script.
- No Salesforce sync.

---

## Open points

- [ ] Confirm score property name in Doxee HubSpot (`lead_score_contacts_total` vs `lead_score_contacts_engagement`)
- [ ] Validate list ID 17603 = "Deal Created in 2026 – New Logo/Cross-Sell"
- [ ] Decide with Judith whether `score_threshold` should be `null` (exclude only unscored, as now) or `> 0`