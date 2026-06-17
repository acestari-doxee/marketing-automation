# Secrets — how credentials work in this repo

All credentials (Apollo key, HubSpot token, Azure app credentials) live in **one
encrypted file committed to the repo**: `secrets.env.age`. It is encrypted with
[age](https://age-encryption.org) for a single shared team key. The launchers
(`start.command` / `start.bat`) decrypt it at startup and pass the values to the
app as environment variables — nothing is written to disk in plaintext.

```
doxee-marketing-ai/
├── secrets.env.age      # encrypted secrets — COMMITTED
├── secrets.env.example  # template (keys only, no values) — committed
├── .age-recipients      # team PUBLIC key — committed (public keys are not secret)
├── secrets.env          # plaintext — LOCAL ONLY, gitignored, never commit
├── age-key.txt          # PRIVATE decryption key — LOCAL ONLY, gitignored, from password manager
├── encrypt-secrets.sh   # re-encrypt secrets.env -> secrets.env.age
├── _load-secrets.sh     # decrypt + export (used by Mac launchers)
└── _load-secrets.bat    # decrypt + export (used by Windows launchers)
```

The secrets file is a plain `KEY=VALUE` list (no comments, no blank lines needed):

```
APOLLO_API_KEY=...
HUBSPOT_TOKEN=pat-eu1-...
AZURE_TENANT_ID=...
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
```

## Install age (no admin rights needed)

You do NOT need Homebrew or administrator rights. Install age into your own
`~/bin` folder. On a Mac, paste this into Terminal:

```
mkdir -p ~/bin && cd ~/bin
A=$([ "$(uname -m)" = arm64 ] && echo arm64 || echo amd64)
curl -L -o age.tar.gz "https://github.com/FiloSottile/age/releases/download/v1.2.1/age-v1.2.1-darwin-$A.tar.gz"
tar xzf age.tar.gz && mv age/age age/age-keygen ~/bin/ && rm -rf age age.tar.gz
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.zshrc
export PATH="$HOME/bin:$PATH"
age --version
```

If the download is blocked by the corporate network too, use the **vendored
binary** fallback: someone who can download age commits the binaries into the
repo under `tools/` (`tools/age-darwin-arm64`, `tools/age-darwin-amd64`,
`tools/age-windows-amd64.exe`). The launchers automatically prefer `tools/age-*`
when present, so after a `git pull` it works with zero install.

(With Homebrew: `brew install age`. On Windows with admin: `winget install FiloSottile.age`.)

## One-time team setup (done once, by whoever owns the secrets)

1. Generate the team key:

   ```
   age-keygen -o age-key.txt
   ```

   This prints the **public key** (`age1...`) and writes the **private key** to
   `age-key.txt`.

2. Put the public key into `.age-recipients` (replace the placeholder line).

3. Create `secrets.env` from the template and fill in the real values:

   ```
   cp secrets.env.example secrets.env
   ```

4. Encrypt it and commit the result:

   ```
   ./encrypt-secrets.sh          # produces secrets.env.age
   git add secrets.env.age .age-recipients
   git commit -m "Update encrypted secrets"
   ```

5. Share `age-key.txt` with the team **only through the company password manager**
   (never email, Teams or chat). It is the one secret everyone needs.

## Per-user setup (each team member, once)

1. Install age (see above).
2. Get `age-key.txt` from the company password manager (ask **acestari@doxee.com**)
   and place it in the repo root, next to `secrets.env.age`.
3. That's it. Double-click `start.command` (Mac) / `start.bat` (Windows) — the
   launcher decrypts the secrets automatically. No passphrase prompt.

If `age` or `age-key.txt` is missing, the launcher prints what to do and falls
back to each tool's local config (`.env` / the Event Mailer setup wizard), so
nothing breaks for someone who hasn't set up age yet.

## Changing or rotating a secret

1. Edit `secrets.env` with the new value.
2. Run `./encrypt-secrets.sh` and commit the updated `secrets.env.age`.

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
