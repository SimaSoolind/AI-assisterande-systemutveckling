# Steg 4: Bygga med säkerhet
**Regler – så här gör jag:** Jag bygger ett litet steg i taget. Jag följer kodstandarden.
Jag kontrollerar all indata. Jag lägger aldrig hemligheter i koden.

## Översikt

| Del | Vad | När |
|-----|-----|-----|
| A | Riggen: behörigheter, skills, subagenter, hooks, ESLint | 15–17 nov |
| B | Arbete 1: avbryta en beställning | 17 nov |
| C | Arbete 3: modernisera price_calc.py | 17 nov |
| D | Problem jag löste | 16–17 nov |
| E | Säkerhet och lärdomar (längst ner i filen) | hela arbetet, 15–17 nov |

---

# Del A: Riggen

Riggen är allt som styr agenten.
Den ligger i repot, så att den fungerar likadant för alla.

## A1. Behörigheter
**Commit:** `eed4d99` · 15 nov

| Lista | Vad | Varför |
|-------|-----|--------|
| allow | `npm test`, `npm run lint`, `git status`, `git diff` | bara läsa och kontrollera |
| ask | `git commit`, `git push`, `npm install` | agenten frågar mig först |
| deny | läsa `.env`, `rm -rf`, `git push --force` | aldrig |

Filen: `.claude/settings.json`

## A2. Skills
**Commit:** `f251c00`, `916ac69` · 16 nov

| Skill | Gör |
|-------|-----|
| `/tdd` | ett steg ur docs/plan.md, test först, väntar på min granskning |
| `/logg` | utkast till sessionslogg |
| `/codemap` | karta över koden |

## A3. Subagenter
**Commit:** `916ac69` · 16 nov

| Agent | Modell | Använd |
|-------|--------|--------|
| utforskare | haiku | 17 nov – hittade var status läses och skrivs. Visade att `paid` och `shipped` sätts utanför koden (se C8) |
| granskare | sonnet | 17 nov – granskade Arbete 1 mot planen (se 06-validera.md) |
| testskrivare | sonnet | inte än – testerna i Arbete 1 skrevs av `/tdd` |
| sakerhetsgranskare | opus | 17 nov – säkerhetsgranskade Arbete 1 och hittade fynd S2 |

- Granskarna får bara läsa (Read, Grep, Glob).
- `maxTurns: 10` stoppar en agent som fastnar.

## A4. Fem hooks
**Commit:** `02bf10b` till `5ab649d` · 16 nov

| Hook | När | Gör |
|------|-----|-----|
| `skydda-tester` | före en ändring | stoppar om ett test tas bort eller får `.skip` (exit 2) |
| `stoppa-hemligheter` | före en ändring | stoppar ändring i `.env` och nycklar i koden |
| `format-och-kontroll` | efter en ändring | kör prettier, tsc och eslint |
| `las-logg` | när en session startar | läser senaste loggen (minneskedjan, del 1) |
| `skriv-logg` | när en session slutar | skriver utkast till nästa logg (minneskedjan, del 2) |

**Hur jag testade:** varje hook med egen indata.
`echo '{...}' | node .claude/hooks/x.mjs; echo $?`

## A5. ESLint med säkerhetsregler
**Commit:** `d7fffeb` · 17 nov

**Varför:** SAL säger att ett fel som hittas tidigt är billigast att rätta (shift-left).

**Vad jag gjorde:**
- `npm install -D eslint-plugin-security` – gratis paket (SAST, SAL F4).
- `-D` betyder: bara för utveckling.
- En egen regel ur docs/standard.md: SQL byggs aldrig med `${}`.

**Felmeddelandet säger hur felet rättas:**
"Använd $1 och skicka värdet i en lista: db.query(sql, [värde])."

**Hur jag testade:**
| Kod i en tillfällig fil | Resultat |
|-------------------------|----------|
| SQL med `${id}` | error |
| SQL med `$1` | inget fel |

Filen raderades efteråt.

**Resultat:**
- `npm run lint`: 0 fel, 2 varningar.
- Varningarna gäller `readFileSync` i tests/helpers/db.ts – testkod, ofarligt.
- Min regel: nya varningar får vara varningar först.
- Hooken `format-och-kontroll` kör eslint efter varje ändring. Regeln stoppar agenten direkt.

**Varför billigare:**
- Paketet kör på millisekunder och kostar 0 kr.
- Opus-agenten kostar tokens.
- Därför: gratis kontroller först, dyr AI-granskning sist.

---

# Del B: Arbete 1 – Avbryta en beställning

## B1. Krav, research och plan
**Commit:** `1b4b537`

| Vad | Var |
|-----|-----|
| User story 2: avbryta inom 30 minuter | docs/arbete-1/1-user-story.md |
| 8 acceptanskriterier (200, 400, 401, 403, 404, 409) | samma fil |
| Research: vad som redan fanns | docs/arbete-1/2-research.md |
| Plan med 6 steg, Klart när och Utanför | docs/plan.md |

**Det som redan fanns:**
| Kod | Ger |
|-----|-----|
| `requireCustomer` | 401 |
| `parseId` | 400 |
| `getOrder` | 403 och 404 |
| felkoden `conflict` | 409 |

## B2. Steg 1: avbryta inom 30 minuter
**Commit:** `8cad505`

| | |
|---|---|
| **Test först** | `/tdd Steg 1` skrev testet. Rött: 404, routen fanns inte. |
| **Koden** | route `POST /orders/:id/cancel` och `cancelOrder` |
| **Resultat** | grönt: 17 av 17 |
| **Min granskning** | block för block: middleware → parseId → getOrder → UPDATE med `$1` |

## B3. Steg 2: efter 30 minuter → 409
**Commit:** `8441a43`

| | |
|---|---|
| **Test först** | skapar en beställning, flyttar `created_at` 31 minuter bakåt, väntar 409, kollar att status är kvar `new`. Rött. |
| **Koden** | `created_at > now() - interval '30 minutes'` i samma `UPDATE` |
| **Hur 409 blir** | `rowCount === 0` → ingen rad ändrades → `conflict` → 409 |
| **Resultat** | grönt: 18 av 18. Lint, typer och format: 0 fel. |

**Valde bort för testet:**
| Alternativ | Varför inte |
|------------|-------------|
| Beställning 1042 | status `paid` – fel orsak till 409 |
| Låtsasklocka i Jest | tiden räknas i databasen, inte i Node |
| Vänta 31 minuter | för långsamt |

**Valde bort för 30-minutersregeln:**
| Alternativ | Varför inte |
|------------|-------------|
| Jämföra i Node med `Date.now()` | två klockor, och race condition |
| Databasregel (trigger eller CHECK) | kräver migrering, och planen säger inga tabelländringar |

**Ord att kunna – race condition:**
Två anrop samtidigt klarar båda en kontroll innan någon hinner skriva.
I samma `UPDATE` gör databasen kontroll och ändring i ett steg.

## B4. Steg 3: redan avbruten eller skickad → 409
**Commit:** `460a9df` (och `013973f` bockar av planen)

| | |
|---|---|
| **Test först** | körs två gånger: `it.each(["cancelled", "shipped"])` |
| **Koden** | `AND status = 'new'` i samma `UPDATE` |
| **Resultat** | grönt: 20 av 20 |
| **Avvägning** | samma meddelande för två orsaker. Säkerheten går före ett eget meddelande per orsak. |

**Om commit-namnet:**
- `460a9df` heter "Steg 2" men innehåller steg 3.
- Agenten hade redan committat steg 2 (`8441a43`).
- Commiten var pushad, så jag skrev inte om historiken. `git push --force` är förbjudet i min rigg.
- Lärdom: kolla `git log` innan jag committar.

## B5. Steg 4 och 5: felfallen
Alla fyra tester blev gröna direkt, för koden fanns redan.
Därför bevisade jag dem: jag tog bort skyddet en kort stund och såg testet bli rött (mutationstest, se 05-testa.md).

| Fall | Svar | Skydd | Utan skyddet | Commit |
|------|------|-------|--------------|--------|
| Någon annans beställning | 403 | `getOrder` | status blev `cancelled` – rött | `a44ec65` |
| Finns inte (9999) | 404 | `getOrder` | 409 i stället för 404 – rött | `20550a3` |
| Inte inloggad | 401 | `requireCustomer` | TypeScript stoppade koden | `e442a28` |
| id är "banan" | 400 | `parseId` | anropet hängde | `4ffe276` |

**Lärdom från 404:**
Kolla att raden finns före `UPDATE`.
`rowCount === 0` kan betyda tre saker: finns inte, fel status, för sent.

**Två vakter för inloggning (granskning i lager):**
| Vakt | Larmar när | Verktyg |
|------|------------|---------|
| TypeScript | koden skrivs | typecheck + hooken format-och-kontroll |
| 401-testet | koden körs | npm test |

TypeScript kollar att koden **ser rätt ut**.
Testet kollar att den **gör rätt**.

**Valde bort zod för id:** bara ett id ska valideras, och `parseId` används redan i två routes.

---

# Del C: Arbete 3 – Modernisera price_calc.py

**Regeln:** förstå först → lås fast beteendet med tester → ändra i små steg.

## C1. Analys
**Commit:** `748e015` · **Fil:** docs/analys-price-calc.md

| Fynd | Vad |
|------|-----|
| Två vägar in | API:t (`src/pricing/legacyPrice.ts`) och nattrapporten (`jobs/nightly_report.py`) |
| Sidoeffekter | öppnar databasen när filen laddas, skriver fel tyst till en loggfil |
| O1 | en utgången rabatt dras ändå av (order 1045) |
| O2 | momsen kapas i stället för att avrundas (order 1044) |
| O3 | en beställning utan rader får pris 0 (order 1043) |
| Säkerhet | SQL injection på rad 42 – rabattkoden byggs in med `%` |

## C2. Codemap
**Commit:** `b6a0af6` · **Fil:** docs/codemap.md

En rad per fil: vad den gör och vad den anropar.

| | Väg 1: API | Väg 2: nattrapporten |
|---|------------|----------------------|
| Var | `src/pricing/legacyPrice.ts:7` | `jobs/nightly_report.py:4` |
| Hur | startar Python som egen process | `from price_calc import calc_price, conn` |
| Behörighet | `requireCustomer` + `getOrder` | ingen (körs av cron) |

**Följd:** rör inte namnen `calc_price` och `conn`.
Då går nattrapporten sönder, och testerna märker det inte.

## C3. Körning: vad koden svarar i dag
**Commit:** `748e015`

- `npm run db:reset`, sedan `python3 src/legacy/price_calc.py` för order 1040–1047.
- Tabellen står i analysfilen, avsnitt 7.
- Det blev **inte** facit: 1044 och 1045 har buggar. Det är vad koden gör i dag.

## C4. Fem karakteriseringstester
**Commit:** `d625203` · **Fil:** tests/test_price_calc.py

| Order | Låser fast |
|-------|------------|
| 1042 | grundfallet och formen `"1187.5"` |
| 1043 | O3 |
| 1044 | O2 |
| 1045 | O1 |
| 1041 | en giltig rabatt |

- Alla gröna mot den **orörda** filen.
- Test 1 använder `str(...)`, för `Decimal("1187.5") == Decimal("1187.50")` är sant.
- `tests/conftest.py` sätter testdatabasen före importen, som `env.ts` för Jest.
- Agenten försökte läsa `.env` och nekades – deny-regeln fungerade (SAL F3).
- Lösenordet `postgres` i conftest är den lokala testdatabasens. Riktiga hemligheter ligger i `.env`.

**Kom ihåg:** Jest och pytest delar testdatabasen. Kör dem efter varandra.

## C5. Refaktoreringssteg 1: tydliga namn
**Commit:** `b2f37ec`

| Förut | Nu |
|-------|-----|
| `x` | `belopp` |
| `rad` | `orderrad` |
| `kod` | `rabattkod` |
| `q, p` | `antal, styckpris` |
| `r` | `rabattrad` |
| `f` | `loggfil` |

- Rörde inte `calc_price`, `conn`, `Pris` och `.net/.vat/.total`.
- Svenska namn, för filen är redan på svenska.
- **Resultat:** 5 + 25 tester gröna, nattrapporten samma svar.

**Varför ett säkert steg?** Ett namnbyte ändrar inte vad koden gör.

**Valde bort:** skriva om Python till TypeScript nu.
Nattrapporten importerar Python-filen, och kursen kräver små steg.
Planen (strangler fig) står i mall-svar.md.

## C6. Refaktoreringssteg 2: rabatten i en egen funktion
**Commit:** `63ee45a`

- Ny funktion `_dra_av_rabatt(cur, rabattkod, summa)`.
- I `calc_price` står en rad i stället för fem.
- `_` först betyder "intern" i Python.
- Kommentaren `OBS giltighetsdatumet kontrolleras inte (O1)`.
- **Resultat:** 5 + 25 tester gröna, nattrapporten ger 689.56 kr som förut.

**Varför rättas inte O1 nu?**
Refaktorering ändrar hur koden ser ut, inte vad den gör.
Att rätta O1 kräver ett beslut och en ADR.

## C7. Refaktoreringssteg 3: säker SQL
**Commit:** `22a05e4`

| Förut | Nu |
|-------|-----|
| `'%s'" % värde` – värdet byggs in i texten | `"%s", (värde,)` – värdet skickas separat |

Samma regel som `$1` i Node (SAL F4, fråga 5a).

**Bevis med en elak rabattkod** `FINNS_INTE' OR '1'='1`:
| Kod | Resultat |
|-----|----------|
| gamla frågan | fick 10 % rabatt – SQL injection |
| nya frågan | ingen rabatt |
| nya frågan med `VAR10` | 100 → 90, fungerar fortfarande |

- `(rabattkod,)` – kommatecknet gör det till en tupel.
- **Resultat:** 5 + 25 tester gröna, nattrapporten samma svar.
- **Kvar:** `jobs/nightly_report.py:8` har samma mönster. Mindre risk – datumet kommer inte från en kund.

## C8. Migreringsplan
**Commit:** `97d51d0` · **Fil:** docs/migreringsplan.md

**Problemet:** databasen tillåter vilken status som helst.
Ett stavfel som `'canceled'` sparas tyst, och då hittas raden inte.

**Lösningen:** en CHECK-regel – bara `new`, `paid`, `shipped`, `cancelled`.

| Steg | Gör | Går att backa? |
|------|-----|----------------|
| 1 Expand | regeln med `NOT VALID` – gäller nya rader | ✅ |
| 2 Verifiera | leta efter gamla rader med okänd status | ✅ |
| 3 Rätta gamla rader | kopia + `UPDATE` | ⚠️ bara med kopian, efter att regeln tagits bort |
| 4 Contract | `VALIDATE CONSTRAINT` – gäller alla rader | ✅ |
| 5 Städa | regeln in i schema.sql, kopian bort | ❌ kopian |

**Provkörning** i testdatabasen med `BEGIN … ROLLBACK`:
- 0 rader med okänd status.
- `VALIDATE` gav `true`.
- Stavfelet `'canceled'` stoppades.
- Allt ångrades.

**Provkörningen hittade ett fel i planen:**
Att backa steg 3 gick inte, för regeln vägrade släppa in det gamla värdet.
Rättat: först ta bort regeln, sedan återställa från kopian.

**Varför stegvis?** Finns en enda felaktig rad misslyckas en vanlig CHECK, och tabellen kan låsas länge.

**Bekräftat av agenten utforskare (17 nov):**
| Status | Skrivs av | Läses av |
|--------|-----------|----------|
| `new` | databasen (DEFAULT) | `cancelOrder` |
| `cancelled` | `cancelOrder` | bara tester |
| `paid` | ingen kod – sätts utifrån | nattrapporten |
| `shipped` | ingen kod – sätts utifrån | bara tester |

`paid` och `shipped` skrivs utanför koden. Där kan stavfel uppstå, och TypeScript kan inte stoppa dem.
Därför ska regeln ligga i databasen. Stavningen `'canceled'` finns ingenstans i koden i dag.

## Arbete 3 är klart ✅
Codemap, 5 karakteriseringstester, tre refaktoreringssteg med grönt efter varje, och en migreringsplan.

---

# Del D: Problem jag löste

| # | Problem | Orsak | Lösning |
|---|---------|-------|---------|
| 1 | Hooken kraschade på `null` | `JSON.parse("null")` ger inget objekt | try/catch och `if (anrop === null)` (`5ab649d`) |
| 2 | `.env.local` stoppades inte | `endsWith(".env")` fångar bara exakt `.env` | stoppa alla `.env` och `.env.*`, utom `.env.example` |
| 3 | Testerna fick fel databas | Skär använder också port 5433 | `docker stop hotell-solsidan-db` och `npm run db:up` |
| 4 | Pristestet var rött | `.venv` inte aktiverad | `source .venv/bin/activate` |
| 5 | Mallen kom med i Git | `git add .` tar med allt | `git rm --cached` + `.gitignore` (`9a60e1e`). Skriv filnamnen i `git add`. |
| 6 | psycopg saknades, sedan fel port | `.venv` inte aktiverad, och utan `.env` används reservadressen | `source .venv/bin/activate` och `set -a; source .env; set +a` |

---

# Del E: Säkerhet och lärdomar

## Säkerhet i det jag byggde (SAL)
| Fråga | Hur |
|-------|-----|
| 5a SQL | `$1` i Node, `%s` med tupel i Python – aldrig text i SQL |
| 5b Indata | `parseId` ger 400 för "banan" och för stora tal |
| 5c Inloggning | `requireCustomer` ger 401 |
| 5d Egen rad | `customerId` från inloggningen. `getOrder` ger 403, och `customer_id` står i `UPDATE`. |
| 5e Fel | `sendError` ger `{ error: { code, message } }`, inga interna detaljer |

## Lärdomar
- Middleware säger ja med `next()` utan svar, eller nej med 401. En förfrågan får bara ett svar.
- 403 = jag vet vem du är, men du får inte. Gäller både fel roll och någon annans rad.
- Ett kriterium = en orsak. Därför "10 minuter" i alla fall utom tidsfallet.
- Testet kontrollerar. Koden gör jobbet. TDD: först rött, sedan grönt.
- Det svåraste var att skriva user storyn och att tolka koden.
  Jag har inte gått igenom alla delar än, och hittills kan jag bara sätta upp ett API.
- Det som hjälpte: tester, lint och typkontroll kontrollerade koden åt mig.
  Jag granskade block för block: vad gör varje del, och vilket kriterium löser den?
