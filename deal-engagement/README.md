# HubSpot Deal Engagement Extractor

Pulls deals from a HubSpot segment and produces an Excel file with accounts, opportunities, contacts and lead scores. One click → one `.xlsx` file. Read-only: nothing is written back to HubSpot.

---

## For end users — step by step

> Follow this section if you have never used the terminal. Just read in order.

### 1. Install Python (first time only)

1. Go to [python.org/downloads](https://www.python.org/downloads/)
2. Click the yellow **"Download Python 3.x.x"** button
3. Open the downloaded file
4. **Windows only:** on the first screen of the installer, check **"Add Python to PATH"** before clicking Install
5. Click Install and wait
6. Close the installer

### 2. Download this project (first time only)

1. Open Terminal (Mac: search "Terminal" with `Cmd + Space`) or Command Prompt (Windows: search "cmd")
2. Navigate to where you want to save the project, e.g. the Desktop:
	cd desktop
3. Download the project (copy and paste):
	git clone [https://github.com/Doxee-Marketing/marketing-automation.git](https://github.com/Doxee-Marketing/marketing-automation.git)
4. Enter the folder: 
	cd marketing-automation/deal-engagement
> If the terminal says `git: command not found`, install Git from [git-scm.com/downloads](https://git-scm.com/downloads) and start again from step 1.

### 3. Set up the HubSpot token (first time only)

The token is the key that allows the script to read data from HubSpot.

To get one:
1. Log in to HubSpot
2. Go to **Settings** (gear icon, top right)
3. In the sidebar: **Integrations → Private Apps**
4. Click **"Create a private app"**
5. Give it a name (e.g. "Deal Engagement Extractor")
6. Go to the **Scopes** tab and check:
   - `crm.lists.read`
   - `crm.objects.deals.read`
   - `crm.objects.contacts.read`
   - `crm.objects.companies.read`
   - `crm.associations.read`
7. Click **"Create app"** → copy the token shown (starts with `pat-eu1-...`)

Now add the token to the project:
1. Open the project folder
2. Go into the `src/` subfolder
3. Find the file `.env.example` — if you can't see it, enable hidden files:
   - **Mac:** in Finder press `Cmd + Shift + .`
   - **Windows:** in File Explorer → View → check "Hidden items"
4. Copy `.env.example` and rename the copy to `.env` (remove `.example`)
5. Open `.env` with a text editor (Notepad on Windows, TextEdit on Mac)
6. Replace `pat-eu1-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` with your token
7. Save and close

### 4. Run the program

- **Mac:** double-click `start.command` in the main folder
- **Windows:** double-click `src/start.bat`

**First run:** a black window opens and installs all dependencies. This takes about 1 minute. Do not close it.

When you see `You can now view your Streamlit app in your browser`, the program is ready. Your browser will open automatically at `http://localhost:8501`.

> **Mac — security warning on first run:** if you see "cannot be opened because the developer cannot be verified", you have two options:
>
> **Option A — via Terminal (faster):** open Terminal, navigate to the project folder and run:
> ```
> xattr -rd com.apple.quarantine .
> ```
> Then try double-clicking `start.command` again.
>
> **Option B — via Settings:** go to **System Settings → Privacy & Security**, scroll down — an alert will appear with an **"Open Anyway"** button. Click it.

### 5. Use the dashboard

Once the web app opens in your browser, you'll find a sidebar on the left with all the parameters and the results in the centre.

#### HubSpot List ID — which one to use

The List ID is the starting filter: it tells the script which deal segment to pull from. The two standard ones are:

| ID | Segment |
|---|---|
| `17621` | All 2026 opportunities |
| `17603` | Current month opportunities |

To use a different segment in the future: go to HubSpot → **CRM → Segments → Lists**, open the list you want → **Details** → at the bottom of the page find the **ILS Segment ID** field. That number is your List ID.

#### Score property — which one to choose

| Property | When to use it |
|---|---|
| `lead_score_contacts_total` | Overall contact score (default) |
| `lead_score_contacts_engagement` | Use this to measure only marketing engagement activity (emails opened, clicks, forms submitted, etc.) — equivalent to the "Engagement/Activity" column previously filled in manually |

> To identify contacts who have been marketing-active in recent months, use `lead_score_contacts_engagement`. It tracks all interaction actions for each individual contact.

#### Score threshold — how to filter

Set the minimum score for a contact to appear in the report:
- **Leave at 0 (or empty)** → all contacts with any score appear; only unscored contacts are excluded
- **Set to 5** → only "Medium" and "High engagement"
- **Set to 10** → only "High engagement"

#### Cache — when to enable or disable

The **"Use local cache"** checkbox reuses data already downloaded from HubSpot (saved in `src/data/cache/`). This makes re-runs much faster (~3 seconds instead of ~30) and doesn't consume API calls.

- **Leave it on** if you're only changing the threshold or property, with no need for fresh data
- **Turn it off** if you want the script to re-read everything from HubSpot (data current as of now)

#### Generate and export

1. Click **"Generate report"** and wait for the progress bar
2. Four KPIs appear at the top: number of deals, accounts, engaged contacts, total pipeline in €
3. Below is a preview table with all the data
4. Click **"Download XLSX"** to download the file

The file is also saved in `src/output/` as `hubspot_deal_report_<date_time>.xlsx`.

### 6. Close the program

Close the terminal/command prompt window that opened in step 4.

---

## Output

`src/output/hubspot_deal_report_<YYYYMMDD_HHmm>.xlsx` — two sheets:

**Sheet 1 — Deal Report** (one row per contact)

| Account Name | Opportunity Name | Amount (€) | Close Date | Contact Name | Job Title | Email | Lead Score |
|---|---|---|---|---|---|---|---|

**Sheet 2 — Legend**

| Score | Band |
|---|---|
| ≥ 10 | High engagement |
| 5–9 | Medium engagement |
| 0–4 | Low engagement |
| — | Not yet scored |

---

## Advanced configuration (`src/config.yaml`)

```yaml
list_id: 17603                             # HubSpot segment ID
score_property: lead_score_contacts_total  # score property
score_threshold: null                      # null = exclude only unscored contacts
output_dir: ./output
cache_dir: ./data/cache
```

---

## Technical documentation

→ [`src/README.md`](src/README.md) — step-by-step pipeline, design decisions, open points.

---

## What it does not do

- Does not write to HubSpot
- Does not connect to Salesforce
- Does not run automatically (no scheduling)
- Does not read activities or emails — lead score is the only engagement proxy