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

## How to get started

Clone the repo once and you have everything:

```bash
git clone https://github.com/Doxee-Marketing/marketing-automation.git
```

Then go into the folder of the automation you need and follow its README.

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