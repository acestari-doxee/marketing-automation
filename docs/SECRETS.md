# Secrets — how credentials work in this repo

All credentials (Apollo key, HubSpot token, Azure app credentials) live in **one
encrypted file**: `secrets/secrets.env.age`, committed to the repo. It is encrypted
with [age](https://age-encryption.org) for a single shared team key. The launchers
(`start.command` / `start.bat`) decrypt it at startup and pass the values to the
app as environment variables — nothing is written to disk in plaintext.

Everything related to secrets lives in the **`secrets/`** folder:

```
doxee-marketing-ai/
├── secrets/
│   ├── secrets.env.age      # encrypted secrets — COMMITTED
│   ├── secrets.env.example  # template (keys only, no values) — committed
│   ├── .age-recipients      # team PUBLIC key — committed (public keys are not secret)
│   ├── load-secrets.sh      # decrypt + export (used by Mac launchers)
│   ├── load-secrets.bat     # decrypt + export (used by Windows launchers)
│   ├── encrypt-secrets.sh   # re-encrypt secrets.env -> secrets.env.age
│   ├── secrets.env          # plaintext — LOCAL ONLY, gitignored, never commit
│   └── age-key.txt          # PRIVATE decryption key — LOCAL ONLY, gitignored, from password manager
├── deal-engagement/  event-mailer/  leadcleaner/   # the tools
├── docs/             # documentation (this file, guides, template)
├── README.md  CLAUDE.md
```

The secrets file is a plain `KEY=VALUE` list (no comments, no blank lines needed):

```
APOLLO_API_KEY=...
HUBSPOT_TOKEN=pat-na1-...
AZURE_TENANT_ID=...
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
```

## Install age (no admin rights needed)

You do NOT need Homebrew or administrator rights — age installs into your own `~/bin`.

**Mac** — Terminal:

```
mkdir -p ~/bin && cd ~/bin
A=$([ "$(uname -m)" = arm64 ] && echo arm64 || echo amd64)
curl -L -o age.tar.gz "https://github.com/FiloSottile/age/releases/download/v1.2.1/age-v1.2.1-darwin-$A.tar.gz"
tar xzf age.tar.gz && mv age/age age/age-keygen ~/bin/ && rm -rf age age.tar.gz
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.zshrc && export PATH="$HOME/bin:$PATH"
age --version
```

**Windows** — PowerShell:

```
mkdir "$HOME\bin" -Force | Out-Null
Invoke-WebRequest "https://github.com/FiloSottile/age/releases/download/v1.2.1/age-v1.2.1-windows-amd64.zip" -OutFile "$env:TEMP\age.zip"
Expand-Archive "$env:TEMP\age.zip" "$env:TEMP\age" -Force
Move-Item "$env:TEMP\age\age\age.exe","$env:TEMP\age\age\age-keygen.exe" "$HOME\bin\" -Force
$u=[Environment]::GetEnvironmentVariable("Path","User"); [Environment]::SetEnvironmentVariable("Path","$HOME\bin;$u","User")
```
Then close and reopen PowerShell and run `age --version`.

(With Homebrew: `brew install age`. On Windows with admin: `winget install FiloSottile.age`.)

## One-time team setup (done once, by whoever owns the secrets)

All commands run from the `secrets/` folder:

```
cd secrets
```

1. Generate the team key — writes the private key to `age-key.txt` and prints the public key:

   ```
   age-keygen -o age-key.txt
   ```

2. Put the public key into `.age-recipients` (replace the placeholder):

   ```
   grep -o 'age1[a-z0-9]*' age-key.txt > .age-recipients
   ```

3. Create `secrets.env` from the template and fill in the real values:

   ```
   cp secrets.env.example secrets.env
   open -e secrets.env
   ```

4. Encrypt it and commit the result:

   ```
   ./encrypt-secrets.sh          # produces secrets.env.age
   cd ..
   git add secrets/secrets.env.age secrets/.age-recipients
   git commit -m "Update encrypted secrets"
   git push
   ```

5. Share `age-key.txt` with the team **only through the company password manager**
   (never email, Teams or chat). It is the one secret everyone needs.

## Per-user setup (each team member, once)

1. `git clone` the repo, then install age (see above).
2. Get `age-key` from the Marketing password repository (1Password, searching "age-key" in **Credentials API**), copy it into a text file and save as age-key.txt
   and drop it into the **`secrets/`** folder, next to `secrets.env.age`.
3. That's it. Double-click `start.command` (Mac) / `start.bat` (Windows) — the
   launcher decrypts the secrets automatically. No passphrase prompt.

If `age` or `age-key.txt` is missing, the launcher prints what to do and falls
back to each tool's local config (`.env` / the Event Mailer setup wizard), so
nothing breaks for someone who hasn't set up age yet.

## Changing or rotating a secret

1. Edit `secrets/secrets.env` with the new value.
2. From `secrets/`, run `./encrypt-secrets.sh` and commit the updated `secrets/secrets.env.age`.

To rotate the **team key itself** (e.g. someone left): run `age-keygen` again,
update `.age-recipients`, re-encrypt, redistribute the new `age-key.txt` via the
password manager, and **rotate the actual credentials** at the providers (Apollo,
HubSpot, Azure).

## Important caveats

- **Git history is forever.** A committed `secrets.env.age` stays in history. If
  `age-key.txt` ever leaks, treat every secret it could decrypt as compromised
  and rotate them at the providers — re-encrypting alone is not enough.
- **`age-key.txt` is the crown jewel.** Anyone with it can read all secrets. It
  lives only in the password manager and on each person's machine, never in git.
- A single shared team key means you cannot revoke one person without rotating
  the key and re-encrypting. That's the trade-off we accepted for simplicity.
