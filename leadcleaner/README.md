# LeadCleaner

Web app interna Doxee per arricchire file XLSX di lead via Apollo.io API e calcolare uno score di qualità.

---

## Quick start

```bash
# Mac: doppio click su start.command
# Oppure da terminale:
cd leadcleaner
cp .env.example .env      # poi aggiungi APOLLO_API_KEY
npm install
node server.js            # → http://localhost:3000
```

---

## Flusso

1. Carica un file XLSX con i lead (colonne: email, first name, last name)
2. L'app mappa automaticamente le intestazioni (IT / EN / DE)
3. Clicca **Enrich** — il backend chiama Apollo `/people/match` per ogni lead
4. I campi arricchiti (Job Title, Industry, Company Size) vengono aggiunti in tabella
5. Ogni lead riceve uno **score** calcolato lato server
6. Esporta il risultato in XLSX

---

## Scoring

| Condizione | Punti |
|-----------|-------|
| Job title in lista target (C-level, IT leadership) | +5 |
| Job title negativo (Student, HR) | -15 |
| Industry in lista target (Banking, Telco, IT Services…) | +10 |
| Company size ≥ 500 dipendenti | +5 |

Range: -15 → +25. Le liste sono in `src/services/scoring.js`.

---

## Struttura

```
leadcleaner/
├── server.js                  # Entry point
├── package.json
├── .env.example               # Template variabili d'ambiente
├── start.command              # Launcher Mac (doppio click)
├── usage.json                 # Contatore chiamate (gitignored, auto-creato)
├── src/
│   ├── routes/
│   │   ├── enrich.js          # POST /api/enrich
│   │   └── usage.js           # GET /api/usage
│   └── services/
│       ├── apollo.js          # Client Apollo.io
│       ├── scoring.js         # Logica scoring lead
│       └── usage-tracker.js   # Tracking chiamate mensili
├── public/
│   └── index.html             # SPA (HTML + CSS + JS)
└── test/
    ├── test-apollo.xlsx        # File XLSX di test
    └── prova_apollo1.json      # Risposta Apollo di esempio
```

---

## Variabili d'ambiente

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `APOLLO_API_KEY` | — | **Obbligatoria.** Chiave API Apollo.io |
| `APOLLO_MONTHLY_LIMIT` | `30020` | Limite crediti mensili del piano |
| `PORT` | `3000` | Porta del server |

---

## API

### `GET /api/usage`

Restituisce le chiamate fatte via questa app nel mese corrente. Il contatore si azzera automaticamente a inizio mese.

```json
{
  "month": "2026-05",
  "calls_used": 11
}
```

### `POST /api/enrich`

Arricchisce un singolo lead via Apollo `/people/match`.

```json
// Request
{ "email": "mario.rossi@example.com", "first_name": "Mario", "last_name": "Rossi" }

// Response 200
{
  "job_title": "IT Manager",
  "company": "Acme SpA",
  "company_size": 850,
  "industry": "IT Services",
  "country": "Italy",
  "score": 20,
  "calls_used": 12
}

// Response 200 — nessun match (credito consumato ugualmente)
{ "job_title": null, "company": null, "company_size": null, "industry": null, "country": null, "score": 0, "calls_used": 12 }

// Response 429 — quota esaurita
{ "error": "Apollo monthly quota exhausted.", "calls_used": 30020 }
```

---

## Nota sui crediti Apollo

Apollo non espone il bilancio crediti mensili via API pubblica. Il contatore in `usage.json` traccia le chiamate fatte **tramite questa app**. Se usi Apollo anche da altri strumenti (UI, altri client), il totale reale nel dashboard Apollo sarà più alto. Controlla periodicamente su [developer.apollo.io → Usage](https://developer.apollo.io/).

---

## Limiti di Apollo Free / Basic

| Piano | Crediti/mese |
|-------|--------------|
| Free  | 50           |
| Basic | 30.020       |

Il limite attivo si configura in `.env` → `APOLLO_MONTHLY_LIMIT`.

---

## Troubleshooting

**Porta 3000 già in uso**
```bash
lsof -ti :3000 | xargs kill -9
```

**Il server si avvia ma Apollo restituisce 401**
Verifica che `APOLLO_API_KEY` in `.env` sia corretta e non scaduta.

**I campi arricchiti sono tutti null**
Apollo non ha trovato un match. Il credito viene consumato ugualmente. Prova con email + nome completo invece di solo email.

**Il contatore nell'header non corrisponde al dashboard Apollo**
Apollo non espone il bilancio via API. Il contatore locale traccia solo le chiamate fatte via LeadCleaner. È normale se hai usato Apollo anche da altri strumenti.
