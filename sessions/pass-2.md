# Pass 2 – 17 nov 2026



## Läge
Arbete 1 (avbryta en beställning) och Arbete 3 (price_calc.py) är klara och committade.
Kvar för inlämningen: ADR 0002 i en commit, mallen som PDF, taggen och redovisningen 19 nov.
Arbete 2 görs på seminariet med lärarens pull request.

## Fungerade (med bevis)

**Arbete 1 – POST /orders/:id/cancel**
- User story, 8 acceptanskriterier (Givet/När/Så), research och plan. Commit 1b4b537.
- Steg 1–5 med /tdd, test först. Commits 8cad505, 8441a43/460a9df, 013973f, a44ec65, 20550a3, e442a28, 4ffe276.
- Tester som var gröna direkt bevisades röda genom att skyddet togs bort en kort stund:
  utan ägarkoll blev statusen `cancelled` fast svaret var 403, utan `requireCustomer` stoppade TypeScript koden,
  utan `parseId` hängde anropet.
- 30-minutersregeln och statusen kollas i samma UPDATE med `now()`. ADR 0001, commit c36b226.
- Granskning i lager: automatik + agenterna granskare och sakerhetsgranskare, 13 fynd med mina beslut. Commit 3e153d9.
- Två fynd rättade: S2 för stort id gav ett hängande anrop, nu 400 (1044eff). S3 `customer_id` i UPDATE (c884c34).
- Verifiering mot riktiga servern med curl: alla 8 fall rätt. Commit 9e9f1ff.
- ESLint med eslint-plugin-security och en egen regel mot SQL med `${}`. Commit d7fffeb.

**Arbete 3 – price_calc.py**
- Analys med [kod]/[antagande] och körning av order 1040–1047. Commit 748e015.
- 5 karakteriseringstester, även buggarna O1–O3. conftest.py sätter testdatabasen. Commit d625203.
- Codemap med båda vägarna in (API-bryggan och nattrapporten). Commit b6a0af6.
- Tre refaktoreringssteg, grönt efter varje: namn (b2f37ec), rabatt i egen funktion (63ee45a),
  parametriserad SQL (22a05e4). SQL-injektion via rabattkoden bevisad före och stängd efter.
- Migreringsplan i expand/contract, provkörd med ROLLBACK. Commit 97d51d0.

**Testkörning i slutet av passet:** `npm test` 25 av 25, `npm run test:legacy` 5 av 5, lint 0 fel.

## Misslyckades
- Pris-testet såg trasigt ut. Orsak: `.venv` var inte aktiverad, inte koden.
- VS Code visade röda fel i testfilen (`Cannot find name 'it'`). Orsak: VS Code har TypeScript 6, terminalen 5.9.
  Rättat med `types`, `node16` och `isolatedModules` i tsconfig (8441a43, 2367015).
- Beviset för 400-testet fick Jest att hänga. Det var i sig ett fynd (S1: ingen felhantering för async-routes).
- Migreringsplanens backsteg för steg 3 fungerade inte med regeln kvar. Hittades i provkörningen och rättades.
- Steg 3 i Arbete 1 råkade committas i en commit som heter "Steg 2" (460a9df).

## Återstår
- Committa ADR 0002 (konstiga beteenden i price_calc.py) och den här loggen.
- S1/B3: global felhantering för async-routes (beslut i 3-granskning.md).
- `npm audit`: 1 hög (body-parser), 7 medel – eget steg.
- Nattrapporten har kvar SQL med `%` (dag från kommandoraden).
- Lint: 2 varningar från security-pluginen i tests/helpers/db.ts.
- Mallen som PDF, `git tag inlamning`, öva redovisningen 19 nov.

## Beslut
- Avbrott: bara status `new`, bara inom 30 minuter. `paid` är utanför (återbetalning).
- Tiden räknas i databasen, inte i Node (ADR 0001).
- Konstiga beteenden i price_calc.py bevaras tills någon har beslutat (ADR 0002).
- Ägaren kollas två gånger: `getOrder` och `customer_id` i UPDATE (försvar på djupet).
- Rigg-mallen är privat och ligger inte i repot (9a60e1e).
- Arbete 2 görs med lärarens pull request på seminariet.

## Förbrukning
Räknat ur Claude Codes loggar för projektet, med API-priser (se docs/mall-svar.md, del 8).
- Tokens: ca 27,4 miljoner (Arbete 1: 19,4 milj., Arbete 3: 7,9 milj.), varav ca 115 000 output.
  Över 98 % är cache-läsning.
- Kostnad (API-pris): ca 9 $ (Arbete 1: 6,8 $, Arbete 3: 2,3 $). Jag har abonnemang.
- Tid: ca 4,8 h aktiv tid (Arbete 1: 3,5 h, Arbete 3: 1,3 h).
