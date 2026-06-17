"""
Microsoft Graph client — Event Mailer.

Auth: OAuth2 device code flow con confidential client.
client_secret cifrato nel macOS Keychain (libreria 'keyring').
Token (access + refresh) cachato in .token_cache.json (chmod 600).
"""

import base64
import json
import os
import pathlib
import subprocess
import sys
import time
import webbrowser
from datetime import datetime, timezone

import keyring
import requests

# ── Costanti ──────────────────────────────────────────────────────────────────

GRAPH  = "https://graph.microsoft.com/v1.0"
SCOPES = " ".join([
    "https://graph.microsoft.com/Calendars.ReadWrite",
    "https://graph.microsoft.com/Mail.Read",
    "https://graph.microsoft.com/Mail.Send",
    "https://graph.microsoft.com/User.Read",
    "offline_access",
])

BASE_DIR        = pathlib.Path(__file__).parent
ROOT_DIR        = BASE_DIR.parent
CONFIG_FILE     = BASE_DIR / "config.json"
CACHE_FILE      = ROOT_DIR / ".token_cache.json"
KEYRING_SERVICE = "event-mailer"

STATUS_MAP = {
    "none":                "Pending",
    "notResponded":        "Pending",
    "accepted":            "Accepted",
    "tentativelyAccepted": "Tentative",
    "declined":            "Declined",
    "organizer":           "Accepted",
}

# Mapping per le eventMessageResponse lette dalla inbox.
# Exchange non processa automaticamente le reply da domini custom (Gmail,
# provider esterni): questo bypassa il problema.
_INBOX_REPLY_MAP = {
    "meetingAccepted":            "Accepted",
    "meetingDeclined":            "Declined",
    "meetingTentativelyAccepted": "Tentative",
}


# ── Eccezioni ─────────────────────────────────────────────────────────────────

class GraphError(Exception):
    pass

class NotFoundError(GraphError):
    pass

class DuplicateError(GraphError):
    pass

class AuthError(GraphError):
    pass


# ── Config / cache / clipboard helpers ────────────────────────────────────────

def _cfg():
    """Config from config.json, overlaid with AZURE_* environment variables.
    Env vars win, so secrets injected by the launcher (age) take precedence
    over anything stored locally by the setup wizard."""
    try:
        cfg = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    except Exception:
        cfg = {}
    env_tenant = os.environ.get("AZURE_TENANT_ID")
    env_client = os.environ.get("AZURE_CLIENT_ID")
    if env_tenant:
        cfg["tenant_id"] = env_tenant
    if env_client:
        cfg["client_id"] = env_client
    return cfg


def _write_cfg(cfg):
    CONFIG_FILE.write_text(json.dumps(cfg, indent=2, ensure_ascii=False), encoding="utf-8")


def _authority():
    return f"https://login.microsoftonline.com/{_cfg().get('tenant_id', 'organizations')}"


def _creds():
    """Return (client_id, client_secret).
    The secret comes from AZURE_CLIENT_SECRET (env, injected by the launcher via
    age) when set; otherwise it falls back to the OS keychain via keyring."""
    cfg = _cfg()
    client_id = cfg.get("client_id", "")
    secret = os.environ.get("AZURE_CLIENT_SECRET", "")
    if not secret and client_id:
        try:
            secret = keyring.get_password(KEYRING_SERVICE, client_id) or ""
        except Exception:
            secret = ""
    return client_id, secret


def _load_cache():
    try:
        return json.loads(CACHE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save_cache(data):
    CACHE_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")
    try:
        CACHE_FILE.chmod(0o600)
    except OSError:
        pass


def _copy_to_clipboard(text):
    """Best-effort: pbcopy on macOS, clip on Windows, xclip on Linux. Errors ignored."""
    try:
        if sys.platform == "darwin":
            subprocess.run(["pbcopy"], input=text.encode(), check=False, timeout=2)
        elif sys.platform == "win32":
            # clip.exe expects UTF-16 LE, not UTF-8.
            subprocess.run(["clip"], input=text.encode("utf-16-le"),
                           check=False, timeout=2)
        elif sys.platform.startswith("linux"):
            subprocess.run(["xclip", "-selection", "clipboard"],
                           input=text.encode(), check=False, timeout=2)
    except Exception:
        pass


# ── Auth ──────────────────────────────────────────────────────────────────────

def _token_from_response(data):
    if "access_token" not in data:
        raise AuthError(data.get("error_description") or data.get("error") or str(data))
    _save_cache({
        "access_token":  data["access_token"],
        "refresh_token": data.get("refresh_token", ""),
        "expires_at":    time.time() + int(data.get("expires_in", 3600)) - 60,
    })
    return data["access_token"]


def _refresh(refresh_token):
    client_id, client_secret = _creds()
    r = requests.post(f"{_authority()}/oauth2/v2.0/token", data={
        "client_id":     client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type":    "refresh_token",
        "scope":         SCOPES,
    }, timeout=20)
    return _token_from_response(r.json())


def _device_flow():
    client_id, client_secret = _creds()
    if not client_id or not client_secret:
        raise AuthError("Credenziali Azure mancanti. Rilancia start.command per il setup.")

    r = requests.post(f"{_authority()}/oauth2/v2.0/devicecode", data={
        "client_id": client_id,
        "scope":     SCOPES,
    }, timeout=15)
    dc = r.json()
    if "user_code" not in dc:
        raise AuthError(dc.get("error_description") or dc.get("error") or str(dc))

    code = dc["user_code"]
    url  = dc.get("verification_uri", "https://login.microsoftonline.com/common/oauth2/deviceauth")

    _copy_to_clipboard(code)
    try:
        webbrowser.open(url)
    except Exception:
        pass

    print()
    print("=" * 60)
    print(f"  Codice:  {code}   (gia' copiato negli appunti)")
    print(f"  Pagina:  {url}")
    print("=" * 60)
    print("  Ho aperto la pagina nel browser. Incolla il codice e conferma.")
    print("  Resto in attesa qui sotto...")
    print()

    interval = int(dc.get("interval", 5))
    deadline = time.time() + int(dc.get("expires_in", 900))

    while time.time() < deadline:
        time.sleep(interval)
        resp = requests.post(f"{_authority()}/oauth2/v2.0/token", data={
            "client_id":     client_id,
            "client_secret": client_secret,
            "device_code":   dc["device_code"],
            "grant_type":    "urn:ietf:params:oauth:grant-type:device_code",
        }, timeout=15).json()

        if "access_token" in resp:
            print("  Login confermato.\n")
            return _token_from_response(resp)

        err = resp.get("error", "")
        if err == "authorization_pending":
            continue
        if err == "slow_down":
            interval += 5
            continue
        if err == "expired_token":
            raise AuthError("Codice scaduto. Rilancia start.command e riprova.")
        if err == "access_denied":
            raise AuthError("Accesso negato dall'utente.")
        raise AuthError(resp.get("error_description") or err or str(resp))

    raise AuthError("Timeout: il codice e' scaduto senza conferma.")


def _ensure_token():
    """Access token valido. Refresh silenzioso; device flow solo al primo run."""
    cache = _load_cache()

    if cache.get("access_token") and cache.get("expires_at", 0) > time.time():
        return cache["access_token"]

    if cache.get("refresh_token"):
        try:
            return _refresh(cache["refresh_token"])
        except Exception:
            pass  # refresh scaduto → fallback al device flow

    return _device_flow()


def _h():
    return {"Authorization": f"Bearer {_ensure_token()}"}


# ── Parsing evento ────────────────────────────────────────────────────────────

def _parse(e):
    return {
        "id":        e["id"],
        "subject":   e.get("subject", ""),
        "start_iso": (e.get("start") or {}).get("dateTime", ""),
        "attendees": [
            {
                "name":   (a.get("emailAddress") or {}).get("name") or
                          (a.get("emailAddress") or {}).get("address", ""),
                "email":  (a.get("emailAddress") or {}).get("address", ""),
                "status": STATUS_MAP.get(
                    (a.get("status") or {}).get("response", "none"), "Pending"),
                "source": "exchange",
            }
            for a in e.get("attendees", [])
            if (a.get("emailAddress") or {}).get("address")
        ],
    }


# ── Inbox reply merge (fix domini esterni) ────────────────────────────────────

def _inbox_replies(keyword, top=200):
    """
    Legge eventMessageResponse dalla inbox dell'organizzatore e ritorna
    {email_lower: status}. Prende la risposta piu' recente per indirizzo.
    Fallisce silenziosamente per non bloccare il flusso principale.
    """
    try:
        r = requests.get(f"{GRAPH}/me/messages", headers=_h(), params={
            "$filter":  "isof('microsoft.graph.eventMessageResponse')",
            "$top":     str(top),
            "$orderby": "receivedDateTime desc",
        }, timeout=20)
        if not r.ok:
            return {}
        kw  = keyword.lower()
        out = {}
        for msg in r.json().get("value", []):
            if kw not in msg.get("subject", "").lower():
                continue
            email  = ((msg.get("from") or {}).get("emailAddress") or {}).get("address", "").lower()
            status = _INBOX_REPLY_MAP.get(msg.get("meetingMessageType", ""))
            if email and status and email not in out:
                out[email] = status
        return out
    except Exception:
        return {}


def _merge_inbox(keyword, parsed):
    """Sovrascrive gli status Exchange con le reply dalla inbox."""
    replies = _inbox_replies(keyword)
    for a in parsed["attendees"]:
        s = replies.get(a["email"].lower())
        if s:
            a["status"] = s
    return parsed


# ── API pubblica ──────────────────────────────────────────────────────────────

def get_event(keyword, cached_id=None):
    h = _h()

    if cached_id:
        r = requests.get(f"{GRAPH}/me/events/{cached_id}", headers=h, timeout=15)
        if r.status_code == 200:
            return _merge_inbox(keyword, _parse(r.json()))

    safe = keyword.replace("'", "''")
    r = requests.get(f"{GRAPH}/me/events", headers=h, params={
        "$filter":  f"contains(subject,'{safe}')",
        "$top":     "50",
        "$orderby": "start/dateTime",
    }, timeout=20)
    r.raise_for_status()
    events = r.json().get("value", [])
    if not events:
        raise NotFoundError(keyword)

    now      = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
    upcoming = [e for e in events if (e.get("start") or {}).get("dateTime", "") >= now]
    chosen   = upcoming[0] if upcoming else events[-1]
    parsed   = _parse(chosen)

    cfg = _cfg()
    if cfg.get("event_id") != parsed["id"]:
        cfg["event_id"] = parsed["id"]
        _write_cfg(cfg)

    return _merge_inbox(keyword, parsed)


def _fmt_ical_dt(iso_str):
    """'2026-05-15T10:00:00.0000000' → '20260515T100000'"""
    return iso_str.split(".")[0].replace("-", "").replace(":", "")


def _send_ical_invite(ev, attendee_name, attendee_email):
    """
    Invia un invito iCalendar via sendMail con METHOD:REQUEST.
    Client esterni (Gmail, Apple Mail, Outlook mobile) mostrano i bottoni
    Accept / Tentative / Decline. Le reply tornano nella inbox e vengono
    lette da _inbox_replies().
    """
    subject  = ev.get("subject", "Evento")
    start_dt = (ev.get("start") or {}).get("dateTime", "")
    end_dt   = (ev.get("end")   or {}).get("dateTime", "")
    tz       = (ev.get("start") or {}).get("timeZone", "UTC")
    org_addr = ((ev.get("organizer") or {}).get("emailAddress") or {}).get("address", "")
    org_name = ((ev.get("organizer") or {}).get("emailAddress") or {}).get("name", "Event Mailer")
    uid      = ev.get("iCalUId") or ev.get("id", "")

    ics = (
        "BEGIN:VCALENDAR\r\n"
        "VERSION:2.0\r\n"
        "PRODID:-//Event Mailer//EN\r\n"
        "METHOD:REQUEST\r\n"
        "BEGIN:VEVENT\r\n"
        f"UID:{uid}\r\n"
        f"SUMMARY:{subject}\r\n"
        f"DTSTART;TZID={tz}:{_fmt_ical_dt(start_dt)}\r\n"
        f"DTEND;TZID={tz}:{_fmt_ical_dt(end_dt)}\r\n"
        f"ORGANIZER;CN={org_name}:mailto:{org_addr}\r\n"
        f"ATTENDEE;CN={attendee_name};ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:{attendee_email}\r\n"
        "STATUS:CONFIRMED\r\n"
        "SEQUENCE:0\r\n"
        "END:VEVENT\r\n"
        "END:VCALENDAR\r\n"
    )

    ev_body     = ev.get("body") or {}
    body_type   = ev_body.get("contentType", "text")
    body_content = ev_body.get("content", "")

    payload = {
        "message": {
            "subject": f"Invito: {subject}",
            "body": {
                "contentType": body_type,
                "content":     body_content,
            },
            "toRecipients": [{"emailAddress": {"address": attendee_email, "name": attendee_name}}],
            "attachments": [{
                "@odata.type":  "#microsoft.graph.fileAttachment",
                "name":         "invite.ics",
                "contentType":  "text/calendar; method=REQUEST",
                "contentBytes": base64.b64encode(ics.encode()).decode(),
            }],
        },
        "saveToSentItems": True,
    }

    h = {**_h(), "Content-Type": "application/json"}
    r = requests.post(f"{GRAPH}/me/sendMail", headers=h, json=payload, timeout=30)
    if r.status_code >= 400:
        raise GraphError(f"sendMail fallito ({r.status_code}): {r.text}")


def add_attendee(event_id, name, email):
    h = {**_h(), "Content-Type": "application/json"}

    # Fetch completo: servono start/end/organizer/iCalUId per costruire l'invite.
    cur = requests.get(f"{GRAPH}/me/events/{event_id}", headers=h,
                       params={"$select": "attendees,subject,start,end,organizer,iCalUId,body"},
                       timeout=15)
    if cur.status_code == 404:
        raise NotFoundError(event_id)
    cur.raise_for_status()
    ev       = cur.json()
    existing = ev.get("attendees", [])

    if any((a.get("emailAddress") or {}).get("address", "").lower() == email.lower()
           for a in existing):
        raise DuplicateError(email)

    # sendUpdates=always: Exchange invia lui l'invito al nuovo partecipante.
    # _send_ical_invite rimossa: su questo tenant sendUpdates=none veniva ignorato
    # e causava una email doppia. Exchange genera già un iCal METHOD:REQUEST
    # compatibile con Gmail e qualsiasi client.
    r = requests.patch(f"{GRAPH}/me/events/{event_id}", headers=h,
                       params={"sendUpdates": "always"},
                       json={"attendees": existing + [{
                           "emailAddress": {"address": email, "name": name},
                           "type": "required",
                       }]}, timeout=30)
    if r.status_code >= 400:
        raise GraphError(f"PATCH fallito ({r.status_code}): {r.text}")
