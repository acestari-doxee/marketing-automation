"""
Event Mailer — first-run wizard.

- Auto-detects the .ics file in ics/ and extracts the keyword from SUMMARY.
- Asks for tenant_id, client_id, client_secret once — UNLESS they are already
  provided as environment variables (AZURE_TENANT_ID / AZURE_CLIENT_ID /
  AZURE_CLIENT_SECRET), e.g. injected by the launcher via age. In that case the
  wizard only asks for the event keyword.
- Saves config.json (no secrets) + client_secret in the OS keychain via 'keyring'.
"""

import getpass
import json
import os
import sys
from pathlib import Path

import keyring

BASE_DIR  = Path(__file__).parent
ROOT_DIR  = BASE_DIR.parent
ICS_DIR   = ROOT_DIR / "ics"
CONFIG_FILE = BASE_DIR / "config.json"
KEYRING_SERVICE = "event-mailer"


def _ics_candidates():
    """.ics files in ics/, excluding the template."""
    return sorted(p for p in ICS_DIR.glob("*.ics") if p.name != "evento.example.ics")


def _pick_ics():
    files = _ics_candidates()
    if not files:
        print()
        print("No .ics file found in the folder.")
        print("-> Create the event in Outlook, save it as .ics and put it in here.")
        print(f"   Folder: {ICS_DIR}")
        sys.exit(1)
    if len(files) == 1:
        return files[0]
    print("\nMultiple .ics files found. Which one should I use?")
    for i, f in enumerate(files, 1):
        print(f"  {i}) {f.name}")
    while True:
        s = input("Number: ").strip()
        if s.isdigit() and 1 <= int(s) <= len(files):
            return files[int(s) - 1]


def _parse_summary(ics_path):
    # Outlook on Windows often saves as UTF-16; try several encodings.
    for enc in ("utf-8-sig", "utf-16", "utf-8", "latin-1"):
        try:
            text = ics_path.read_text(encoding=enc)
        except (UnicodeDecodeError, LookupError):
            continue
        for line in text.splitlines():
            stripped = line.strip()
            if stripped.startswith("SUMMARY:"):
                return stripped[len("SUMMARY:"):].strip()
            # Outlook sometimes uses SUMMARY;LANGUAGE=xx: or SUMMARY;ENCODING=...:
            if stripped.startswith("SUMMARY;"):
                colon = stripped.find(":")
                if colon != -1:
                    return stripped[colon + 1:].strip()
    return None


def _ask(label, default=None, hidden=False):
    suffix = f" [{default[:6]}…]" if default and len(default) > 8 else (f" [{default}]" if default else "")
    while True:
        prompt = f"  {label}{suffix}: "
        val = (getpass.getpass(prompt) if hidden else input(prompt)).strip()
        if val:
            return val
        if default is not None:
            return default


def _load_config():
    if CONFIG_FILE.exists():
        try:
            return json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            pass
    return {}


def _save_config(cfg):
    CONFIG_FILE.write_text(json.dumps(cfg, indent=2, ensure_ascii=False), encoding="utf-8")
    try:
        CONFIG_FILE.chmod(0o600)
    except OSError:
        pass


def _env_azure_complete():
    """True if all three Azure credentials are provided via environment
    variables (e.g. injected by the launcher via age)."""
    return all(os.environ.get(k) for k in ("AZURE_TENANT_ID", "AZURE_CLIENT_ID", "AZURE_CLIENT_SECRET"))


def needs_setup():
    """True if something required to start is missing.
    The event keyword always has to be set. Azure credentials count as present
    if they come from the environment (age), so we don't re-ask for them."""
    cfg = _load_config()
    if not cfg.get("event_keyword"):
        return True
    if _env_azure_complete():
        return False
    if not cfg.get("tenant_id") or not cfg.get("client_id"):
        return True
    try:
        if not keyring.get_password(KEYRING_SERVICE, cfg["client_id"]):
            return True
    except Exception:
        return True
    return False


def run():
    print()
    print("=" * 60)
    print("  Event Mailer — setup")
    print("=" * 60)
    cfg = _load_config()

    env_azure = _env_azure_complete()
    total = 1 if env_azure else 3

    print(f"\n[1/{total}] Event")
    ics = _pick_ics()
    summary = _parse_summary(ics)
    if not summary:
        print(f"  Could not read SUMMARY from {ics.name}. Aborting.")
        sys.exit(1)
    print(f"  File detected: {ics.name}")
    keyword = _ask("Keyword (event title)", default=summary)
    cfg["event_keyword"] = keyword

    if env_azure:
        # Azure credentials come from the environment (age) — nothing to ask.
        print("\n  Azure credentials loaded from the environment (age). Skipping Azure setup.")
        _save_config(cfg)
        print("\nSetup complete.\n")
        return

    print("\n[2/3] Microsoft Azure (app registration)")
    cfg["tenant_id"] = _ask("Tenant ID", default=cfg.get("tenant_id"))
    cfg["client_id"] = _ask("Client ID", default=cfg.get("client_id"))

    print("\n[3/3] Client Secret (will be stored encrypted in the OS keychain)")
    existing = ""
    try:
        existing = keyring.get_password(KEYRING_SERVICE, cfg["client_id"]) or ""
    except Exception:
        existing = ""
    label = "Client Secret (press Enter to keep the existing one)" if existing else "Client Secret"
    secret = (getpass.getpass(f"  {label}: ") or "").strip()
    if not secret and not existing:
        print("  Secret required. Aborting.")
        sys.exit(1)
    if secret:
        keyring.set_password(KEYRING_SERVICE, cfg["client_id"], secret)
        print("  Saved in the OS keychain.")
    else:
        print("  Keeping the existing one.")

    _save_config(cfg)
    print("\nSetup complete.\n")


if __name__ == "__main__":
    run()
