# Event Mailer

RSVP dashboard for Outlook events, including recipients on Gmail and other non-Microsoft domains.

---

## Who it's for

- Anyone who organises company events via Microsoft 365 calendar and needs to track attendance confirmations.
- Anyone who needs to invite people with Gmail or other email providers who don't receive Outlook invitations correctly.
- Anyone who needs to export the participant list to Excel in one click.

---

## What it does

- Reads RSVP statuses in real time from the Microsoft Exchange calendar (Accepted, Declined, Tentative, Pending).
- Sends invitations compatible with Gmail, Apple Mail and any email client: the recipient sees Accept / Decline / Maybe buttons directly in the email.
- Collects replies from non-Microsoft addresses by reading the organiser's inbox via API.
- Allows adding new guests directly from the dashboard, with immediate invitation sending.
- Exports the RSVP list to a formatted Excel file (.xlsx), filterable by status.

---

## Requirements

- Mac (macOS 10.15 or later) or Windows (10 or later).
- Python 3.8 or later (download from [python.org](https://www.python.org/downloads/)).
- A Microsoft 365 account with calendar access (e.g. a company or school account).
- An app registered on Azure Active Directory with the correct permissions (see `INSTALL.md`). ✅ Done

---

## Quick start

1. Follow the full guide in `INSTALL.md` for the first run.
2. Export the event from Outlook as `evento.ics` and place it in the `event-mailer/ics/` folder.
3. Double-click `start.command` (Mac) or `start.bat` (Windows).

---

## How it works under the hood

On first run, a wizard automatically reads the `.ics` file in the folder, extracts the event title, and asks for Azure credentials once. The Client Secret is never written to a text file: it is saved encrypted via the `keyring` library (macOS Keychain on Mac, Windows Credential Locker on Windows).

To authenticate with Microsoft, the program uses the OAuth2 device code flow: it generates a one-time code, copies it to the clipboard, and opens the browser on the Microsoft login page. The user pastes the code, confirms with their account, and the program automatically receives the access token — the password never passes through the code.

All RSVP data is read in real time from the Microsoft Graph API: both from the Exchange event's attendee list and from the organiser's inbox (to capture replies from Gmail and similar addresses that Exchange does not process automatically).

The dashboard refreshes every 8 seconds without needing to reload the page.

---

## Privacy and security

- The Client Secret is saved in the OS credential store (macOS Keychain / Windows Credential Locker): it never ends up in a text file and is never transmitted to third-party services.
- The `config.json` file (which contains Tenant ID and Client ID) is listed in `.gitignore` and is not included in any commits.
- The Microsoft access token is saved in `.token_cache.json` with `chmod 600` permissions (readable only by the current user).
- No data is sent to external servers outside of the Microsoft Graph API.

---

## Known limitations

- Requires the Azure app to have device code flow enabled (Public client flows: Yes). Without this setting, login will not work.
- The dashboard runs locally on port 8765: it is not accessible from other computers on the network.

---

## License

MIT — see LICENSE for the full text.