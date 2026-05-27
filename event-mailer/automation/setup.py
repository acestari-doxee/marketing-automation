"""
Event Mailer — wizard primo avvio.

- Autorileva il file .ics nella cartella ed estrae la keyword dal campo SUMMARY.
- Chiede tenant_id, client_id, client_secret una sola volta.
- Salva config.json (no secrets) + client_secret nel sistema via 'keyring'.
"""

import getpass
import json
import sys
from pathlib import Path

import keyring

BASE_DIR  = Path(__file__).parent
ROOT_DIR  = BASE_DIR.parent
ICS_DIR   = ROOT_DIR / "ics"
CONFIG_FILE = BASE_DIR / "config.json"
KEYRING_SERVICE = "event-mailer"


def _ics_candidates():
    """File .ics presenti in ics/, escluso il template."""
    return sorted(p for p in ICS_DIR.glob("*.ics") if p.name != "evento.example.ics")


def _pick_ics():
    files = _ics_candidates()
    if not files:
        print()
        print("Nessun file .ics trovato nella cartella.")
        print("→ Crea l'evento su Outlook, salvalo come .ics e mettilo qui dentro.")
        print(f"   Cartella: {ICS_DIR}")
        sys.exit(1)
    if len(files) == 1:
        return files[0]
    print("\nTrovati piu' file .ics. Quale uso?")
    for i, f in enumerate(files, 1):
        print(f"  {i}) {f.name}")
    while True:
        s = input("Numero: ").strip()
        if s.isdigit() and 1 <= int(s) <= len(files):
            return files[int(s) - 1]


def _parse_summary(ics_path):
    # Outlook su Windows salva spesso in UTF-16; proviamo più encoding.
    for enc in ("utf-8-sig", "utf-16", "utf-8", "latin-1"):
        try:
            text = ics_path.read_text(encoding=enc)
        except (UnicodeDecodeError, LookupError):
            continue
        for line in text.splitlines():
            stripped = line.strip()
            if stripped.startswith("SUMMARY:"):
                return stripped[len("SUMMARY:"):].strip()
            # Outlook a volte usa SUMMARY;LANGUAGE=xx: oppure SUMMARY;ENCODING=...:
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


def needs_setup():
    """True se manca qualcosa per partire."""
    cfg = _load_config()
    if not cfg.get("event_keyword") or not cfg.get("tenant_id") or not cfg.get("client_id"):
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

    print("\n[1/3] Evento")
    ics = _pick_ics()
    summary = _parse_summary(ics)
    if not summary:
        print(f"  Impossibile leggere SUMMARY da {ics.name}. Aborto.")
        sys.exit(1)
    print(f"  File rilevato: {ics.name}")
    keyword = _ask("Keyword (titolo evento)", default=summary)
    cfg["event_keyword"] = keyword

    print("\n[2/3] Microsoft Azure (app registration)")
    cfg["tenant_id"] = _ask("Tenant ID", default=cfg.get("tenant_id"))
    cfg["client_id"] = _ask("Client ID", default=cfg.get("client_id"))

    print("\n[3/3] Client Secret (sara' salvato cifrato nel sistema)")
    existing = ""
    try:
        existing = keyring.get_password(KEYRING_SERVICE, cfg["client_id"]) or ""
    except Exception:
        existing = ""
    label = "Client Secret (invio per tenere quello esistente)" if existing else "Client Secret"
    secret = (getpass.getpass(f"  {label}: ") or "").strip()
    if not secret and not existing:
        print("  Secret richiesto. Aborto.")
        sys.exit(1)
    if secret:
        keyring.set_password(KEYRING_SERVICE, cfg["client_id"], secret)
        print("  Salvato nel sistema.")
    else:
        print("  Tengo quello gia' presente.")

    _save_config(cfg)
    print("\nSetup completato.\n")


if __name__ == "__main__":
    run()
