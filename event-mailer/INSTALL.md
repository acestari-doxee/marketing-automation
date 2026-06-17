# INSTALL — Installation Guide

This guide takes you from zero to your first invitation sent, step by step. No technical knowledge required.

---

## 1. What you need before you start

- A Mac or a Windows PC (Windows 10 or later).
- A Microsoft 365 account with calendar access (e.g. a company account).
- Access to your organisation's Azure portal to register the app (or someone who can do it for you — see section 4).
- An internet connection.

---

## 2. Install Python 3

**Mac:**

Go to [python.org/downloads](https://www.python.org/downloads/).

Click the large yellow **Download Python 3.x.x** button. A `.pkg` file will download.

Double-click the downloaded file and follow the wizard: Continue → Continue → Agree → Install.

To verify the installation, open Terminal (search with Spotlight: `Cmd+Space`, type `Terminal`, press Enter) and run:

>python --version

Press Enter. You should see something like `Python 3.12.3`. If a version number appears, Python is installed correctly.

**Windows:**

Go to [python.org/downloads](https://www.python.org/downloads/). Click the large yellow **Download Python 3.x.x** button. An installer (`.exe`) will download.

Double-click the installer. **IMPORTANT:** on the first screen, check the box **"Add Python to PATH"** before clicking **Install**. Without this, the program won't find Python.

Click **Install Now** and wait. Close the installer when done.

To verify: open Command Prompt (search for `cmd` in the Start menu) and run:

>python --version

You should see something like `Python 3.12.3`.

---

## 3. Download the project with Git

The project is downloaded with Git. Do **not** use GitHub's "Download ZIP": on a Mac a downloaded ZIP is quarantined by Gatekeeper and the launcher won't open with a double-click, and the folder name is wrong. Git clone avoids both problems.

### 3.1 — Install Git (only if you don't have it)

Many corporate PCs don't have Git pre-installed. Check first — open Terminal (Mac) or Command Prompt (Windows, search `cmd` in the Start menu) and run:

```
git --version
```

If it prints `git version 2.xx.x`, skip to 3.2. If it says "command not found" / "not recognized", install it:

- **Windows:** go to [git-scm.com/download/win](https://git-scm.com/download/win) — a `.exe` downloads automatically. Double-click it, click **Next** through the wizard leaving every default, then **Install** and **Finish**. Close and reopen the Command Prompt, then re-run `git --version` to confirm.
- **Mac:** run `xcode-select --install` in Terminal and confirm the popup, or download the installer from [git-scm.com/download/mac](https://git-scm.com/download/mac). Then re-run `git --version`.

> If your corporate PC blocks the installer, ask IT to install Git for Windows for you — it's a standard, approved tool.

### 3.2 — Clone the project

In Terminal / Command Prompt, move to the Desktop and clone the repo:

**Mac:**

```
cd ~/Desktop
git clone https://github.com/Doxee-Marketing/marketing-automation.git
cd marketing-automation/event-mailer
```

**Windows:**

```
cd %USERPROFILE%\Desktop
git clone https://github.com/Doxee-Marketing/marketing-automation.git
cd marketing-automation\event-mailer
```

A `marketing-automation` folder is created on the Desktop; `event-mailer` is the subfolder you'll work in.

---

## 4. Azure credentials — ALREADY DONE, SKIP THIS SECTION

> **You don't need to register anything.** The Azure app is already set up and the three credentials (Tenant ID, Client ID, Client Secret) already exist. Ask **acestari@doxee.com** for them, shared **only** via the company password manager (never Teams, email or chat — the Client Secret is a password). Then jump straight to section 5.
>
> The steps below are kept for reference only, in case the app ever has to be re-registered from scratch.

This step provides the credentials the program uses to access the Microsoft calendar. It only needs to be done once.

If you don't have permission to register apps on Azure in your organisation, ask your IT administrator to follow these steps and give you the three final values: Tenant ID, Client ID and Client Secret.

### 4.1 — Open the Azure portal

Go to [portal.azure.com](https://portal.azure.com) and sign in with your Microsoft 365 account.

### 4.2 — Go to App Registrations

In the search bar at the top, type `App registrations`. Click the **App registrations** result.

### 4.3 — Create a new app

Click **+ New registration** (top left).

In the **Name** field, enter any name, for example `event-mailer`.

Under **Supported account types**, select **Accounts in this organizational directory only**.

Leave everything else as-is. Click **Register**.

You are now on your app's page. You'll find two important values:

- **Application (client) ID** → copy and save it somewhere.
- **Directory (tenant) ID** → copy and save it somewhere.

### 4.4 — Enable the device code flow

In the left menu, click **Authentication**.

Click **+ Add a platform**. Select **Mobile and desktop applications**.

Check the box `https://login.microsoftonline.com/common/oauth2/nativeclient`. Click **Configure**.

Go back to the **Authentication** page. Scroll down to **Advanced settings**. Set **Allow public client flows** to **Yes**. Click **Save**.

### 4.5 — Add permissions

In the left menu, click **API permissions**.

Click **+ Add a permission**. Select **Microsoft Graph**. Select **Delegated permissions**.

Search for and check these five permissions:

- `Calendars.ReadWrite`
- `Mail.Read`
- `Mail.Send`
- `User.Read`
- `offline_access`

Click **Add permissions**.

Click **Grant admin consent for [organisation name]**, then confirm with **Yes**.

If you don't see this button, you need administrator permissions. Ask IT.

### 4.6 — Create the Client Secret

A Client Secret is a password generated by Microsoft for your app: it proves that it's you using it.

In the left menu, click **Certificates & secrets**. Click **+ New client secret**.

In the **Description** field write something like `event-mailer`. Under **Expires**, choose **24 months** (or the maximum available). Click **Add**.

A row appears with the secret. The value in the **Value** column is only visible now: copy it immediately and save it somewhere safe. If you leave the page without copying it, you'll need to create a new one.

You now have everything: Tenant ID, Client ID, Client Secret.

---

## 5. Create the event in Outlook and save it as .ics

Create your event normally in Outlook (web or desktop): set the title, date, time and description.

**From Outlook Web** ([outlook.office.com](https://outlook.office.com)):

Open the event in the calendar. Click **...** (the three dots, top right of the event). Click **Export event**. An `.ics` file will download.

**From Outlook Desktop (Mac):**

Open the event. From the top menu choose **File → Save As**. Choose the **ICS** format. Click **Save**.

**From Outlook Desktop (Windows):**

Open the event with a double-click so it opens in its own window. Click **File → Save As**. In the dialog, open the **Save as type** dropdown at the bottom and choose **iCalendar Format (*.ics)**. Pick a location (e.g. the Desktop) and click **Save**.

> If you only use the new Outlook for Windows (the one without the **File** menu), it behaves like Outlook Web: open the event, click the **...** menu and choose **Export event**.

Rename the downloaded file to `evento.ics` (all lowercase, no spaces).

Copy `evento.ics` into the **`ics`** subfolder, i.e. `event-mailer/ics/` (on Windows: `event-mailer\ics\`). That's where the program looks for it — not the main `event-mailer` folder. You'll see an `evento.example.ics` already in there; leave it, just add yours next to it.

---

## 6. First run

**Mac:**

Open the `event-mailer` folder in Finder.

Double-click `start.command`.

A Terminal window opens. If a macOS security warning appears ("cannot open the application from an unidentified developer"), go to **System Settings → Privacy & Security** and click **Open Anyway**.

The program installs the required dependencies (needs internet, takes a few seconds). Then the setup wizard starts.

**Windows:**

Double-click `start.bat` in the `event-mailer` folder.

If a Windows security warning appears ("Windows protected your PC"), click **More info → Run anyway**. This warning appears because the `.bat` file is not digitally signed.

A Command Prompt window opens. First run: dependencies install automatically (needs internet, takes about 1 minute). Do not close the window.

The wizard does three things:

**[1/3] Event:** reads the `evento.ics` file and automatically suggests the title as a keyword. Press Enter to confirm, or type a different keyword (one word from the event title) and press Enter.

**[2/3] Azure:** the program asks for Tenant ID and Client ID. Paste the values you copied in step 4 and press Enter after each one.

**[3/3] Client Secret:** the program asks for the Client Secret. Paste it and press Enter. The cursor won't move as you type (this is normal: the text is hidden for security). The secret is saved encrypted in the macOS Keychain and will never appear in any file.

When you see `Setup complete.`, the wizard is done.

---

## 7. Microsoft login (device code flow)

Right after setup, the program starts the Microsoft login.

You'll see something like this in the Terminal:

```
Code: ABC-DEF (already copied to clipboard)
Page: https://login.microsoftonline.com/common/oauth2/deviceauth
Browser opened. Paste the code and confirm. Waiting here...
```

Your browser opens automatically on the Microsoft page. The code is already in your clipboard.

Click in the text field on the Microsoft page and paste the code:

- **Mac:** `Cmd+V`
- **Windows:** `Ctrl+V`

Click **Next**.

Sign in with your Microsoft 365 account (company email and password). Confirm the requested permissions.

Go back to the Terminal. When you see `Login confirmed.`, the login was successful.

The dashboard opens automatically in your browser at `http://localhost:8765`.

---

## 8. Using the dashboard

**View responses:** the cards at the top show the number of Accepted, Declined, Tentative and Pending replies. The table updates automatically every 8 seconds.

**Add a guest:** fill in the Name and Email fields in the "Add guest" section. Click **Send invitation**. The recipient receives an email with the iCalendar invitation (with Accept / Decline / Maybe buttons, compatible with Gmail and any email client).

**Filter by status:** click one of the coloured cards (Accepted, Declined, etc.) to filter the table. You can select more than one. Click **Clear filters** to remove them.

**Export to Excel:** click the **Export XLSX** button. If a filter is active, the file will contain only the visible participants. The file is named `rsvp_[status]_[datetime].xlsx` and is saved to your Downloads folder.

**Refresh manually:** click the **↻ Refresh** button (top right) to force a fresh read from Exchange.

**Change a manually added guest's status:** if a guest was added via the dashboard (not through Outlook), their status shows a ▾ arrow. Click it to change their status.

---

## 9. Subsequent runs

From the second run onwards: double-click `start.command`. The wizard does not restart. Microsoft login happens automatically (the token is renewed silently). The dashboard opens directly in the browser.

**If you change the event:** replace the `evento.ics` file in the `event-mailer/ics/` folder and delete `config.json`. On the next run the wizard restarts and asks for the new information (Azure credentials stay in the Keychain — you won't need to re-enter them).

---

## 10. Troubleshooting

**The Terminal closes immediately without doing anything.**
Check that `start.command` is in the same folder as the other files (`server.py`, `setup.py`, etc.). If you moved them separately, put them back together.

**"Python 3 not found".**
Python is not installed or not in PATH. Go back to section 2 and reinstall it. After installation, close and reopen the Terminal.

**"No .ics file found in the folder".**
The event file is not in the `event-mailer/ics/` folder, or it has a different name from `evento.ics`. Check the file name and location.

**The browser doesn't open during login.**
The program prints the URL in the Terminal. Open it manually by copying it into your browser: `https://login.microsoftonline.com/common/oauth2/deviceauth`. The code is already in your clipboard — paste it there.

**"Access denied by user" or Azure permissions error.**
The app permissions were not granted correctly (section 4.5). Go back to the Azure portal, check that all five permissions are present and that admin consent has been granted (the "Granted" label in the Status column).

**"Port 8765 already in use".**
There is already a `start.command` window open. Close the previous Terminal window (or press `Ctrl+C` in that window) before reopening it.

**The Client Secret has expired or been revoked.**
Delete `.token_cache.json` from the `event-mailer` folder. Delete `config.json`. Restart `start.command`: the wizard restarts and you can enter the new secret.

**"No event with '...' in the title found on Exchange".**
The configured keyword does not match the event title in the calendar. Open `config.json` and update the `event_keyword` value with a word from the exact event title as it appears in Outlook.

**`start.bat` closes immediately without output (Windows).**
Right-click `start.bat` → **Run as administrator** to rule out permission issues. If it still closes, open Command Prompt, navigate to the `event-mailer` folder, and run:

>python automation\server.py

This keeps the window open so you can read the error.

**"Python was not found" or "python is not recognised" (Windows).**
Python is installed but not in PATH. Open the Python installer again, click **Modify**, then on the first screen check **"Add Python to PATH"**. Restart the Command Prompt after this change.

**Client Secret not saved / keyring error (Windows).**
On Windows, `keyring` uses the Windows Credential Locker. If it fails, run:

>pip install keyring --upgrade

Then delete `config.json` and re-run `start.bat` to go through setup again.

**"Port 8765 already in use" (Windows).**
Find and close the other `start.bat` window. Or, in Command Prompt, run:

>netstat -ano | findstr :8765

Note the PID in the last column, then:

>taskkill /PID &lt;PID&gt; /F