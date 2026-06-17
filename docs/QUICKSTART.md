# Quick start — Doxee Marketing AI

First time, ~5 minutes. No admin rights needed.

**1. Download the project** — open Terminal and paste:

```
git clone https://github.com/Doxee-Marketing/marketing-automation.git
cd marketing-automation
```

**2. Install age** (one-time, no admin):

**Mac** — Terminal:

```
mkdir -p ~/bin
A=$([ "$(uname -m)" = arm64 ] && echo arm64 || echo amd64)
curl -L -o /tmp/age.tgz "https://github.com/FiloSottile/age/releases/download/v1.2.1/age-v1.2.1-darwin-$A.tar.gz"
tar xzf /tmp/age.tgz -C /tmp && mv /tmp/age/age /tmp/age/age-keygen ~/bin/
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.zshrc && export PATH="$HOME/bin:$PATH"
age --version
```

**Windows** — PowerShell:

```
mkdir "$HOME\bin" -Force | Out-Null
Invoke-WebRequest "https://github.com/FiloSottile/age/releases/download/v1.2.1/age-v1.2.1-windows-amd64.zip" -OutFile "$env:TEMP\age.zip"
Expand-Archive "$env:TEMP\age.zip" "$env:TEMP\age" -Force
Move-Item "$env:TEMP\age\age\age.exe" "$HOME\bin\" -Force
$u=[Environment]::GetEnvironmentVariable("Path","User"); [Environment]::SetEnvironmentVariable("Path","$HOME\bin;$u","User")
```

Then **close and reopen** the terminal and run `age --version` — it must print a version.

**3. Add the key** — ask **acestari@doxee.com** for `age-key.txt`, then **drag it with the mouse** into the project's `secrets/` folder (next to `secrets.env.age`). No command to type.

**4. Run** — open the tool's folder (e.g. `leadcleaner/`) and **double-click** `start.command` (Mac) or `start.bat` (Windows). The browser opens, ready to use.

---

From the second time on: just double-click the launcher. If something doesn't start, ask Claude and paste the error message.
