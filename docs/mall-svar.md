# Kursprojekt – En rigg för en kodbas
Mallen, sidorna 4–9. Varje svar pekar på en fil eller en commit i repot.

| | |
|---|---|
| **Namn** | Sima Soolind |
| **Kodbas** | Delkursens övningsprojekt: ett REST-API för kunder och beställningar (TypeScript, Express, PostgreSQL) med en äldre prisberäkning i Python |
| **Repo** | github.com/SimaSoolind/AI-assisterande-systemutveckling |
| **Tagg** | `inlamning` |

## Detaljerna finns i repot
Den här mallen är en sammanfattning. Den detaljerade beskrivningen av varje steg finns i dokumenten nedan.

| Vad | Dokument |
|-----|----------|
| Hela resan steg för steg | [Projektens-resa/](https://github.com/SimaSoolind/AI-assisterande-systemutveckling/tree/main/Projektens-resa) |
| Riggen, Arbete 1 och Arbete 3 i detalj | [04-bygga-med-sakerhet.md](https://github.com/SimaSoolind/AI-assisterande-systemutveckling/blob/main/Projektens-resa/04-bygga-med-sakerhet.md) |
| Tester och mutationstest | [05-testa.md](https://github.com/SimaSoolind/AI-assisterande-systemutveckling/blob/main/Projektens-resa/05-testa.md) |
| Granskning, verifiering och npm audit | [06-validera.md](https://github.com/SimaSoolind/AI-assisterande-systemutveckling/blob/main/Projektens-resa/06-validera.md) |
| Risker | [02-riskbedomning.md](https://github.com/SimaSoolind/AI-assisterande-systemutveckling/blob/main/Projektens-resa/02-riskbedomning.md) |
| Alla lärdomar | [08-vad-jag-har-lart-mig.md](https://github.com/SimaSoolind/AI-assisterande-systemutveckling/blob/main/Projektens-resa/08-vad-jag-har-lart-mig.md) |
| Arbete 1: user story, research, granskning, verifiering | [docs/arbete-1/](https://github.com/SimaSoolind/AI-assisterande-systemutveckling/tree/main/docs/arbete-1) |
| Arbete 3: analys, codemap, migreringsplan | [docs/](https://github.com/SimaSoolind/AI-assisterande-systemutveckling/tree/main/docs) |
| Beslut (ADR) | [docs/adr/](https://github.com/SimaSoolind/AI-assisterande-systemutveckling/tree/main/docs/adr) |
| Sessionsloggar | [sessions/](https://github.com/SimaSoolind/AI-assisterande-systemutveckling/tree/main/sessions) |
| Riggen: behörigheter, hooks, agenter, skills | [.claude/](https://github.com/SimaSoolind/AI-assisterande-systemutveckling/tree/main/.claude) |

**Bevis:** under varje svar står filen eller commiten där det syns. En commit hittas med
`git show <commit>` eller på GitHub: `…/commit/<commit>`.

## Innehåll
| Del | Om |
|-----|-----|
| 1 | Kodbas, krav och beslut |
| 2 | Riggens delar |
| 3 | Behörigheter och sandlåda |
| 4 | Arbetsslingan och kontexten |
| 5 | Orkestrering och modellval |
| 6 | Styrd kodgenerering och granskning |
| 7 | Modernisering |
| 8 | Mätningar |
| 9 | Riggen i ett team, risker och lärdomar |

---

# 1. Kodbas, krav och beslut

### Vilken kodbas, och varför?
Övningsprojektet. Det har:
- tester som går att köra
- en äldre del som behöver moderniseras (`src/legacy/price_calc.py`)
- ingen riktig kunddata

### User story och acceptanskriterier
> Som kund vill jag kunna avbryta en beställning inom 30 minuter efter att jag lagt den.

8 kriterier i formen Givet / När / Så:

| Fall | Svar |
|------|------|
| inom 30 minuter | 200 |
| efter 30 minuter | 409 |
| redan avbruten | 409 |
| redan skickad | 409 |
| någon annans beställning | 403 |
| inte inloggad | 401 |
| id är inte ett tal | 400 |
| beställningen finns inte | 404 |

**Bevis:** `docs/arbete-1/1-user-story.md` · commit `1b4b537`

### API-kontraktet för funktionen
| Endpoint | Svar |
|----------|------|
| `POST /orders/:id/cancel` | 200, 400, 401, 403, 404, 409 |

- 200 ger beställningen med status `cancelled`.
- Felsvar har formen `{ "error": { "code", "message" } }`, enligt `docs/standard.md`.

**Bevis:** `docs/api.md` · commit `e15a3b8`

### ADR: besluten
| ADR | Beslut | Commit |
|-----|--------|--------|
| 0001 | 30-minutersregeln räknas i databasen med `now()`. Tid, status och kund kollas i samma `UPDATE`. | `c36b226` |
| 0002 | Konstiga beteenden i price_calc.py (O1, O2, O3, en decimal) bevaras tills någon har beslutat. | `940fdd7` |

**Bevis:** `docs/adr/`

### Alternativ jag valde bort, och varför
| Alternativ | Varför inte |
|------------|-------------|
| Jämföra tiden i Node med `Date.now()` | två klockor, och race condition |
| Databasregel (trigger eller CHECK) | kräver migrering, och planen säger inga tabelländringar |
| Andra user stories | idempotens för svår, lagersaldo för stor, rabattkod krockar med Arbete 3 |

### Antaganden
- Inloggningen med `X-Customer-Id` är en förenkling i övningen. I produktion: JWT.
- Bara status `new` kan avbrytas. `paid` kräver återbetalning och är utanför.
- Kunder avbryter oftast snabbt efter ett misstag. Därför räcker 30 minuter.

---

# 2. Riggens delar

### Skills
| Skill | Gör | Varför |
|-------|-----|--------|
| `/tdd` | ett steg ur plan.md: test först, rött, minsta kod, grönt, väntar på min granskning | tvingar fram test först och små steg |
| `/logg` | utkast till sessionslogg med de fem rubrikerna | minnet mellan sessioner |
| `/codemap` | karta över koden | förstå koden innan jag ändrar |

**Vad gick fel utan den?**
| Skill | Utan den |
|-------|----------|
| `/tdd` | agenten skrev kod först, och för mycket på en gång |
| `/logg` | svårt att veta var man slutade, särskilt efter ett långt uppehåll eller när någon annan tar över |
| `/codemap` | jag hade inte vetat att nattrapporten också använder price_calc.py – ett namnbyte hade kunnat bryta den |

**Så ser man att den fungerar:**
- `/tdd`: varje commit i Arbete 1 har ett test som var rött först.
- `/logg`: `sessions/pass-1.md` och `sessions/pass-2.md`.
- `/codemap`: `docs/codemap.md`.

### Subagenter
| Namn | Uppgift | Verktyg | Modell |
|------|---------|---------|--------|
| utforskare | hittar var saker finns | Read, Grep, Glob | haiku |
| granskare | granskar mot plan och standard | Read, Grep, Glob | sonnet |
| testskrivare | skriver tester, rör inte `src/` | Read, Grep, Glob, Edit, Write, Bash | sonnet |
| sakerhetsgranskare | SQL, hemligheter, behörighet | Read, Grep, Glob | opus |

- Alla har `maxTurns: 10`.
- Granskarna får bara läsa.

**Använd på riktigt:**
| Agent | Vad den hittade eller gjorde | Commit |
|-------|------------------------------|--------|
| utforskare | `paid` och `shipped` sätts utanför koden – skäl för CHECK-regeln | `1234946` |
| granskare | granskade Arbete 1: 5 låga fynd, alla 8 kriterier har test | `3e153d9` |
| testskrivare | skrev testet för nattrapporten – väg 2 in till price_calc.py | `dd09546` |
| sakerhetsgranskare | hittade S2 (för stort id hänger), som lint och tester missade | `3e153d9` |

Testerna i Arbete 1 skrevs av skillen `/tdd`, inte av testskrivaren. `/tdd` håller test och kod i samma steg.

**Bevis:** `.claude/agents/` · commit `916ac69`

### Hooks
| Hook | När | Gör |
|------|-----|-----|
| skydda-tester | före en ändring | stoppar borttagna tester och `.skip` / `.only` (exit 2) |
| stoppa-hemligheter | före en ändring | stoppar ändring i `.env` och nycklar som `ghp_`, `sk-ant-` (exit 2) |
| format-och-kontroll | efter en ändring | kör prettier, tsc och eslint. Fel ger exit 2, och agenten rättar. |
| las-logg | när en session startar | laddar senaste loggen (minneskedjan) |
| skriv-logg | när en session slutar | sparar utkast till nästa logg (minneskedjan) |

**Så testade jag:** varje hook med ett framkallat fel.
`echo '{...}' | node .claude/hooks/x.mjs; echo $?`

**Bevis:** commits `02bf10b`, `dc3f926`, `94e80e3`, `de8b29c`, `3b44671` · `Projektens-resa/04-bygga-med-sakerhet.md`

### Delar jag valde bort
| Del | Varför inte |
|-----|-------------|
| Fler än fem hooks | fem hooks som fungerar är bättre än femton som ingen kan förklara |
| Pluginet Superpowers | samma arbetsmetod (fråga, plan, test först, granskning), men många skills och agenter ger fler tokens, och man kan använda det utan att förstå det. Jag ville förstå varje del. |
| En hook som kör alla tester efter varje ändring | för långsamt. Testerna körs i `/tdd` och före commit. |

**Känd lucka:** skydda-tester ser inte om hela testfilen raderas i terminalen. Det stoppas av `rm -rf` i deny.

---

# 3. Behörigheter och sandlåda

### Mina regler
| Lista | Regler | Varför |
|-------|--------|--------|
| Allow | `npm test`, `npm run lint`, `git status`, `git diff` | bara läsa och kontrollera |
| Ask | `git commit`, `git push`, `npm install` | jag är grinden för historik och beroenden |
| Deny | läsa `.env`, `rm -rf`, `git push --force` | hemligheter, och det som inte går att ångra |

**Det fungerade:**
- deny stoppade agenten när den försökte radera `.venv` (pass 1).
- deny nekade agenten att läsa `.env` (Arbete 3).

**Bevis:** `.claude/settings.json` · commit `eed4d99`

### Var agenten körs, och varför
- På min egen dator (macOS), i VS Code.
- Databasen körs i Docker.
- Ingen sandlåda: det är ett kursprojekt utan riktig data, och deny-reglerna stoppar det farliga.

---

# 4. Arbetsslingan och kontexten

### Stegen från krav till commit
```
User story → Givet/När/Så → research → plan → /tdd (rött → grönt) → jag granskar → commit
```
**Bevis:** `docs/arbete-1/`, `docs/plan.md`, `Projektens-resa/`

### Hur kontexten hanteras
| Sätt | Hur |
|------|-----|
| Plan i fil | planen ligger i `docs/plan.md`, inte i chatten |
| Sessionslogg | `skriv-logg` sparar, `las-logg` laddar |
| Rensa | ny chatt per arbete – allt viktigt ligger i filer |

### En commit som exempel
**`8cad505`** – "Steg 1: kund kan avbryta en egen beställning"

Från den kan man spåra:
- vilket fall (fall 1 i user storyn)
- vilket steg i planen
- att testet var rött först
- att AI-stöd användes (`/tdd`)
- vad granskningen ändrade

---

# 5. Orkestrering och modellval

### Faserna och filen varje fas lämnar
| Fas | Fil |
|-----|-----|
| Krav | `docs/arbete-1/1-user-story.md` |
| Research | `docs/arbete-1/2-research.md` |
| Plan | `docs/plan.md` |
| Bygg | `src/`, `tests/` och en commit per steg |
| Granska | `docs/arbete-1/3-granskning.md` |
| Verifiera | `docs/arbete-1/4-verifiering.md` |

### Modell per subagent, och varför
| Agent | Modell | Varför |
|-------|--------|--------|
| utforskare | haiku | enkel sökning, billigast |
| granskare, testskrivare | sonnet | bra nog, lagom pris |
| sakerhetsgranskare | opus | säkerhet kräver mest noggrannhet |

### Kostnad med mitt val och med en större modell
| Modell | Pris per miljon tokens (in / ut) |
|--------|----------------------------------|
| Sonnet 5.5 | 2 / 10 USD |
| Opus 5.5 | 4 / 20 USD |

Opus kostar dubbelt så mycket. Därför används den bara för säkerhetsgranskningen.

### Loop: vad görs om
`/tdd`: test → kör → rött → kod → kör → grönt.
Blir det rött efter koden, gör jag om koden – inte testet.

### Stoppvillkor
- `maxTurns: 10` per subagent.
- Inget stopp för tid eller kronor. Kostnaden mäts i efterhand (del 8).

### Parallellt i worktrees
- Inget körs parallellt.
- Jag arbetade ett steg i taget, för att kunna granska allt och förstå hur varje steg går till.
- Vid varje steg frågade jag vad, hur och varför innan jag godkände.

---

# 6. Styrd kodgenerering och granskning

### Kodstandarden i verktyg
| Verktyg | Säger nej till | Felmeddelande |
|---------|----------------|---------------|
| ESLint, egen regel | SQL byggd med `${}` | "SQL får inte byggas med ${}. Använd $1 och skicka värdet i en lista: db.query(sql, [värde])." |
| eslint-plugin-security | farliga mönster (SAST) | paketets egna meddelanden |
| tsc (strict) | typfel | TypeScripts meddelanden |
| skydda-tester | borttagna tester | "Stoppad: ändringen tar bort ett test. Föreslå ändringen i text i stället." |
| stoppa-hemligheter | nycklar i koden | "Lägg hemligheter i .env och läs dem med process.env." |

- Hooken format-och-kontroll kör prettier, tsc och eslint efter varje ändring.
- Varningar först: säkerhetspaketet gav 2 varningar i testkod. De får vara varningar tills de är granskade.

**Bevis:** `eslint.config.js` · commit `d7fffeb`

### Granskningslagren
| Lager | Fångar | Exempel |
|-------|--------|---------|
| TypeScript | att inloggning saknas | utan `requireCustomer` stoppade TypeScript koden |
| Tester | fel svar och ändrad data | 403-testet såg att status blev `cancelled` |
| sakerhetsgranskare | det som testerna inte tänkt på | S2: för stort id hänger |
| Jag | om det är rätt sak, och om jag kan förklara det | beslut för 13 fynd |

### Var sitter människan, och varför just där?
- Efter automatiken och agenterna, före commit.
- Där kan jag besluta vad som rättas nu, senare eller inte alls.
- Det svåraste för mig var att tolka koden. Därför granskar jag block för block:
  vad gör delen, och vilket kriterium löser den?

### Granskning av lärarens pull request
Görs på seminariet. Läraren delar ut pull requesten där.

| Sort | Rad | Vad bristen är | Varför | Kontroll som hade stoppat den |
|------|-----|----------------|--------|-------------------------------|
| Säkerhet | | | | |
| Struktur | | | | |
| Kodstandard | | | | |

### Vad automatiken hittade, och vad bara jag och agenterna hittade
| Vem | Hittade |
|-----|---------|
| Automatiken (lint, typer, tester) | 0 fel i Arbete 1 |
| sakerhetsgranskare | S2 och S3 |
| Mutationstestet | ett test som bara kollar statuskoden hade varit grönt trots Broken Access Control |

**Bevis:** `docs/arbete-1/3-granskning.md` · `Projektens-resa/05-testa.md`

---

# 7. Modernisering

### Codemap: moduler, ansvar och beroenden
`price_calc.py` har två vägar in:

| | Väg 1: API | Väg 2: nattrapporten |
|---|------------|----------------------|
| Fil | `src/pricing/legacyPrice.ts` | `jobs/nightly_report.py` |
| Hur | startar Python som egen process | `from price_calc import calc_price, conn` |

Därför rördes aldrig namnen `calc_price` och `conn`.

**Bevis:** `docs/codemap.md` (`b6a0af6`) · `docs/analys-price-calc.md` (`748e015`)

### Karakteriseringstester
De låser fast vad koden gör i dag – även buggarna.

| Test | Låser fast |
|------|------------|
| order 1042 | grundfallet och formen `"1187.5"` |
| order 1043 | O3: inga rader → 0, inget fel |
| order 1044 | O2: momsen kapas (44.9775 → 44.97) |
| order 1045 | O1: en utgången rabatt dras ändå av |
| order 1041 | en giltig rabatt |
| nattrapporten 7 okt | väg 2: `689.56 kr` |

- `conftest.py` sätter testdatabasen före importen.
- 6 av 6 gröna.

**Bevis:** `tests/test_price_calc.py` (`d625203`) · `tests/test_nightly_report.py` (`dd09546`, skrivet med agenten testskrivare)

### Stegen, med commit och grönt efter varje
| Steg | Vad | Commit |
|------|-----|--------|
| 1 | tydliga namn: `kod` → `rabattkod`, `q, p` → `antal, styckpris` | `b2f37ec` |
| 2 | rabatten i en egen funktion. O1 dokumenterad, inte rättad. | `63ee45a` |
| 3 | säker SQL – stängde SQL injection via rabattkoden | `22a05e4` |

Efter varje steg: 5 + 25 tester gröna, och nattrapporten gav samma svar.

### Migreringsplan i expand/contract-steg
En CHECK-regel för `status`.

| Steg | Gör | Går att backa? |
|------|-----|----------------|
| 1 Expand | regeln med `NOT VALID` | ✅ |
| 2 Verifiera | leta efter gamla felaktiga rader | ✅ bara läsning |
| 3 Rätta gamla rader | kopia + `UPDATE` | ⚠️ bara med kopian |
| 4 Contract | `VALIDATE CONSTRAINT` | ✅ |
| 5 Städa | ta bort kopian | ❌ |

- Provkörd i testdatabasen med `BEGIN … ROLLBACK`.
- Provkörningen hittade ett fel i backsteget, som rättades.

**Bevis:** `docs/migreringsplan.md` · commit `97d51d0`

---

# 8. Mätningar

**Hur jag räknade:**
- Ur Claude Codes loggar för bara ovningsprojekt-chatten.
- Med API-priser: Opus 5.5 kostar 4 USD in, 20 USD ut och 0,20 USD cache-läsning per miljon tokens.
- Jag har abonnemang. Siffrorna visar vad det **hade kostat** via API:t.
- Tid = aktiv tid i chatten. Pauser över 10 minuter räknas inte.

### Tokens, tid och kostnad per arbete
| Arbete | Tokens | Tid | Kostnad |
|--------|--------|-----|---------|
| Studera koden (10–12 nov) | 21,9 milj. | 5,6 h | 8,7 USD |
| Riggen (15–16 nov) | 61,3 milj. | 7,2 h | 19,9 USD |
| Arbete 1 (17 nov) | 19,4 milj. | 3,5 h | 6,8 USD |
| Arbete 3 (17 nov) | 7,9 milj. | 1,3 h | 2,3 USD |
| **Totalt** | **110 milj.** | **17,6 h** | **37,7 USD** |

- Över 98 % av alla tokens är cache-läsning.
- Min egen arbetstid var längre. Den 17 nov arbetade jag kl 10–20, med granskning, dokumentation och beslut.

### Vad kontrollerna fångade
| Kontroll | Fångade |
|----------|---------|
| deny | stoppade `rm -rf .venv`, och nekade läsning av `.env` |
| TypeScript | borttagen `requireCustomer` |
| Tester (mutationstest) | 403, 404 och 401 blev röda när skyddet togs bort |
| sakerhetsgranskare | 2 höga fynd i ny kod |
| npm audit (SCA) | 3 sårbara paket – 2 lagade, 1 riskbeslut (`dd3fc80`) |
| Provkörning | ett fel i migreringsplanens backsteg |

### Besparingar, och vad de kostar i kvalitet
| Besparing | Sparar | Kostar i kvalitet |
|-----------|--------|-------------------|
| **Cache** | Arbete 1: 3,8 USD i stället för 76 USD – 20 gånger billigare | inget, men en lång session gör varje svar dyrare |
| **Gratis kontroller före dyr AI** | lint, typer och tester kostar 0 kr. Opus körs en gång per arbete. | verktygen hittar bara kända mönster – S2 hittades bara av agenten |
| **haiku för utforskaren** | billigare än sonnet | kan missa samband i koden |

---

# 9. Riggen i ett team, risker och lärdomar

### Första steget i ett team på fem
Behörigheterna och hooken stoppa-hemligheter. De skyddar mot det som inte går att ångra.

### Vad jag väntar med, och varför
Dyra subagenter (opus), tills teamet ser att de hittar något som de billiga kontrollerna missar.

### Ägare, ändringar och översyn
| | |
|---|---|
| Ägare | en person per sprint |
| Ändringar | via pull request, som all annan kod |
| Översyn | varje sprint |

### Vad som följer med om modellen eller verktyget byts ut
- Det mesta ligger i vanliga filer: plan, standard, ADR, loggar och hooks i Node.
- Bara formatet i `.claude/` är knutet till Claude Code.
- Exempel: när VS Code bytte till TypeScript 6 behövde `tsconfig.json` ändras (`2367015`).

### Fem risker
| Risk | Hur jag upptäcker den | Vad riggen gör |
|------|-----------------------|----------------|
| Agenten tar bort ett test för att bli grön | testet försvinner | skydda-tester stoppar (exit 2) |
| En nyckel hamnar i koden | secret scanning | stoppa-hemligheter stoppar |
| Ett test är alltid grönt | mutationstest | testerna kollar både svar och data |
| Ett fel får anropet att hänga (DoS) | sakerhetsgranskare och test | `parseId` med övre gräns. Global felhanterare planerad. |
| Sårbara paket | `npm audit` (SCA) | `npm audit fix` lagade 2. picomatch kvar – riskbeslut. |

**Om picomatch:**
- Finns bara i Jest och ESLint – utvecklingsverktyg.
- Sökmönstren skrivs av oss, inte av kunder.
- npm föreslår att nedgradera Jest 29 → 26. Det vore sämre.
- Beslut: acceptera risken tills Jest uppdateras.

### Vad jag skulle ändra först om jag fick en vecka till
| Ändring | Varför |
|---------|--------|
| Flytta prisberäkningen till TypeScript med strangler fig | ett steg i taget, varje steg kan backas |
| Säker SQL i `jobs/nightly_report.py` | samma rättning som steg 3 i price_calc.py |
| En global felhanterare för async-routes | risk 🔴 i 02-riskbedomning.md (S1/B3) |
| Fler ESLint-regler ur docs/standard.md | t.ex. inga personuppgifter i loggar |
| 404 i stället för 403 för andras beställningar | avslöjar inte vilka id som finns |

**Strangler fig, steg för steg:**
1. Skriv priset i TypeScript i `src/pricing/`.
2. Kör båda och jämför mot karakteriseringstesterna.
3. Låt API:t använda TypeScript.
4. Flytta nattrapporten.
5. Ta bort Python-filen.

Inte nu: nattrapporten importerar Python-filen, och kursen kräver små steg.

### Lärdomar
Alla mina lärdomar står i `Projektens-resa/08-vad-jag-har-lart-mig.md`, ordnade efter steg.
