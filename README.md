# Doxee Marketing AI — Hub

Index of all automations built by the Doxee Marketing team.  
Each automation lives in its own folder with full documentation.

> Built during Leonardo Bellani's internship (April–June 2026).

---

## Automations

| Name | What it does | Folder |
|---|---|---|
| **LeadCleaner** | Upload XLSX → Apollo enrichment → scoring → HubSpot-ready export | [leadcleaner/](./leadcleaner/) |
| **Deal Engagement** | Extracts deal engagement data from HubSpot → Excel | [deal-engagement/](./deal-engagement/) |
| **Event Mailer** | Automated event email sending via Microsoft Graph | [event-mailer/](./event-mailer/) |

---

## Quick start (first time, ~5 min)

**1. Download the project** — in Terminal:

```bash
git clone https://github.com/Doxee-Marketing/marketing-automation.git
cd marketing-automation
```

**2. Install age** (one-time, no admin) — Mac:

```bash
mkdir -p ~/bin
A=$([ "$(uname -m)" = arm64 ] && echo arm64 || echo amd64)
curl -L -o /tmp/age.tgz "https://github.com/FiloSottile/age/releases/download/v1.2.1/age-v1.2.1-darwin-$A.tar.gz"
tar xzf /tmp/age.tgz -C /tmp && mv /tmp/age/age /tmp/age/age-keygen ~/bin/
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.zshrc && export PATH="$HOME/bin:$PATH"
```

Windows (PowerShell) and full details: [`docs/QUICKSTART.md`](./docs/QUICKSTART.md) / [`docs/SECRETS.md`](./docs/SECRETS.md).

**3. Add the key** — ask **acestari@doxee.com** for `age-key.txt`, then drag that file into the **`secrets/`** folder (next to `secrets.env.age`).

**4. Run a tool** — open its folder (e.g. `leadcleaner/`) and double-click **`start.command`** (Mac) or **`start.bat`** (Windows). The browser opens, ready. Done.

From the second time on: just double-click the launcher.

---

## For contributors

Each automation folder has a "For developers" section in its README with technical details.  
To add a new automation: create a new folder following the template in `docs/README-TEMPLATE.md` and update the table above.

---

## Where things are

| Path | What's inside |
|---|---|
| `leadcleaner/`, `deal-engagement/`, `event-mailer/` | The three automations, each self-contained with its own README |
| `secrets/` | age-encrypted credentials + the loaders the launchers use — setup in [`docs/SECRETS.md`](./docs/SECRETS.md) |
| `docs/` | Documentation: [`SECRETS.md`](./docs/SECRETS.md), the team guide, `README-TEMPLATE.md` |
| `README.md`, `CLAUDE.md` | This index, and the working notes/conventions for the repo |
| `.gitignore` | Base gitignore (covers Python, Node, and all secret files) |

---

## Contact

Alessio Cestari – acestari@doxee.com
Leonardo Bellani — lbellani@doxee.com  
Emanuela Disperati — edisperati@doxee.com  
Doxee Marketing Team — ref: Judith Schuder