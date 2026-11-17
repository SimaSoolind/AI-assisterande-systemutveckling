# Butikens API – en säker rigg för en AI-kodagent

Ett REST-API för kunder och beställningar, där jag har byggt en **rigg** runt en AI-kodagent:
regler, kontroller och verktyg som gör att agenten arbetar säkert och likadant varje gång.

Byggt av **Sima Soolind** i kursen *AI-assisterad systemutveckling*,
som en del av min utbildning till fullstackutvecklare med säkerhetsinriktning.

---

## Innehåll
| Del | Om |
|-----|-----|
| [Vad jag har byggt](#vad-jag-har-byggt) | riggen och tre arbeten |
| [Resultat](#resultat) | vad kontrollerna hittade |
| [Teknik](#teknik) | språk och verktyg |
| [Kom igång](#kom-igång) | starta projektet |
| [Var hittar du vad?](#var-hittar-du-vad) | karta över filerna |
| [Säkerhet](#säkerhet) | hur jag arbetar säkert |

---

## Vad jag har byggt

### Problemet
När ett team börjar använda en AI-kodagent skriver alla egna instruktioner i chatten.
Då arbetar agenten olika för varje person, och ingen kan se i efterhand vad som hände.

### Min lösning: en rigg
Riggen ligger i repot, så att agenten arbetar likadant för alla.

| Del | Vad den gör |
|-----|-------------|
| **Behörigheter** | bestämmer vad agenten får göra. Den får aldrig läsa `.env` eller radera filer. |
| **5 hooks** | stoppar fel automatiskt, t.ex. om agenten försöker ta bort ett test eller skriva en nyckel i koden |
| **4 subagenter** | hjälpagenter med en uppgift var – en av dem granskar säkerheten |
| **3 skills** | färdiga arbetssätt, t.ex. `/tdd` som skriver testet först |
| **Kodstandard i verktyg** | ESLint med säkerhetsregler, TypeScript och Prettier |
| **Sessionsloggar** | visar vad som hände i varje arbetspass och varför |

### Tre arbeten där jag använde riggen
| Arbete | Vad |
|--------|-----|
| **1. Ny funktion** | en kund kan avbryta sin beställning inom 30 minuter – från user story till granskad kod, med testet först |
| **2. Granskning** | granska kod som en AI har skrivit (görs på kursens seminarium) |
| **3. Modernisering** | en gammal Python-fil som räknar pris – låst med tester, gjord säker i tre små steg |

---

## Resultat

| Vad | Resultat |
|-----|----------|
| Tester | 25 API-tester och 6 karakteriseringstester, alla gröna |
| Mutationstest | 4 tester bevisade röda när skyddet togs bort med flit |
| Säkerhetsagenten | hittade att ett för stort id fick servern att hänga – det hade lint och testerna missat |
| SQL injection | en påhittad rabattkod gav 10 % rabatt – stängd och bevisad |
| Behörigheter | agenten nekades att läsa `.env` och att radera filer |
| Sårbara paket | 3 hittade med `npm audit` – 2 lagade, 1 dokumenterat riskbeslut |

**Det viktigaste jag lärde mig:** jag kan inte lita blint på testerna.
Servern svarade 403 ("du får inte"), men hade redan ändrat beställningen.
Därför kollar mina tester både svaret och datan.

---

## Teknik

| Del | Verktyg |
|-----|---------|
| API | Node.js, TypeScript, Express |
| Databas | PostgreSQL i Docker |
| Äldre del | Python (psycopg) |
| Tester | Jest, supertest, pytest |
| Kodstandard | ESLint + eslint-plugin-security, TypeScript strict, Prettier |
| AI-agent | Claude Code med egen rigg i `.claude/` |

---

## Kom igång

**Du behöver:** Node.js 22+, Python 3.11+, Docker och git.

### 1. Installera
```bash
npm install
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

### 2. Starta databasen
```bash
npm run db:up
npm run db:reset
```

### 3. Kör testerna
```bash
npm test               # 25 API-tester
npm run test:legacy    # 6 karakteriseringstester
```

### 4. Starta API:t
```bash
npm start              # http://localhost:3000
```

### 5. Prova
```bash
curl http://localhost:3000/orders/1042 -H "X-Customer-Id: 1"
curl -X POST http://localhost:3000/orders/1042/cancel -H "X-Customer-Id: 1"
```

**Bra att veta:**
- Kör `source .venv/bin/activate` i varje ny terminal.
- Inloggningen med `X-Customer-Id` är en förenkling i övningen. I ett riktigt system används JWT.

### Kommandon
| Kommando | Gör |
|----------|-----|
| `npm test` | kör API-testerna mot testdatabasen |
| `npm run test:legacy` | kör Python-testerna |
| `npm run lint` | ESLint med säkerhetsregler och en egen regel mot SQL med `${}` |
| `npm run typecheck` | kontrollerar TypeScript |
| `npm run format:check` | kontrollerar formateringen |
| `npm run db:reset` | återställer databaserna |

---

## Var hittar du vad?

| Fil eller mapp | Innehåll |
|----------------|----------|
| `docs/mall-svar.md` | kursprojektets alla svar, med bevis |
| `docs/projektbeskrivning.md` | kraven som checklista – vad som är klart |
| `docs/arbete-1/` | Arbete 1: user story, research, granskning, verifiering |
| `docs/plan.md` | planen för Arbete 1 |
| `docs/adr/` | mina beslut (ADR) |
| `docs/analys-price-calc.md`, `docs/codemap.md`, `docs/migreringsplan.md` | Arbete 3 |
| `Projektens-resa/` | min resa steg för steg |
| `Projektens-resa/08-vad-jag-har-lart-mig.md` | alla mina lärdomar |
| `sessions/` | sessionsloggar |
| `.claude/` | riggen: behörigheter, hooks, subagenter, skills |

### Kodens struktur
```
src/
  routes/                  endpoints
  services/                affärslogik
  pricing/legacyPrice.ts   brygga till den äldre prisberäkningen
  legacy/price_calc.py     den äldre prisberäkningen
jobs/nightly_report.py     nattlig rapport som också använder price_calc
db/                        schema och testdata
tests/                     tester
```

---

## Säkerhet

Jag bygger säkert från första raden.

| Regel | Hur |
|-------|-----|
| Säker SQL | värdet skickas alltid separat: `$1` i Node, `%s` i Python |
| Kontrollera indata | felaktigt id ger 400 |
| Bara egen data | en kund kan bara ändra sin egen beställning (403) |
| Inga hemligheter i koden | `.env` finns i `.gitignore`, och agenten får inte läsa den |
| Granskning i lager | gratis verktyg först, dyr AI-granskning sist |

**Testdatan är påhittad.** Det finns inga riktiga kunduppgifter i repot.

---

## Om projektet
- **Kodbas:** kursens övningsprojekt. Riggen, Arbete 1, Arbete 3 och dokumentationen är mitt arbete.
- **Arbetssätt:** AI genererar, jag granskar block för block och beslutar.
