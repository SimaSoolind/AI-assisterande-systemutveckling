# Steg 4: Bygga med säkerhet
Bygg ett litet steg i taget. Följ kodstandarden. Kontrollera all indata. Inga hemligheter i koden.

## Del A: Riggen (15–16 nov)
Riggen är allt som styr agenten. Den ligger i repot, så att den fungerar likadant för alla.

### Behörigheter (lördag 15/nov) – commit `eed4d99`
1. Skrev `.claude/settings.json` med allow, ask och deny.
2. allow: `npm test`, `npm run lint`, `git status`, `git diff` – bara läsa och kontrollera.
3. ask: `git commit`, `git push`, `npm install` – agenten frågar mig först.
4. deny: läsa `.env`, `rm -rf`, `git push --force` – aldrig.

### Skills och subagenter (söndag 16/nov) – commits `f251c00`, `916ac69`
5. Skill `/tdd`: ett steg ur docs/plan.md, test först, väntar på min granskning.
6. Skill `/logg`: utkast till sessionslogg. Skill `/codemap`: karta över koden.
7. Fyra subagenter: utforskare (haiku), granskare (sonnet), testskrivare (sonnet), sakerhetsgranskare (opus).
   Granskarna får bara läsa (Read, Grep, Glob). maxTurns 10 stoppar en agent som fastnar.

### Fem hooks (söndag 16/nov) – commits `02bf10b` till `5ab649d`
8. `skydda-tester` (PreToolUse) – stoppar om ett test tas bort eller får `.skip`. Exit 2.
9. `las-logg` (SessionStart) – läser senaste sessionsloggen. Minneskedjan, del 1.
10. `skriv-logg` (SessionEnd) – skriver ett utkast till nästa logg. Minneskedjan, del 2.
11. `format-och-kontroll` (PostToolUse) – kör prettier, tsc och eslint efter varje ändring.
12. `stoppa-hemligheter` (PreToolUse) – stoppar ändring i `.env` och nycklar i koden.
13. Testade varje hook med egen indata: `echo '{...}' | node .claude/hooks/x.mjs; echo $?`

### ESLint med säkerhetsregler och egen regel (måndag 17/nov) – commit `d7fffeb`
SAL säger: ett fel som hittas tidigt är billigast att rätta (shift-left).
14. `npm install -D eslint-plugin-security` – gratis paket (SAST, SAL F4). `-D` = bara för utveckling.
15. Egen regel ur docs/standard.md i `eslint.config.js`: SQL byggs aldrig med `${}`.
    Felmeddelandet säger hur felet rättas: "Använd $1 och skicka värdet i en lista: db.query(sql, [värde])."
16. Testade regeln med en tillfällig fil: SQL med `${id}` → error. SQL med `$1` → inget fel. Filen raderad.
17. `npm run lint`: 0 fel, 2 varningar (`readFileSync` med variabel i tests/helpers/db.ts – testkod, ofarligt).
    Enligt min regel: nya varningar får vara varningar först.
18. Hooken format-och-kontroll kör eslint efter varje ändring, så regeln stoppar agenten direkt (exit 2).

**Varför billigare:** paketet kör på millisekunder och kostar 0 kr. Opus-agenten kostar tokens.
Därför: gratis kontroller först, dyr AI-granskning sist (granskning i lager).

### Problem 1: Hooken kraschade på texten null
- Fel: `TypeError: Cannot read properties of null (reading 'tool_input')`.
- Orsak: `JSON.parse("null")` är giltigt, men ger inget objekt.
- Lösning: try/catch runt `JSON.parse` och `if (anrop === null) process.exit(0)`. Commit `5ab649d`.

### Problem 2: .env.local stoppades inte
- Orsak: `fil.endsWith(".env")` fångar bara exakt `.env`.
- Lösning: alla filer som heter `.env` eller börjar med `.env.` stoppas, utom mallen `.env.example`.

## Del B: Arbete 1 – Avbryta en beställning (måndag 17/nov)

### Krav, research och plan – commit `1b4b537`
14. Valde user story 2: avbryta en beställning inom 30 minuter. Varför: docs/arbete-1/1-user-story.md.
15. Skrev 8 acceptanskriterier i formen Givet/När/Så (200, 400, 401, 403, 404, 409).
16. Research: requireCustomer (401), parseId (400), getOrder (403/404) och felkoden conflict (409) fanns redan.
17. Plan i docs/plan.md med 6 steg, Klart när och Utanför.

### Steg 1: avbryta inom 30 minuter – commit `8cad505`
18. `/tdd Steg 1` skrev testet först. Rött: 404, för routen fanns inte.
19. Koden: route `POST /orders/:id/cancel` och `cancelOrder` i orderService. Grönt: 17 av 17.
20. Jag granskade varje block: middleware → parseId → getOrder → UPDATE med `$1`.

### Steg 2: efter 30 minuter → 409 – commit `8441a43`
21. `/tdd Steg 2` skrev testet först: skapar en beställning, flyttar `created_at` 31 minuter bakåt med SQL,
    försöker avbryta och väntar 409. Sist kollar testet att status fortfarande är 'new'. Rött.
22. Koden: villkoret `created_at > now() - interval '30 minutes'` i samma `UPDATE`.
    `rowCount === 0` betyder att ingen rad ändrades → `err("conflict")` → 409. Grönt: 18 av 18.
23. Lint, typecheck och format:check: 0 fel.

**Alternativ jag valde bort (för testet):**
| Alternativ | Varför inte |
|------------|-------------|
| Beställning 1042 ur seed | status 'paid' – fel orsak till 409 |
| Låtsasklocka i Jest | tiden räknas i databasen, inte i Node |
| Vänta 31 minuter | för långsamt |

**Alternativ jag valde bort (för 30-minutersregeln):**
| Alternativ | Varför inte |
|------------|-------------|
| Jämföra i Node med `Date.now()` | två klockor kan visa olika tid, och race condition mellan läsning och skrivning |
| Databasregel (trigger eller CHECK) | kräver migrering, och planen säger inga tabelländringar |

**Ord att kunna:** race condition – två anrop samtidigt klarar båda en kontroll innan någon hinner skriva.
I samma `UPDATE` gör databasen kontroll och ändring i ett enda steg.

### Steg 3: redan avbruten eller skickad → 409 – commit `460a9df` (+ `013973f` bockar av planen)
24. Testet körs två gånger med `it.each(["cancelled", "shipped"])`. `%s` i namnet visar vilken status som testas.
25. Koden: `AND status = 'new'` i samma `UPDATE`. Fel status → 0 rader ändras → 409. Grönt: 20 av 20.
26. Avvägning: samma meddelande för två orsaker ("bara ny, och bara inom 30 minuter").
    Säkerheten (ingen race condition) går före ett eget meddelande per orsak.

**Om commit-namnen:** `460a9df` heter "Steg 2" men innehåller steg 3. Agenten hade redan committat steg 2 (`8441a43`),
så när jag committade följde steg 3 med. Commiten var redan pushad, så jag skrev inte om historiken
(`git push --force` är förbjudet i min rigg). Lärdom: kolla `git log` innan jag committar.

### Steg 4a: någon annans beställning → 403 – commit `a44ec65`
27. Testet blev grönt direkt, för `getOrder` kollar redan ägaren (från steg 1).
28. Mutationstest: jag tog bort ägarkollen en kort stund. Testet blev rött. Se 05-testa.md.

### Steg 4b: beställningen finns inte → 404 – commit `20550a3`
29. Testet avbryter beställning 9999, som inte finns. Grönt direkt, för `getOrder` ger redan 404.
30. Bevis rött: utan `getOrder` blev svaret 409 i stället för 404. Kunden hade fått fel förklaring
    ("bara inom 30 minuter") för en beställning som inte finns.
31. Lärdom: kolla att raden finns **före** `UPDATE`. `rowCount === 0` kan betyda tre saker: finns inte, fel status, för sent.

### Steg 5a: inte inloggad → 401 – commit `e442a28`
32. Testet skickar ingen `X-Customer-Id`. Grönt direkt, för middlewaren `requireCustomer` ger redan 401.
33. Bevis: när `requireCustomer` togs bort startade inte ens testerna. **TypeScript** stoppade först:
    `customerId` saknas, eftersom ingen middleware har kollat inloggningen.
34. Två vakter för inloggning – granskning i lager (AI D2-F5):

| Vakt | När den larmar | Verktyg |
|------|----------------|---------|
| TypeScript | när koden skrivs | typecheck + hooken format-och-kontroll (SAST, SAL F4) |
| 401-testet | när koden körs | npm test |

35. Varför behövs testet om TypeScript redan stoppar? TypeScript kollar att koden **ser rätt ut**.
    Testet kollar att den **gör rätt**: svaret blir 401 och ingenting ändras.

### Steg 5b: id är inte ett tal → 400 – commit `4ffe276`
36. Testet skickar `POST /orders/banan/cancel`. Grönt direkt, för `parseId` ger redan 400.
37. Bevis: utan `parseId` hängde anropet. Se 05-testa.md och den höjda risken i 02-riskbedomning.md.
38. Valde bort zod här: bara ett id ska valideras, och `parseId` används redan i två andra routes.

### Problem 3: Testerna fick fel databas
- Fel: `password authentication failed for user "postgres"`.
- Orsak: mitt Node-projekt Skär använder också port 5433. Dess databas var igång.
- Lösning: `docker stop hotell-solsidan-db` och `npm run db:up`.

### Problem 4: Pristestet rött igen
- Orsak: `.venv` var inte aktiverad, så Python hittade inte psycopg.
- Lösning: `source .venv/bin/activate`. Inte ett fel i koden.

### Problem 5: mallen kom med i Git
- Orsak: `git add .` tar med allt, även `docs/rigg-mall.md`.
- Lösning: `git rm --cached docs/rigg-mall.md` + rad i `.gitignore`. Commit `9a60e1e`.
- Lärdom: skriv filnamnen i `git add`, inte bara en punkt.

## Del C: Arbete 3 – Modernisering av price_calc.py (måndag 17/nov)
Regeln: förstå först, lås fast beteendet med tester, ändra sedan i små steg.

### Steg 1: Analys – `docs/analys-price-calc.md` – commit `748e015`
39. Sökte efter alla anrop: filen används på **två** ställen – API:t (`src/pricing/legacyPrice.ts`) och nattrapporten (`jobs/nightly_report.py`).
40. Sidoeffekter: öppnar databasen redan när filen laddas, och skriver fel tyst till en loggfil.
41. Tre osäkerheter: **O1** utgången rabatt (1045), **O2** momsen kapas (1044), **O3** beställning utan rader (1043).
42. Säkerhet: SQL injection på rad 42 – rabattkoden från kunden byggs in med `%` (SAL F4). Noterat, inte rättat än.

### Steg 2: Codemap – `docs/codemap.md` – committas med resan
51. En rad per fil i `src/`, `jobs/`, `scripts/` och `db/`: vad den gör och vad den anropar.
52. Två vägar in till `price_calc.py`, kontrollerade mot koden:

| | Väg 1: API | Väg 2: nattrapporten |
|---|------------|----------------------|
| Var | `src/pricing/legacyPrice.ts:7` | `jobs/nightly_report.py:4` |
| Hur | startar Python som egen process | `from price_calc import calc_price, conn` |
| Behörighet | `requireCustomer` + `getOrder` | ingen (körs av cron) |

53. Följd för refaktoreringen: rör inte namnen `calc_price` och `conn`. Då går nattrapporten sönder,
    och karakteriseringstesterna märker det inte – de testar bara `calc_price`.

### Steg 3: Körning – vad koden svarar i dag – commit `748e015`
43. `npm run db:reset` och sedan `python3 src/legacy/price_calc.py` för 1040–1047. Tabellen står i analysfilen, avsnitt 7.
44. Det blev **inte** facit: 1044 och 1045 har buggar. Det är vad koden gör i dag, och testerna ska låsa fast just det.

### Steg 4: Fem karakteriseringstester – `tests/test_price_calc.py` – commit `d625203`
45. Ett test per beställning: 1042 (grundfall), 1043 (O3), 1044 (O2), 1045 (O1), 1041 (giltig rabatt).
46. Alla gröna mot den **orörda** filen. Testerna låser fast vad koden gör i dag, även buggarna.
47. Test 1 jämför med `str(...)`: `Decimal("1187.5") == Decimal("1187.50")` är sant, så bara `str` märker formen `"1187.5"`.
48. `tests/conftest.py` sätter testdatabasen **före** importen (som `env.ts` för Jest).
    Förut fungerade testerna bara om jag satte `DATABASE_URL` själv. Nu räcker `npm run test:legacy`.
49. Agenten försökte läsa `.env` och nekades – deny-regeln i `settings.json` fungerade (SAL F3).
50. Lösenordet `postgres` i conftest är den lokala testdatabasens, samma som i `env.ts`. Riktiga hemligheter ligger i `.env`.

**Att komma ihåg:** Jest och pytest delar testdatabasen. Kör dem efter varandra, inte samtidigt.

### Refaktoreringssteg 1: tydliga namn – commit `b2f37ec`
54. Bytte otydliga namn i `price_calc.py` till svenska namn som säger vad de är:
    `x` → `belopp`, `rad` → `orderrad`, `kod` → `rabattkod`, `q, p` → `antal, styckpris`, `r` → `rabattrad`, `f` → `loggfil`.
55. Rörde inte `calc_price`, `conn`, `Pris` och `.net/.vat/.total` – nattrapporten och testerna använder dem.
56. Kontroll: 5 karakteriseringstester gröna, 25 Jest-tester gröna, och nattrapporten (väg 2) ger samma svar.
57. Valde svenska namn: filen är redan på svenska (`summa`, `Pris`, `MOMS`). Engelska hade blandat språk i filen.

**Varför ett säkert första steg?** Ett namnbyte ändrar inte vad koden gör, bara vad sakerna heter.
Karakteriseringstesterna gav exakt samma svar före och efter – därför skrevs testerna först.

**Övervägde men valde bort:** skriva om Python till TypeScript nu. Nattrapporten importerar Python-filen,
och kursen kräver små steg. Planen för det (strangler fig) står i mall-svar.md under "en vecka till".

### Refaktoreringssteg 2: rabatten i en egen funktion – commit `63ee45a`
58. Flyttade rabattberäkningen från `calc_price` till en egen funktion `_dra_av_rabatt(cur, rabattkod, summa)`.
    I `calc_price` står nu en rad i stället för fem.
59. Exakt samma kod flyttad. `_` först i namnet betyder "intern" i Python – nattrapporten ska inte använda den.
60. Kommentaren `OBS giltighetsdatumet kontrolleras inte (O1)` – buggen är dokumenterad, inte rättad.
61. Kontroll: 5 karakteriseringstester gröna (även 1045 med utgången rabatt), 25 Jest-tester gröna,
    nattrapporten 2026-10-07 ger 689.56 kr – samma som förut.

**Varför rättas inte O1 nu?** Refaktorering ändrar hur koden ser ut, inte vad den gör.
Att rätta O1 ändrar beteendet och kräver ett beslut och en ADR. En sak i taget.
Nu ligger rabattregeln – och SQL-raden med `%` – på ett ställe, så steg 3 blir lättare.

### Refaktoreringssteg 3: parametriserad SQL – commit `22a05e4`
62. Alla tre SQL-frågor i `price_calc.py`: från `'%s'" % värde` (värdet byggs in i texten)
    till `"%s", (värde,)` (värdet skickas separat). Samma regel som `$1` + `[värde]` i Node (SAL F4, fråga 5a).
63. Bevis med en elak rabattkod `FINNS_INTE' OR '1'='1`:

| Kod | Resultat |
|-----|----------|
| Gamla frågan | fick 10 % rabatt med en kod som inte finns – SQL injection |
| Nya frågan | ingen rabatt – databasen ser texten som data |
| Nya frågan med `VAR10` | 100 → 90, rabatten fungerar fortfarande |

64. Kontroll: 5 karakteriseringstester gröna, 25 Jest-tester gröna, nattrapporten ger samma svar (O1 och O2 finns kvar).
65. `(rabattkod,)` – kommatecknet gör det till en tupel med ett värde. Citattecknen runt `%s` togs bort, psycopg sätter dem själv.

**Kvar:** `jobs/nightly_report.py:8` har samma mönster (`'%s'" % dag`). Mindre risk – `dag` kommer från den som kör jobbet,
inte från en kund. Står under "en vecka till" i mall-svar.md.

### Migreringsplan – `docs/migreringsplan.md` – committas med resan
66. Problemet: databasen tillåter vilken status som helst. Ett stavfel som `'canceled'` sparas tyst,
    och då hittar `cancelOrder` (`status = 'new'`) och nattrapporten (`status = 'paid'`) inte raden.
67. Lösningen: en CHECK-regel – bara `new`, `paid`, `shipped`, `cancelled` – införd i expand/contract-steg:

| Steg | Gör | Går att backa? |
|------|-----|----------------|
| 1 Expand | regeln med `NOT VALID` – gäller nya rader direkt | ✅ `DROP CONSTRAINT` |
| 2 Verifiera | leta efter gamla rader med okänd status | ✅ bara läsning |
| 3 Rätta gamla rader (om de finns) | kopia + `UPDATE` | ⚠️ bara med kopian – och först efter att regeln är borttagen |
| 4 Contract | `VALIDATE CONSTRAINT` – gäller alla rader | ✅ `DROP CONSTRAINT` |
| 5 Städa | regeln in i `schema.sql`, kopian bort | kopian går inte att få tillbaka |

68. Provkörd i testdatabasen inuti `BEGIN … ROLLBACK`: 0 rader med okänd status, `VALIDATE` gav `true`,
    och ett stavfel (`'canceled'`) stoppades av regeln. Allt ångrades – databasen är oförändrad.
69. **Provkörningen hittade ett fel i planen:** att backa steg 3 (lägga tillbaka från kopian) gick inte,
    för regeln från steg 1 vägrade släppa in det gamla värdet. Rättat: backa i rätt ordning –
    först ta bort regeln, sedan återställa från kopian. Provkört igen: fungerade.

**Varför inte allt på en gång?** En vanlig CHECK kontrollerar alla gamla rader direkt. Finns en enda felaktig rad
misslyckas allt, och tabellen kan låsas länge. Stegvis är säkrare, och varje steg kan backas.

## Arbete 3 är klart ✅
Codemap, 5 karakteriseringstester, tre refaktoreringssteg med grönt efter varje, och en migreringsplan.

### Problem 6: psycopg saknades igen, sedan fel port
- Fel 1: `No module named 'psycopg'`. Orsak: `.venv` inte aktiverad. Lösning: `source .venv/bin/activate`.
- Fel 2: `port 5432 failed: role "postgres" does not exist`. Orsak: filen läser `DATABASE_URL`, och utan `.env`
  används reservadressen i koden (fynd B4). Lösning: `set -a; source .env; set +a` – laddar `.env` utan att visa den.

## Säkerhet i det jag byggde (SAL)
| Fråga | Hur |
|-------|-----|
| 5a SQL | `UPDATE ... WHERE id = $1` – aldrig text i SQL |
| 5b Indata | parseId ger 400 för "banan" |
| 5c Inloggning | requireCustomer ger 401 |
| 5d Egen rad | customerId från inloggningen, aldrig från body. getOrder ger 403 |
| 5e Fel | sendError ger `{ error: { code, message } }`, inga interna detaljer |

## Lärdomar
- Middleware säger ja med `next()` utan svar, eller nej med 401. En förfrågan får bara ett svar.
- 403 = jag vet vem du är, men du får inte. Gäller både fel roll och någon annans rad.
- Ett kriterium = en orsak. Därför "10 minuter" i alla fall utom tidsfallet.
- Testet kontrollerar. Koden gör jobbet. TDD: först rött, sedan grönt.
- Det svåraste var att skriva user storyn, och att tolka koden. Jag har inte gått igenom alla delar än,
  och hittills kan jag bara sätta upp ett API.
- Det som hjälpte: testerna, lint och typkontrollen (hooken format-och-kontroll) kontrollerade koden åt mig.
  Jag granskade block för block: vad gör varje del, och vilket acceptanskriterium löser den?
