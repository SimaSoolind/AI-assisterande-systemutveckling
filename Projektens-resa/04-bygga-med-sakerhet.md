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

### Problem 5: mallen kom med i Git
- Orsak: `git add .` tar med allt, även `docs/rigg-mall.md`.
- Lösning: `git rm --cached docs/rigg-mall.md` + rad i `.gitignore`. Commit `9a60e1e`.
- Lärdom: skriv filnamnen i `git add`, inte bara en punkt.

### Problem 3: Testerna fick fel databas
- Fel: `password authentication failed for user "postgres"`.
- Orsak: mitt Node-projekt Skär använder också port 5433. Dess databas var igång.
- Lösning: `docker stop hotell-solsidan-db` och `npm run db:up`.

### Problem 4: Pristestet rött igen
- Orsak: `.venv` var inte aktiverad, så Python hittade inte psycopg.
- Lösning: `source .venv/bin/activate`. Inte ett fel i koden.

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
