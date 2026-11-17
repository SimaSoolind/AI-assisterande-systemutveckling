# 🛠 Riggen – säker AI-assisterad utveckling

Mallen för varje nytt Node/TypeScript-projekt. Bygger på mina tre kurser:

| Kurs | Ger riggen |
|------|------------|
| 📗 **Node.js** | Express, PostgreSQL, zod, statuskoder |
| 📕 **SAL** | säkerhet i varje steg: SAST, SCA, DAST, secret scanning, pipeline |
| 📙 **AI** | riggen runt Claude: CLAUDE.md, behörigheter, hooks, plan, sessionslogg, granskning i lager |

**Så använder du mallen:**

- **Steg 0** visar riggens delar, antal och grundmappen.
- **Steg 1** gör du **en gång** när projektet startar.
- **Steg 2** gör du **för varje ny funktion**, hela projektet igenom.
- **Steg 3** visar **vilket test** du använder i **vilken situation**.

---

## Steg 0 – Riggens delar och grundmappen

### 0.1 Hur många av varje? (AI-kursens krav)

| Del | Antal | Var | Föreläsning |
|-----|-------|-----|-------------|
| **CLAUDE.md** | 1 | rotmappen | AI D2-F1 |
| **Behörigheter** allow / ask / deny | 1 fil | `.claude/settings.json` | AI D2-F1 |
| **Subagenter** | **minst 4** – var och en med beskrivning, verktyg och modell | `.claude/agents/` | AI D2-F3 |
| **Skills** (kommandon) | **minst 3**, varav **/tdd** | `.claude/skills/` | AI D2-F4 |
| **Hooks** | **minst 5**, varav **minneskedjan** + en som skyddar testerna | `.claude/hooks/` | AI D2-F5, F7 |
| **Plan** | 1 per funktion | `docs/plan.md` | AI D2-F2 |
| **ADR** (beslut) | **minst 1** – ett per viktigt val | `docs/adr/` | AI D2-F3 |
| **Codemap** | 1 – när jag ändrar gammal kod | `docs/codemap.md` | AI D2-F6 |
| **Sessionslogg** | **1 efter varje arbetspass** | `sessions/` | AI D2-F2 |
| Ingen riktig kunddata | 0 – aldrig i kod, instruktioner eller loggar | – | AI D2, SAL F6 |

⚠️ **I AI-kursens projekt** ska `docs/` och `sessions/` finnas i repot – det är det läraren bedömer.
I andra projekt kan de vara privata i `.gitignore`.

### 0.2 Grundmappen

```
mitt-projekt/
├── CLAUDE.md                      regler för AI:n
├── .claude/
│   ├── settings.json              behörigheter + hooks
│   ├── agents/                    subagenter (minst 4)
│   │   ├── utforskare.md
│   │   ├── planerare.md
│   │   ├── testare.md
│   │   ├── granskare.md
│   │   └── sakerhetsgranskare.md
│   ├── skills/                    kommandon (minst 3)
│   │   ├── tdd/SKILL.md
│   │   ├── granska/SKILL.md
│   │   └── sessionslogg/SKILL.md
│   └── hooks/                     skript som körs automatiskt (minst 5)
│       ├── format-och-typkoll.mjs
│       ├── skydda-tester.mjs
│       ├── stoppa-hemligheter.mjs
│       ├── las-logg.mjs
│       └── spara-logg.mjs
├── docs/
│   ├── krav.md                    user stories + Givet/När/Så
│   ├── api-kontrakt.md            routes, indata, svar, statuskoder
│   ├── plan.md                    planen för det jag gör nu
│   ├── codemap.md                 karta över koden
│   └── adr/
│       └── 001-postgresql.md      ett beslut per fil
├── sessions/
│   └── 2026-11-17.md              en logg per arbetspass
├── src/                           koden
├── tests/                         testerna
├── .github/workflows/ci.yml       pipelinen
├── .gitignore
├── .env.example
├── package.json
├── tsconfig.json
├── eslint.config.js
└── .prettierrc
```

### 0.3 Subagenter – minst 4

**VAD:** en hjälpagent med **ett** jobb. Den startar med tomt minne, får ett uppdrag och lämnar tillbaka en sammanfattning.
**VARFÖR:** huvudagentens minne (kontext) fylls inte med allt läsande. Granskaren kan bara läsa, så den kan inte ändra något. (AI D2-F3)

| Subagent | Jobb | Verktyg | Modell | Varför den modellen |
|----------|------|---------|--------|---------------------|
| **utforskare** | läser koden och svarar på frågor | Read, Grep, Glob | haiku | snabb och billig för att leta |
| **planerare** | gör `docs/plan.md` av ett krav | Read, Grep, Glob, Write | opus | svårast att tänka rätt |
| **testare** | skriver tester först (röda) | Read, Write, Bash | sonnet | mellan – skriver kod |
| **granskare** | granskar diffen mot planen | Read, Grep, Glob | sonnet | bara läsa, kan inte ändra |
| **sakerhetsgranskare** | letar efter säkerhetsfel (5a–5f, STRIDE) | Read, Grep, Glob | sonnet | bara läsa – SAL F4 |

**Exempel – `.claude/agents/sakerhetsgranskare.md`:**

```
---
name: sakerhetsgranskare
description: Granskar ny eller ändrad kod efter säkerhetsfel. Ändrar inga filer.
tools: Read, Grep, Glob
model: sonnet
---
Du är säkerhetsgranskare för ett Node/Express-projekt med PostgreSQL.
Läs filerna i uppdraget och leta efter:
1. SQL som byggs med + eller ${} i stället för $1 (SQL injection).
2. Data från body eller params som inte kontrolleras med zod.
3. Routes som saknar auth-middleware (401) eller admin-middleware (403).
4. user_id eller role som tas från body i stället för token.
5. Svar som kan innehålla password_hash, SQL-fel eller stack trace.
Rapportera varje fynd som: fil, rad, problem, förslag.
Avsluta med en rad: GODKÄNT eller ÅTGÄRDA.
```

| Rad | Betyder |
|-----|---------|
| `name` | namnet jag använder: *"använd subagenten sakerhetsgranskare för att granska src/rooms.ts"* |
| `description` | huvudagenten läser den och väljer själv rätt subagent |
| `tools` | bara läsverktyg → den kan inte ändra filer |
| `model` | haiku = liten · sonnet = mellan · opus = stor |

### 0.4 Skills – minst 3, varav /tdd

**VAD:** ett kommando med ett färdigt arbetssätt. Jag skriver `/tdd` i stället för att förklara allt varje gång.
**VARFÖR:** samma arbetssätt varje gång, och jag behöver inte minnas stegen. (AI D2-F4)

| Skill | Gör |
|-------|-----|
| **/tdd** | test först: rött → kod → grönt → kör alla tester |
| **/granska** | kör `npm run check`, sen granskare + sakerhetsgranskare, sammanfattar |
| **/sessionslogg** | skriver dagens logg i `sessions/` med de fem rubrikerna |

**Exempel – `.claude/skills/tdd/SKILL.md`:**

```
---
name: tdd
description: Arbeta med test först. Använd när ett steg i docs/plan.md ska byggas.
---
1. Läs steget i docs/plan.md och dess "Klart när".
2. Skriv ETT test som visar vad steget ska göra. Kör npm test – testet ska vara rött.
3. Visa det röda testet för mig innan du fortsätter.
4. Skriv den enklaste koden som gör testet grönt. Enkel kod, svenska kommentarer.
5. Kör npm test igen. Alla tester ska vara gröna.
6. Kör npm run lint.
Ta aldrig bort, ändra eller hoppa över ett befintligt test.
Ändra bara filerna som steget gäller.
```

### 0.5 TDD – test först

**VAD:** Test-Driven Development. Testet skrivs **före** koden.
**VARFÖR:** testet är kravet i kod. Ett test som aldrig varit rött vet jag inte om det fungerar. (AI D2-F4)

```
🔴 RÖTT       skriv testet – det misslyckas, för koden finns inte
🟢 GRÖNT      skriv den enklaste koden som gör testet grönt
🔵 SNYGGA TILL gör koden tydligare – testerna ska fortfarande vara gröna
```

**Exempel:** kriteriet *"namnet finns redan → 409"* blir testet *"ger 409 när rummet redan finns"*. Först rött. Sen skriver jag koden. Sen grönt.

### 0.6 Hooks – minst 5 (och minneskedjan)

Se tabellen i **1.9**. Två av dem är **minneskedjan**:

| Hook | Händelse | Gör |
|------|----------|-----|
| `las-logg.mjs` | **SessionStart** | läser senaste filen i `sessions/` och ger den till agenten |
| `spara-logg.mjs` | **PreCompact** + **SessionEnd** | påminner om att skriva loggen innan minnet töms |

**VARFÖR:** agenten minns ingenting. Kedjan gör att varje session **börjar** med förra loggen och **slutar** med en ny. (AI D2-F5, F7)

### 0.7 ADR – ett beslut per fil

**VAD:** Architecture Decision Record. En kort fil om **ett** viktigt val.
**VARFÖR:** om ett halvår vet jag **varför** jag valde så – och vad jag valde bort. Det är vad läraren vill se för VG. (AI D2-F3)

**Exempel – `docs/adr/001-postgresql.md`:**

```
# ADR 001: PostgreSQL i stället för MongoDB

Datum: 2026-11-13
Status: Beslutat

Sammanhang:
Uppgiften föreslår MongoDB. Bokningar har tydliga relationer: användare – bokning – rum.

Beslut:
PostgreSQL med pg och parametriserade frågor. Godkänt av läraren 13/11.

Alternativ jag valde bort:
MongoDB – relationerna och krockkontrollen blir svårare utan JOIN och CHECK.

Följder:
+ CHECK, UNIQUE och FOREIGN KEY skyddar datan även om koden har fel (defense-in-depth).
– Jag måste skriva SQL själv. Prisma kan komma senare.
```

### 0.8 Codemap – karta över koden

**VAD:** en fil som visar **var** saker finns och **hur** de hänger ihop. Används när jag ska ändra kod jag inte skrev själv.
**VARFÖR:** jag och agenten behöver förstå innan något ändras. **En karta som ljuger är farligare än ingen karta** – uppdatera den. (AI D2-F6)

**Exempel – `docs/codemap.md`:**

```
# Codemap – Skär Coworking

Flödet: server.ts → routes/all-routes.ts → routes/room-routes.ts → controllers/room-controller.ts → database

| Fil                          | Ansvar                          | Beror på          |
|------------------------------|---------------------------------|-------------------|
| server.ts                    | startar appen, middleware       | routes/all-routes |
| routes/room-routes.ts        | adresser för /rooms             | room-controller   |
| controllers/room-controller  | SQL och svar för rum            | database          |
| database/database-connection | pool till PostgreSQL            | .env              |

Känsliga delar: auth-middleware (vem är du), admin-middleware (får du).
Okända regler jag hittat: –
Senast kontrollerad: 2026-11-17
```

### 0.9 Sessionslogg – efter varje arbetspass

**VAD:** en kort fil per arbetspass med **fem rubriker**.
**VARFÖR:** *det som inte står i loggen finns inte för nästa session.* Bevis gör loggen till fakta, inte en att göra-lista. (AI D2-F2)

**Mall – `sessions/ÅÅÅÅ-MM-DD.md`:**

```
# Sessionslogg 2026-11-17

Läge:            var jag är nu, i en mening
Fungerade:       vad som blev klart + BEVIS (t.ex. "5/5 tester gröna", commit-id)
Misslyckades:    vad som inte gick och varför
Återstår:        nästa steg, gärna steg-nummer i docs/plan.md
Beslut:          val jag gjorde och varför
```

**Nästa gång** skriver jag bara: *"Läs senaste filen i sessions/ och fortsätt."*

---

## Steg 1 – Starta projektet (en gång)

### 1.1 Mapp, Git och hemligheter

**VAD:** skapa projektet och skydda `.env` innan första commit.
**VARFÖR:** en hemlighet som har hamnat i Git är läckt för alltid, även om du tar bort den sen. (SAL F4, F6)

```
mkdir mitt-projekt
cd mitt-projekt
git init
npm init -y
```

Skapa `.gitignore` **först**:

```
node_modules
.env
dist
*.log
.DS_Store
```

Skapa `.env.example` med påhittade värden (den får finnas på GitHub):

```
DATABASE_URL=postgresql://user:byt-mig@127.0.0.1:5433/mindb
JWT_SECRET=byt-till-en-lång-slumpad-text
```

✅ **Klart när:** `git status` visar INTE `.env`.

### 1.2 Paketen (dependencies)

**VAD:** paketen som appen behöver när den körs.

```
npm install express pg zod dotenv bcrypt jsonwebtoken helmet cors express-rate-limit winston
```

| Paket | Gör | Varför (kurs) |
|-------|-----|---------------|
| `express` | servern och routes | Node F2 |
| `pg` | pratar med PostgreSQL | Node F4 |
| `zod` | kontrollerar användarens data | SAL F4 – whitelisting, fråga 5b |
| `dotenv` | läser `.env` | SAL F4 – hemligheter utanför koden |
| `bcrypt` | hashar lösenord (långsamt med flit) | SAL F6 – aldrig klartext eller SHA-256 |
| `jsonwebtoken` | inloggning med token | Node F6, SAL F5 |
| `helmet` | säkra HTTP-headers | SAL F5 – säker konfiguration |
| `cors` | bara min frontend får anropa | SAL F3 – least privilege |
| `express-rate-limit` | bromsar lösenordsgissning | SAL F2, F3 – DoS och brute force |
| `winston` | strukturerad loggning | SAL F9 – loggning och incidenter |

### 1.3 Utvecklingspaketen (devDependencies)

**VAD:** verktyg som bara behövs när jag kodar och testar. `-D` = följer inte med till servern.

```
npm install -D typescript tsx @types/node @types/express @types/pg @types/bcrypt @types/jsonwebtoken @types/cors
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-security prettier
npm install -D vitest supertest @types/supertest
```

| Paket | Gör | Varför (kurs) |
|-------|-----|---------------|
| `typescript` + `@types/*` | typkontroll | mina egna misstag hittas innan koden körs |
| `tsx` | kör TypeScript direkt | `npm run dev` |
| `eslint` + `typescript-eslint` | hittar fel och dålig kod | AI D2-F5 – kodstandard i verktyg |
| `eslint-plugin-security` | hittar osäker kod | **SAST** – SAL F4 |
| `prettier` | formaterar koden | AI D2-F5 – tar bort en hel klass av kommentarer i granskningen |
| `vitest` | kör testerna | AI D2-F5 – andra lagret i granskningen |
| `supertest` | testar API:t utan Postman | säkerhetstester i Steg 3 |

### 1.4 TypeScript – strikt

**VAD:** `tsconfig.json` med `strict`.
**VARFÖR:** fångar `undefined`, fel typer och glömda fält innan koden körs.

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "target": "esnext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true
  }
}
```

### 1.5 ESLint med säkerhetsregler (SAST)

**VAD:** `eslint.config.js`
**VARFÖR:** verktyget läser koden och larmar på farliga mönster. Det är **SAST** (SAL F4).

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import security from 'eslint-plugin-security';

export default tseslint.config(
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  security.configs.recommended,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
);
```

💡 **Många varningar i ett gammalt projekt?** Sätt reglerna som `"warn"` först. Rätta en regel i taget. Byt till `"error"` när den har 0 fynd.

### 1.6 Kortkommandon i package.json

**VAD:** samma kontroller varje gång, med ett kommando.

```json
"scripts": {
  "dev": "tsx watch server.ts",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "audit": "npm audit --audit-level=high",
  "check": "npm run lint && npm run typecheck && npm test && npm run audit"
}
```

✅ **Klart när:** `npm run check` går igenom utan fel.

### 1.7 Riggen för Claude – CLAUDE.md

**VAD:** projektets regler för AI:n, i en fil i rotmappen.
**VARFÖR:** AI:n minns ingenting mellan sessioner. Det som står i filen följer den varje gång. (AI D2-F1, T2 – Instruktioner som hantverk)

Ta med: syfte, teknikstack, kodregler (enkel kod), säkerhetsfrågorna 5a–5f, mappstrukturen och kommandona (`npm run check`).

Mina globala regler finns redan i `~/.claude/CLAUDE.md`. Projektets fil går före dem.

### 1.8 Behörigheter – allow, ask och deny

**VAD:** `.claude/settings.json` säger vad agenten får göra.
**VARFÖR:** agenten kör kommandon **med mina rättigheter**. En agent har raderat en databas under en kodfrysning. (AI D2-F1, SAL F3 – least privilege)

```json
{
  "permissions": {
    "allow": ["Bash(npm run lint)", "Bash(npm run typecheck)", "Bash(npm test)", "Bash(npm run check)"],
    "ask": ["Bash(npm install:*)", "Bash(git commit:*)", "Bash(git push:*)"],
    "deny": ["Read(./.env)", "Read(./.env.*)", "Bash(rm -rf:*)", "Bash(git push --force:*)"]
  }
}
```

| Lista | Betyder | Exempel |
|-------|---------|---------|
| `allow` | får köras utan att fråga | kontroller som bara läser |
| `ask` | frågar mig först | installera, committa, pusha |
| `deny` | aldrig | läsa `.env`, radera mappar, tvinga push |

### 1.9 Hooks – rökdetektorerna (minst 5)

**VAD:** skript som körs **automatiskt** vid en händelse.
**VARFÖR:** kontrollen körs för att något hände, inte för att någon kom ihåg den. Bra för mitt ADHD-minne. (AI D2-F5, F7)

| # | Hook | Händelse | Gör |
|---|------|----------|-----|
| 1 | `format-och-typkoll.mjs` | `PostToolUse` (Edit/Write) | Prettier + `tsc` efter varje ändrad `.ts`-fil. Fel → kod 2 → agenten rättar |
| 2 | `skydda-tester.mjs` | `PreToolUse` (Edit/Write/Bash) | stoppar agenten om den tar bort tester eller skriver `.skip`/`.only` |
| 3 | `stoppa-hemligheter.mjs` | `PreToolUse` (Edit/Write) | stoppar text som liknar lösenord eller nycklar i koden |
| 4 | `las-logg.mjs` | `SessionStart` | visar senaste sessionsloggen, så att agenten vet var vi slutade |
| 5 | `spara-logg.mjs` | `PreCompact` + `SessionEnd` | påminner om att skriva sessionsloggen (minneskedjan) |

**Kopplingen i `.claude/settings.json`** (samma fil som behörigheterna, nyckeln `hooks`):

```json
"hooks": {
  "PostToolUse": [
    { "matcher": "Edit|Write", "hooks": [{ "type": "command", "command": "node .claude/hooks/format-och-typkoll.mjs" }] }
  ],
  "PreToolUse": [
    { "matcher": "Edit|Write|Bash", "hooks": [{ "type": "command", "command": "node .claude/hooks/skydda-tester.mjs" }] }
  ]
}
```

**Exempel – hook 2, `skydda-tester.mjs`:**

```js
// Stoppar agenten om den försöker ta bort eller hoppa över tester
let input = '';
for await (const part of process.stdin) input += part;

// Allt agenten tänker göra, som text
const plannedChange = JSON.stringify(JSON.parse(input).tool_input ?? {});

// Rör det en testfil, och tar det bort eller stänger av test?
const touchesTest = plannedChange.includes('.test.ts');
const disablesTest = /\.skip\(|\.only\(|rm .*\.test\.ts/.test(plannedChange);

if (touchesTest && disablesTest) {
  process.stderr.write('Stopp: tester får inte tas bort eller hoppas över.');
  process.exit(2); // 2 = agenten får meddelandet och måste ändra sig
}
process.exit(0); // 0 = allt okej
```

**Avslutningskoder:** `0` = okej · `2` = stopp, felet skickas tillbaka till agenten.

### 1.10 Plan, sessionslogg och beslut

**VAD:** tre sorters filer som är minnet i projektet.
**VARFÖR:** det som inte står i en fil finns inte för nästa session. (AI D2-F2)

| Fil | Innehåll |
|-----|----------|
| `docs/plan.md` | mål · steg med `[ ]` · **Klart när** (kontrollerbart) · **Utanför** (det vi inte rör) |
| `sessions/ÅÅÅÅ-MM-DD.md` | läge · fungerade (med bevis) · misslyckades · återstår · beslut |
| `docs/adr/001-namn.md` | ett beslut: vad, varför, vad jag valde bort |

### 1.11 GitHub – säkerhet och pipeline

**VAD:** slå på GitHubs skydd och en pipeline som kör kontrollerna.
**VARFÖR:** kontrollerna körs vid varje push, även när jag glömmer. **Break the build** = kritiskt fel stoppar allt. (SAL F4, F8)

**I repots inställningar** (Settings → Advanced Security / Code security):

| Slå på | Gör | Typ |
|--------|-----|-----|
| Dependabot alerts | varnar för sårbara paket | **SCA** |
| Dependabot security updates | lagar dem automatiskt med en pull request | SCA |
| Secret scanning + push protection | stoppar en push som innehåller en nyckel | **secret scanning** |
| Branch protection på `main` | ändringar via pull request | kodgranskning |

**Pipeline – `.github/workflows/ci.yml`:**

```yaml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run audit
```

### 1.12 SQL-regler (PostgreSQL)

| # | Regel | Exempel | Varför |
|---|-------|---------|--------|
| 1 | **Alltid** `$1`, `$2` | `pool.query('SELECT * FROM rooms WHERE id = $1', [id])` | SQL injection – SAL F4, fråga 5a |
| 2 | Aldrig `+` eller `${}` i SQL | ❌ `'... WHERE id = ' + id` | samma |
| 3 | Regler i databasen också | `NOT NULL`, `UNIQUE`, `CHECK`, `FOREIGN KEY` | defense-in-depth – SAL F3 |
| 4 | Välj kolumner, inte `*`, när svaret går till användaren | `SELECT id, username, role FROM users` | aldrig `password_hash` – fråga 5f |
| 5 | Egen databasanvändare med få rättigheter | inte `postgres` i produktion | least privilege – SAL F3 |
| 6 | `ON DELETE CASCADE` bara där det är meningen | rum tas bort → bokningar tas bort | texten och databasen säger samma sak |
| 7 | Index på kolumner du söker på | `CREATE INDEX ON bookings (room_id, start_time)` | snabbare krockkontroll (prestanda) |
| 8 | Flera ändringar som hör ihop = en transaktion | `BEGIN` … `COMMIT` | inget halvt sparat |
| 9 | Hindra dubbelbokning i databasen | exclusion constraint eller transaktion med lås | två klick samtidigt (VG) |
| 10 | Begränsa listor | `LIMIT 50` | stora svar = långsamt och DoS – SAL F2 |

### 1.13 VS Code – tillägg och hjälpmedel

| Tillägg | Gör | Kurs |
|---------|-----|------|
| **ESLint** | visar SAST-fynd direkt i koden | SAL F4 |
| **Prettier** | formaterar när jag sparar | AI D2-F5 |
| **Error Lens** | felet står på samma rad | ADHD-stöd |
| **SonarQube for IDE** | extra säkerhetsanalys medan jag skriver | SAST – SAL F4 |
| **Svensk kodhjälp** | svenska förklaringar, 🔒-varning, 📖 Manual | mitt eget |
| **Code Spell Checker** | stavning, svenska + engelska | dyslexi-stöd |
| **Docker** | ser containrar och databaser | SAL F7 |
| **Postman** | testar API:t | Node F5 |
| **GitLens** | ser vem som ändrade en rad och varför | AI D2-F2 – spårbar historik |

**Snabbare VS Code (prestanda):**

- Stäng av tillägg du inte använder i projektet (högerklicka → Disable (Workspace)).
- Dölj tunga mappar: `files.exclude` och `files.watcherExclude` för `node_modules`, `dist`, `generated`.
- TypeScript: välj **Use Workspace Version** (samma version som projektet).

---

## Steg 2 – Genom hela projektet

### 2.1 För varje ny funktion (arbetsslingan)

En funktion = **ett litet steg**, t.ex. EN route. (AI D2-F2)

| # | Gör | Vem | Kurs |
|---|-----|-----|------|
| 1 | **Avsikt:** vad ska funktionen göra? Skriv en user story: *Som … vill jag … så att …* | jag | AI D2-F3 |
| 2 | **Säkerhetskrav + STRIDE:** en rad per bokstav | jag | SAL F2 |
| 3 | **Plan** i `docs/plan.md` med Klart när + Utanför | jag + AI | AI D2-F2 |
| 4 | **Test först (rött):** skriv testet som visar vad som ska hända | jag + AI | AI D2-F4 – /tdd |
| 5 | **Kod:** enkel kod, fråga 5a–5f | AI genererar, jag läser | SAL F4 |
| 6 | **Grönt:** `npm test` | kontroller | – |
| 7 | **Granskning i lager:** lint + typer → tester → säkerhet → mot planen → jag | kontroller + jag | AI D2-F5 |
| 8 | **Commit:** vad, varför, AI-stöd, vad granskningen ändrade | jag | AI D2-F2 |
| 9 | **Sessionslogg** | jag + AI | AI D2-F2 |

**STRIDE på 2 minuter** – exempel `POST /bookings`:

| Bokstav | Hot | Skydd |
|---------|-----|-------|
| **S** Spoofing | låtsas vara någon annan | JWT, `auth-middleware` (401) |
| **T** Tampering | ändrar någon annans bokning | ägarkontroll (403) |
| **R** Repudiation | "det var inte jag" | logga vem som bokade |
| **I** Information disclosure | läcker andras uppgifter | välj kolumner, inga SQL-fel till användaren |
| **D** Denial of service | tusentals anrop | rate limit, `limit: '100kb'` |
| **E** Elevation of privilege | User blir Admin | `role` aldrig från body, `admin-middleware` (403) |

**Commit-meddelande – mall:**

```
feat(bookings): POST /bookings med krockkontroll

409 när tiden krockar, 400 vid fel data (zod).
AI-stöd: Claude Code, plan i docs/plan.md steg 2.
Granskat: user_id togs från body – ändrat till token (5d).
```

### 2.2 Ett helt exempel – POST /rooms i Skär Coworking

Samma 9 steg som i tabellen ovan, men med **exakt vad jag skriver**.
Funktionen: admin ska kunna **lägga till ett nytt rum**.

#### Steg 1 – Avsikt: user story

**VAD:** en mening om **vem** som vill **vad** och **varför**, plus kriterier som går att kontrollera.
**VARFÖR:** utan avsikt gissar AI:n. Kriterierna blir sen testerna. (AI D2-F3)
**VAR:** överst i `docs/plan.md`.

**Det här skriver jag:**

```
User story:
Som admin vill jag kunna lägga till ett nytt rum,
så att kunderna kan boka det.

Kriterier (Givet / När / Så):
1. Givet att jag är inloggad som Admin,
   när jag skickar namn, typ och antal personer,
   så sparas rummet och jag får 201 och det nya rummet.
2. Givet att namnet redan finns, så får jag 409.
3. Givet att antal personer är 0 eller typen är fel, så får jag 400.
4. Givet att jag är User, så får jag 403.
5. Givet att jag inte är inloggad, så får jag 401.
```

**RESULTAT:** jag vet exakt vad "klart" betyder. Varje kriterium = ett test i steg 4.

💡 **Dålig avsikt:** "Admin ska kunna hantera rum." → för stort, inget går att kontrollera.

#### Steg 2 – Säkerhetskrav och STRIDE

**VAD:** en rad per bokstav i STRIDE + vilka säkerhetsfrågor (5a–5f) som gäller.
**VARFÖR:** hoten hittas **innan** koden finns. Billigast att rätta nu. (SAL F2 – shift-left)

**Det här skriver jag (under user storyn):**

```
Säkerhet:
S – bara inloggade: auth-middleware → 401
T – bara admin får ändra rum: admin-middleware → 403
R – logga vem som skapade rummet
I – svara bara med id, name, type, capacity
D – limit 100kb på body
E – role kommer från token, aldrig från body
Frågor som gäller: 5a ($1), 5b (zod), 5c (401/403), 5e (try/catch)
```

**RESULTAT:** jag vet vilka skydd koden måste ha. De blir krav i instruktionen i steg 5.

#### Steg 3 – Planen

**VAD:** stegen i ordning, med **Klart när** och **Utanför**.
**VARFÖR:** planen i en fil överlever när chatten rensas. AI:n och jag följer samma karta. (AI D2-F2)

**Det här skriver jag i `docs/plan.md`:**

```
Plan: POST /rooms
- [ ] 1. zod-schema roomSchema i schemas/room-schemas.ts
- [ ] 2. Tester för 201, 400, 401, 403, 409 i tests/rooms.test.ts (röda)
- [ ] 3. createRoom i controllers/room-controller.ts
- [ ] 4. router.post i routes/room-routes.ts med auth → admin → validate

Klart när: alla 5 tester gröna, npm run check utan fel.
Utanför: PUT och DELETE /rooms, bokningar, frontend.
```

**RESULTAT:** ett steg i taget. Jag ser alltid var jag är.

#### Steg 4 – Test först (rött)

**VAD:** testerna skrivs **innan** koden. De ska vara **röda**.
**VARFÖR:** ett test som aldrig varit rött vet jag inte om det fungerar. Testet är kriteriet från steg 1 i kod. (AI D2-F4 – /tdd)

**Det här skriver jag till Claude:**

```
Skriv tester i tests/rooms.test.ts för POST /rooms med Vitest och Supertest.
Ett test per kriterium i docs/plan.md: 201, 400, 401, 403, 409.
Skriv bara testerna, ingen kod i controllern ännu.
Kör npm test och visa att de är röda.
```

**RESULTAT:** 5 röda tester. Nu vet jag exakt vad koden ska klara.

#### Steg 5 – Kod: instruktionen till AI:n

**VAD:** en skarp instruktion med AI-kursens **sex byggstenar**:
roll · uppgift · kontext · format · exempel · begränsningar.
**VARFÖR:** den byggsten som saknas är den som skapar felet. **Kontext** och **begränsningar** saknas oftast. Början och slutet läses bäst – därför står begränsningarna sist. (AI F2 – Anatomin: sex byggstenar, D2-F2)

**❌ Dålig instruktion:**

```
Gör POST /rooms.
```

AI:n måste gissa fil, regler, säkerhet och stil. Den kan ta `role` från body, glömma zod eller skriva avancerad kod.

**✅ Bra instruktion – det här skriver jag:**

```
Roll: Du hjälper en student som lär sig Node.js. Koden ska vara enkel och lätt att läsa.

Uppgift: Skriv createRoom i controllers/room-controller.ts och koppla den i
routes/room-routes.ts, så att de röda testerna i tests/rooms.test.ts blir gröna.

Kontext:
- Steg 3 och 4 i docs/plan.md. Följ mönstret i getRooms i samma fil.
- Tabellen rooms: name (UNIQUE), type ('workspace' eller 'conference'), capacity (minst 1).
- roomSchema finns i schemas/room-schemas.ts.
- Ordningen i routen: authMiddleware → adminMiddleware → validate(roomSchema) → createRoom.

Format: pilfunktion, en kort svensk kommentar ovanför varje rad, ingen destrukturering.

Exempel på rätt SQL:
pool.query('INSERT INTO rooms (name, type, capacity) VALUES ($1, $2, $3) RETURNING id, name, type, capacity', [...])

Begränsningar:
- Bara $1, $2, $3 i SQL – aldrig + eller ${}.
- Namnet finns redan (felkod 23505) → 409 "Det finns redan ett rum med det namnet."
- Andra fel → skicka vidare till error-handler, visa aldrig SQL-felet.
- Ändra inga andra filer. Ta inte bort eller ändra några tester.
- Kör npm test och npm run lint och rapportera resultatet.
```

**RESULTAT:** AI:n vet **var**, **hur** och **vad den inte får göra**. Den kan kontrollera sig själv med testerna.

| Byggsten | I exemplet |
|----------|------------|
| Roll | student, enkel kod |
| Uppgift | createRoom + koppla routen, testerna gröna |
| Kontext | planen, mönstret i getRooms, tabellens regler, middleware-ordningen |
| Format | pilfunktion, svenska kommentarer |
| Exempel | rätt SQL med $1 |
| Begränsningar | säkerhet, felkoder, rör inga andra filer, rör inga tester |

#### Steg 6 – Grönt

**VAD:** kör testerna själv.
**Det här skriver jag i terminalen:**

```
npm test
```

**RESULTAT:** 5 gröna. Är något rött → tillbaka till steg 5 med felmeddelandet: *"Testet för 409 är rött: [klistra in felet]. Rätta bara det."*

#### Steg 7 – Granskning i lager

**VAD:** billigast först, jag sist.
**VARFÖR:** verktygen tar de enkla felen. Jag behöver bara läsa det de inte kan se. (AI D2-F5)

```
npm run check
```

**Sen läser jag koden själv och frågar mig:**

| Fråga | Ja? |
|-------|-----|
| Står det `$1`, `$2`, `$3` i SQL? | 5a |
| Kommer `role` från token, inte body? | 5c, 5d |
| Svarar den utan `password_hash` och utan SQL-fel? | 5e, 5f |
| Kan jag förklara **varje rad** högt? | jag är grinden |

**RESULTAT:** jag vet att koden är säker **och** jag förstår den.

#### Steg 8 – Commit

**Det här skriver jag:**

```
git add .
git commit -m "feat(rooms): POST /rooms för admin

201 vid nytt rum, 409 om namnet finns, 400 vid fel data (zod), 401/403 via middleware.
AI-stöd: Claude Code, plan i docs/plan.md.
Granskat: ändrade SELECT * till bara id, name, type, capacity i RETURNING."
```

**RESULTAT:** om ett halvår kan jag se **vad**, **varför** och **vad jag ändrade** i granskningen.

#### Steg 9 – Sessionslogg

**VAR:** `sessions/2026-11-17.md`

```
Läge: POST /rooms klar och committad.
Fungerade: 5/5 tester gröna, npm run check utan fel (bevis: terminalen 14:32).
Misslyckades: första versionen tog SELECT * – rättat i granskningen.
Återstår: PUT /rooms/:id (plan steg 5).
Beslut: namnkrock ger 409 via felkod 23505, inte en extra SELECT först.
```

**RESULTAT:** nästa gång säger jag till Claude: *"Läs sessions/2026-11-17.md och fortsätt."* Jag behöver inte minnas något själv.

### 2.3 Säkerhet i varje fas av projektet (SAL-livscykeln)

| Fas | Gör i projektet | Verktyg | SAL |
|-----|-----------------|---------|-----|
| **Planering** | säkerhetskrav, vilka data appen sparar (dataminimering) | `docs/` | F1, F6 |
| **Design** | ER-diagram, dataflöde, STRIDE, riskmatris | dbdiagram, Figma | F2, F3 |
| **Utveckling** | fråga 5a–5f, enkel kod, hooks | ESLint security, Prettier, tsc | F4 |
| **Test** | Steg 3: enhet, API, säkerhet, DAST | Vitest, Supertest, ZAP | F5 |
| **Leverans** | pipeline med break the build, Docker som icke-root | GitHub Actions, Trivy | F7, F8 |
| **Drift** | logga inloggningar, aldrig lösenord i loggar | winston | F9 |
| **Incident** | vad gör jag om något läcker? post mortem, GDPR 72 h | sessionslogg, `docs/` | F9 |

### 2.4 Före inlämning eller deploy

- [ ] `npm run check` grönt
- [ ] `npm audit` – inga höga eller kritiska
- [ ] `git status` – ingen `.env`
- [ ] Dependabot och secret scanning påslaget
- [ ] Säkerhetstesterna i Steg 3 gröna
- [ ] SAL-handboken → Snabbreferens → **Säkerhetschecklista för en Node/Express-app** genomgången
- [ ] README: hur man startar, vilka säkerhetsval jag gjorde
- [ ] Sessionsloggen skriven

---

## Steg 3 – Vilket test i vilken situation?

### 3.1 Översikt

| Situation | Test | Verktyg | Kurs |
|-----------|------|---------|------|
| Ren logik utan databas (krock-regeln, ett zod-schema) | **Enhetstest** | Vitest | AI D2-F4 |
| En route från anrop till svar | **API-test** (integrationstest) | Vitest + Supertest | Node F5 |
| Vem får göra vad (401, 403, IDOR) | **Säkerhetstest** | Supertest | SAL F2, F3 |
| Jag hittade en bugg | **Regressionstest** – skriv testet först, sen rättar jag | Vitest | AI D2-F4 |
| Gammal kod jag ska ändra | **Karakteriseringstest** – låser hur koden gör i dag | Vitest | AI D2-F6 |
| Osäkra mönster i koden | **SAST** | ESLint security, SonarQube | SAL F4 |
| Sårbara paket | **SCA** | `npm audit`, Dependabot | SAL F4 |
| Nycklar i koden | **Secret scanning** | GitHub, gitleaks | SAL F4, F8 |
| Appen medan den körs | **DAST** | OWASP ZAP (baseline) | SAL F5 |
| Konstiga och slumpade indata | **Fuzzing** | (valfritt, VG) | SAL F5 |
| Hur sidan fungerar för alla | **Tillgänglighet** | Lighthouse, tangentbord | WCAG |
| Att API:t svarar rätt för hand | **Manuellt test** | Postman | Node F5 |

### 3.2 Säkerhetstesterna jag alltid har

| # | Test | Förväntat svar | Skyddar mot |
|---|------|----------------|-------------|
| 1 | Anrop **utan token** till skyddad route | **401** | Spoofing |
| 2 | **User** anropar admin-route | **403** | Elevation of privilege |
| 3 | User ändrar **någon annans** bokning | **403** | IDOR (Tampering) |
| 4 | Skickar `"role": "Admin"` vid registrering | användaren blir ändå **User** | mass assignment |
| 5 | Skickar `' OR 1=1 --` som id | **400** (zod), inget SQL-fel i svaret | SQL injection |
| 6 | Svar från `/users` eller `/login` | innehåller aldrig `password_hash` | Information disclosure |
| 7 | Fel lösenord och okänt namn | **samma** felmeddelande | användarnamn läcker inte |
| 8 | 20 inloggningar i rad | **429** | brute force (rate limit) |
| 9 | Jättestor body | **413** | DoS |
| 10 | Bokar tid som krockar | **409** | dubbelbokning |

**Exempel – test 3 (IDOR) med Supertest:**

```ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('DELETE /bookings/:id', () => {
  it('ger 403 när en User försöker ta bort någon annans bokning', async () => {
    // annaToken = inloggad som anna. Bokning 1 tillhör sima.
    const response = await request(app)
      .delete('/bookings/1')
      .set('Authorization', `Bearer ${annaToken}`);

    expect(response.status).toBe(403);
  });
});
```

### 3.3 Test-regler

- **Ett test = en sak.** Namnet säger vad som ska hända: *"ger 403 när …"*.
- **Testdatabas**, aldrig riktig data i tester. (AI-kursen: ingen kunddata i kod eller loggar)
- **Rött först**, sen grönt. Ett test som aldrig har varit rött vet jag inte om det fungerar.
- **Tester tas aldrig bort för att bli gröna.** Hook 2 stoppar det.

---

<!-- MIN-RIGG-START -->
## Steg 4 – Min rigg (mina egna filer)

Hämtad från `~/projekt/ovningsprojekt` den 2026-11-16.
Det här är **min** rigg, som jag har byggt själv. Den växer för varje del.

### 4.1 Status

| Del | Krav | Jag har | Status |
|-----|------|---------|--------|
| CLAUDE.md | finns i rotmappen | 0 | ❌ 0 av 1 |
| Subagenter | minst 4 | 4 | ✅ |
| Skills | minst 3, varav /tdd | 3 | ✅ |
| Hooks (filer) | minst 5 | 5 | ✅ |
| Hooks kopplade | i settings.json | 5 | ✅ |
| ADR | minst 1 | 0 | ❌ 0 av 1 |
| Plan | docs/plan.md | 0 | ❌ 0 av 1 |
| Codemap | docs/codemap.md | 0 | ❌ 0 av 1 |
| Sessionsloggar | efter varje pass | 1 | ✅ |
| /tdd | måste finnas | ja | ✅ |

### 4.2 CLAUDE.md

*Inte skriven än – se 1.7.*

### 4.3 Behörigheter och hooks – settings.json

**`.claude/settings.json`**

````json
{
  "permissions": {
    "allow": ["Bash(npm test)", "Bash(npm run lint)", "Bash(git status)", "Bash(git diff:*)"],
    "ask": ["Bash(git commit:*)", "Bash(git push:*)", "Bash(npm install:*)"],
    "deny": ["Read(./.env)", "Bash(rm -rf:*)", "Bash(git push --force:*)"]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/skydda-tester.mjs\""
          },
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/stoppa-hemligheter.mjs\""
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/format-och-kontroll.mjs\""
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/las-logg.mjs\""
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/skriv-logg.mjs\""
          }
        ]
      }
    ]
  }
}
````

### 4.4 Subagenter (4 st)

**`.claude/agents/granskare.md`**

````md
---
name: granskare
description: Granskar en ändring mot docs/plan.md och docs/standard.md. Ändrar inget.
tools: Read, Grep, Glob
model: sonnet
maxTurns: 10
---
Du granskar en ändring i projektet ovningsprojekt (butikens API).
Läs docs/plan.md, docs/standard.md och de filer som ändrats.

Kontrollera:
1. Gör ändringen det som steget i planen säger, och inget mer?
2. Följer koden docs/standard.md? Till exempel: Result i tjänstelagret,
   felsvar i formen { error: { code, message } }, parametriserad SQL.
3. Finns ett test för varje acceptanskriterium?
4. Har något test tagits bort eller stängts av?

Svara med en lista. Varje punkt: fil, rad, problem, förslag.
Märk varje punkt 🔴 måste rättas, 🟡 bör rättas eller 🟢 bra att veta.
Skriv "inga fynd" om allt är bra. Gissa inte.
````

**`.claude/agents/sakerhetsgranskare.md`**

````md
---
name: sakerhetsgranskare
description: Letar säkerhetsbrister: SQL byggd av text, hemligheter i koden och saknad behörighetskontroll. Ändrar inget.
tools: Read, Grep, Glob
model: opus
maxTurns: 10
---
Du granskar säkerheten i projektet ovningsprojekt (butikens API).
Läs aldrig .env.

Leta efter:
1. SQL som byggs av text: ${} eller + i db.query, och % i Python-koden.
2. Hemligheter i koden: lösenord, nycklar, anslutningsadresser.
3. Saknad behörighetskontroll: en route utan requireCustomer, eller
   en tjänst som inte kontrollerar att resursen är kundens egen.
4. Felsvar som visar interna detaljer.

Svara med en lista. Varje punkt: fil, rad, risk, hur den rättas.
Märk 🔴 hög, 🟡 medel eller 🟢 låg risk och skriv vilken punkt i
OWASP Top 10 det gäller. Gissa inte. Skriv "inga fynd" om allt är bra.
````

**`.claude/agents/testskrivare.md`**

````md
---
name: testskrivare
description: Skriver Jest-tester ur acceptanskriterier (Givet/När/Så). Rör inte src/.
tools: Read, Grep, Glob, Edit, Write, Bash
model: sonnet
maxTurns: 10
---
Du skriver tester i projektet ovningsprojekt (butikens API).
Uppdraget innehåller acceptanskriterier i formen Givet/När/Så.

Regler:
1. Ett test per acceptanskriterium. Testets namn säger vilket kriterium det gäller.
2. Följ mönstret i tests/orders.test.ts (Jest och supertest).
3. Skriv bara i tests/. Ändra aldrig något i src/.
4. Ta aldrig bort och stäng aldrig av ett befintligt test.
5. Kör npm test och visa resultatet. Nya tester får vara röda.
   Går testerna inte att köra: stanna och säg att databasen ska startas
   med npm run db:up.
````

**`.claude/agents/utforskare.md`**

````md
---
name: utforskare
description: Hittar var saker finns i koden och sammanfattar. Ändrar inget.
tools: Read, Grep, Glob
model: haiku
maxTurns: 10
---
Du utforskar koden i projektet ovningsprojekt (butikens API).
Uppdraget säger vad som söks och varför.
Sök brett: src/, tests/, jobs/, scripts/ och db/.

Svara med högst tio rader: fil, rad, vad stället gör,
och hur det hänger ihop med syftet.
Gissa inte. Skriv "hittade inte" om något saknas.
````

### 4.5 Skills (3 st)

**`.claude/skills/codemap/SKILL.md`**

````md
---
name: codemap
description: Skriver eller uppdaterar docs/codemap.md, en karta över filerna i src/, jobs/ och db/. Anrop: /codemap
---
Uppdatera docs/codemap.md så att den stämmer med koden just nu.

1. Lista filerna i src/, jobs/, scripts/ och db/. Läs aldrig .env.
2. Skriv en rad per fil: sökväg, vad filen gör (en mening),
   och vilka andra filer den anropar.
3. Rita flödet för en förfrågan som en kort lista:
   route → middleware → service → db.ts → databas.
4. Märk filer som är äldre kod (src/legacy/, jobs/) med "äldre".
5. Ändra bara docs/codemap.md. Ändra ingen kod.
6. Visa diffen och vänta på min granskning. Gör ingen commit.
````

**`.claude/skills/logg/SKILL.md`**

````md
---
name: logg
description: Skriver ett utkast till sessionslogg i sessions/ med de sex rubrikerna. Anrop: /logg <passnummer>
---
Skriv ett utkast till sessions/pass-$ARGUMENTS.md.

1. Läs den senaste sessionsloggen i sessions/ och git log sedan dess.
2. Använd exakt de här rubrikerna:
   ## Läge
   ## Fungerade (med bevis)
   ## Misslyckades
   ## Återstår
   ## Beslut
   ## Förbrukning
3. Bevis är en commit, en testkörning eller en fil. Skriv commit-id.
4. Under Förbrukning: lämna tokens och tid tomma. Jag fyller i dem från /usage.
5. Inga kunduppgifter, inga lösenord, inget från .env.
6. Det är ett utkast. Gör ingen commit. Jag läser och rättar först.
````

**`.claude/skills/tdd/SKILL.md`**

````md
---
name: tdd
description: Ett steg ur docs/plan.md med test först. Anrop: /tdd <steg>
---
Du ska genomföra följande steg ur planen: $ARGUMENTS

Arbeta i den här ordningen och hoppa inte över något:

1. Läs docs/plan.md och hitta steget. Läs docs/standard.md och koden som berörs.
2. Skriv ETT nytt test i tests/ för det nya beteendet. Följ mönstret i
   tests/orders.test.ts. Rör inte src/.
3. Kör npm test och visa att det nya testet är rött. Är det grönt: stanna.
   Går testerna inte att köra: stanna och säg att databasen ska startas
   med npm run db:up.
4. Gör den minsta ändring i src/ som får testet grönt. Regler och kontroller
   hör hemma i src/services/ och returnerar Result.
5. Kör npm test, npm run typecheck och npm run lint. Allt ska vara grönt.
6. Ta aldrig bort och stäng aldrig av ett test.
7. Visa diffen och vänta på min granskning. Gör ingen commit.
````

### 4.6 Hooks (5 st)

**`.claude/hooks/format-och-kontroll.mjs`**

````js
// Hämtar verktyget som kör program i terminalen
import child_process from "node:child_process";
// Hämtar process, som har stdin, stderr och exit
import process from "node:process";

// Läser informationen som Claude Code skickar till hooken
let indata = "";
for await (const del of process.stdin) indata += del;

// En tom låda för objektet
let anrop;
// Försök göra om texten till ett objekt. Trasig text: avsluta tyst
try {
  anrop = JSON.parse(indata);
} catch {
  process.exit(0);
}

// Uppgifterna om ändringen. Saknas de? Avsluta tyst
const andring = anrop.tool_input;
if (andring === undefined) process.exit(0);

// Vilken fil ändrade Claude?
const fil = andring.file_path;
// Saknas filnamnet, eller är det ingen TypeScript-fil? Då kontrollerar vi inget
if (fil === undefined || !fil.endsWith(".ts")) process.exit(0);

// Försök köra de tre verktygen, ett i taget
try {
  // 1. Prettier formaterar filen: indrag, citattecken, semikolon
  child_process.execFileSync("npx", ["prettier", "--write", fil], { stdio: "pipe" });
  // 2. tsc kontrollerar typerna i hela projektet
  child_process.execFileSync("npx", ["tsc", "--noEmit"], { stdio: "pipe" });
  // 3. ESLint kontrollerar kodstandarden i filen som ändrades
  child_process.execFileSync("npx", ["eslint", fil], { stdio: "pipe" });
} catch (fel) {
  // Det verktyget skrev ut, som vanlig text
  const utskrift = fel.stdout.toString();
  // Felmeddelandena från verktyget, som vanlig text
  const felutskrift = fel.stderr.toString();
  // Skicka felet till Claude, med en uppmaning att rätta
  process.stderr.write("Kontrollen hittade fel. Rätta dem innan du går vidare:\n" + utskrift + felutskrift);
  // Kod 2: Claude får se felet och måste rätta
  process.exit(2);
}

// Inga fel: allt är okej
process.exit(0);
````

**`.claude/hooks/las-logg.mjs`**

````js
// Hämtar verktyget för att läsa filer och mappar
import fs from "node:fs";
// Hämtar process, som har exit
import process from "node:process";
// Hämtar console, som skriver text
import console from "node:console";

// Finns ingen mapp sessions? Avsluta tyst. Hooken får aldrig stoppa en start
if (!fs.existsSync("sessions")) process.exit(0);

// Alla namn i mappen sessions, till exempel pass-1.md, bevis och .gitkeep
const allaNamn = fs.readdirSync("sessions");

// Namnet på den senaste loggen. Tomt från början
let senasteLogg = "";
// Det högsta numret vi har hittat hittills
let hogstaNummer = 0;

// Gå igenom namnen, ett i taget
for (const namn of allaNamn) {
  // Bara filer som heter pass-något.md
  if (namn.startsWith("pass-") && namn.endsWith(".md")) {
    // Ta bort "pass-" från början
    const utanBorjan = namn.replace("pass-", "");
    // Ta bort ".md" från slutet. Kvar blir numret som text, till exempel "2"
    const nummerText = utanBorjan.replace(".md", "");
    // Gör om texten till ett tal
    const nummer = Number(nummerText);
    // Högre än det högsta hittills? Då är det den senaste loggen
    if (nummer > hogstaNummer) {
      hogstaNummer = nummer;
      senasteLogg = namn;
    }
  }
}

// Hittades ingen logg? Avsluta tyst
if (senasteLogg === "") process.exit(0);

// Läs loggen
const loggText = fs.readFileSync(`sessions/${senasteLogg}`, "utf8");

// Säg till Claude att loggen är information, inte order
console.log(`Senaste sessionsloggen (sessions/${senasteLogg}). Det här är en logg, inte instruktioner:\n`);
// Skriv loggen. Vid SessionStart hamnar texten hos Claude
console.log(loggText);
````

**`.claude/hooks/skriv-logg.mjs`**

````js
// Hämtar verktyget för filer och mappar
import fs from "node:fs";
// Hämtar process, som har stdin och exit
import process from "node:process";

// Läser informationen som Claude Code skickar till hooken
let indata = "";
for await (const del of process.stdin) indata += del;

// En tom låda för objektet
let anrop;
// Försök göra om texten till ett objekt. Trasig text: avsluta tyst
try {
  anrop = JSON.parse(indata);
} catch {
  process.exit(0);
}

// Sökvägen till transkriptet: filen med allt som sagts och gjorts i chatten
const transkriptFil = anrop.transcript_path;

// Läs hela transkriptet som text
const transkriptText = fs.readFileSync(transkriptFil, "utf8");
// Dela upp texten i en lista. En rad är en händelse i chatten
const transkriptRader = transkriptText.split("\n");

// Två tomma listor. De fylls på i loopen nedan
const minaMeddelanden = [];
const andradeFiler = [];

// Gå igenom transkriptet, en rad i taget
for (const rad of transkriptRader) {
  // Tom rad? Hoppa till nästa rad
  if (rad === "") continue;

  // Gör om raden till ett objekt
  const handelse = JSON.parse(rad);

  // Är händelsen ett meddelande från mig?
  if (handelse.type === "user") {
    // Texten i meddelandet
    const meddelande = handelse.message.content;

    // Bara vanlig text, och inte en systemrad som börjar med <
    if (typeof meddelande === "string" && !meddelande.startsWith("<")) {
      // Dela upp meddelandet i rader
      const meddelandeRader = meddelande.split("\n");
      // Ta första raden
      const forstaRaden = meddelandeRader[0];
      // Högst 100 tecken
      const kortRad = forstaRaden.slice(0, 100);
      // Lägg till i listan
      minaMeddelanden.push("- " + kortRad);
    }
  }

  // Är händelsen ett svar från Claude?
  if (handelse.type === "assistant") {
    // Ett svar har flera delar. Gå igenom dem en i taget
    for (const svarsdel of handelse.message.content) {
      // Ändrade eller skrev Claude en fil?
      if (svarsdel.name === "Edit" || svarsdel.name === "Write") {
        // Filens namn
        const filnamn = "- " + svarsdel.input.file_path;
        // Lägg bara till filen om den inte redan finns i listan
        if (!andradeFiler.includes(filnamn)) andradeFiler.push(filnamn);
      }
    }
  }
}

// Alla namn i mappen sessions, till exempel pass-1.md, bevis och .gitkeep
const allaNamn = fs.readdirSync("sessions");
// Räknare för hur många loggar som finns
let antalLoggar = 0;
// Gå igenom namnen, ett i taget
for (const namn of allaNamn) {
  // Räkna bara filer som börjar med pass- och slutar med .md
  if (namn.startsWith("pass-") && namn.endsWith(".md")) {
    antalLoggar = antalLoggar + 1;
  }
}

// Nästa nummer: antal loggar plus 1
const nummer = antalLoggar + 1;
// Namnet på den nya loggen
const loggFil = `sessions/pass-${nummer}.md`;

// Finns filen redan? Skriv inte över den. Din egen logg ska aldrig försvinna
if (fs.existsSync(loggFil)) process.exit(0);

// En tom lista. Varje rad i loggen läggs till här, en i taget
const loggRader = [];
// Rubriken överst
loggRader.push(`# Pass ${nummer} (utkast från hooken)`);
// Vad jag bad om
loggRader.push("## Du bad om");
for (const meddelande of minaMeddelanden) {
  loggRader.push(meddelande);
}
// Vilka filer Claude ändrade
loggRader.push("## Ändrade filer");
for (const filnamn of andradeFiler) {
  loggRader.push(filnamn);
}
// De sex rubrikerna som jag fyller i själv
loggRader.push("## Läge");
loggRader.push("## Fungerade (med bevis)");
loggRader.push("## Misslyckades");
loggRader.push("## Återstår");
loggRader.push("## Beslut");
loggRader.push("## Förbrukning");

// Sätt ihop alla rader till en text, med en tom rad emellan
const loggText = loggRader.join("\n\n");
// Skriv loggen till sessions/
fs.writeFileSync(loggFil, loggText);
````

**`.claude/hooks/skydda-tester.mjs`**

````js
// Hämtar verktyget för att läsa filer
import fs from "node:fs";
// Hämtar process, som har stdin, stderr och exit
import process from "node:process";

// Läser informationen som Claude Code skickar till hooken
let indata = "";
for await (const del of process.stdin) indata += del;

// En tom låda för objektet
let anrop;
// Försök göra om texten till ett objekt. Trasig text: släpp igenom
try {
  anrop = JSON.parse(indata);
} catch {
  process.exit(0);
}

// Uppgifterna om ändringen. Saknas de? Släpp igenom
const andring = anrop.tool_input;
if (andring === undefined) process.exit(0);

// Vilken fil vill Claude ändra?
const fil = andring.file_path;
// Saknas filnamnet, eller ligger filen utanför tests/? Släpp igenom
if (fil === undefined || !fil.includes("tests/")) process.exit(0);

// Räknar hur många tester en text innehåller
const raknaTester = (text) => {
  // Räknaren börjar på 0
  let antal = 0;
  // Dela upp texten i rader
  const rader = text.split("\n");
  // Gå igenom raderna, en i taget
  for (const rad of rader) {
    // Ta bort mellanslag i början och slutet av raden
    const rensadRad = rad.trim();
    // Börjar raden med it( eller test(? Då är det ett test
    if (rensadRad.startsWith("it(") || rensadRad.startsWith("test(")) {
      antal = antal + 1;
    }
  }
  // Skicka tillbaka antalet
  return antal;
};

// Texten före ändringen. Tom från början
let fore = "";
// Edit skickar bara den del som byts ut, i old_string
if (andring.old_string !== undefined) {
  fore = andring.old_string;
} else if (fs.existsSync(fil)) {
  // Write byter hela filen. Då läser vi hela filen som den ser ut nu
  fore = fs.readFileSync(fil, "utf8");
}

// Texten efter ändringen. Tom från början
let efter = "";
// Edit skickar den nya delen i new_string
if (andring.new_string !== undefined) {
  efter = andring.new_string;
} else if (andring.content !== undefined) {
  // Write skickar hela den nya filen i content
  efter = andring.content;
}

// Gå igenom den nya texten, en rad i taget
for (const rad of efter.split("\n")) {
  // Ta bort mellanslag i början och slutet av raden
  const rensadRad = rad.trim();
  // Stänger raden av ett test?
  const stangerAv =
    rensadRad.includes(".skip(") ||
    rensadRad.includes(".only(") ||
    rensadRad.startsWith("xit(") ||
    rensadRad.startsWith("xdescribe(");
  // Ja? Stoppa ändringen
  if (stangerAv) {
    process.stderr.write("Stoppad: ett test får inte stängas av (skip, only, xit). Se docs/standard.md.\n");
    process.exit(2);
  }
}

// Färre tester efter ändringen än före? Då har ett test tagits bort. Stoppa
if (raknaTester(efter) < raknaTester(fore)) {
  process.stderr.write("Stoppad: ändringen tar bort ett test. Föreslå ändringen i text i stället.\n");
  process.exit(2);
}

// Inget fel hittades: släpp igenom ändringen
process.exit(0);
````

**`.claude/hooks/stoppa-hemligheter.mjs`**

````js
// Hämtar process, som har stdin, stderr och exit
import process from "node:process";

// Läser informationen som Claude Code skickar till hooken
let indata = "";
for await (const del of process.stdin) indata += del;

// En tom låda för objektet
let anrop;
// Försök göra om texten till ett objekt. Trasig text: släpp igenom
try {
  anrop = JSON.parse(indata);
} catch {
  process.exit(0);
}

// Uppgifterna om ändringen. Saknas de? Släpp igenom
const andring = anrop.tool_input;
if (andring === undefined) process.exit(0);

// Vilken fil vill Claude ändra? Tom text om den saknas
let fil = "";
if (andring.file_path !== undefined) fil = andring.file_path;

// Vill Claude ändra en .env-fil? Stoppa. Där ligger hemligheterna
if (fil.endsWith(".env")) {
  process.stderr.write("Stoppad: .env får inte ändras av agenten. Sima ändrar .env själv.\n");
  process.exit(2);
}

// Den nya texten. Tom från början
let nyText = "";
// Edit skickar den nya delen i new_string
if (andring.new_string !== undefined) {
  nyText = andring.new_string;
} else if (andring.content !== undefined) {
  // Write skickar hela den nya filen i content
  nyText = andring.content;
}

// Början på vanliga hemligheter
const hemligheter = [
  "-----BEGIN", // privat nyckel
  "AKIA", // nyckel till Amazon (AWS)
  "ghp_", // nyckel till GitHub
  "sk-ant-", // nyckel till Anthropic
  "sk-proj-", // nyckel till OpenAI
];

// Gå igenom hemligheterna, en i taget
for (const hemlighet of hemligheter) {
  // Finns den i den nya texten? Stoppa
  if (nyText.includes(hemlighet)) {
    process.stderr.write(
      "Stoppad: texten ser ut att innehålla en hemlighet (" + hemlighet + "). " +
      "Lägg hemligheter i .env och läs dem med process.env.\n"
    );
    process.exit(2);
  }
}

// Ingen hemlighet hittades: släpp igenom
process.exit(0);
````

### 4.7 ADR (0 st)

*Ingen ADR än – se 0.7.*

### 4.8 Senaste sessionsloggen

**`sessions/pass-1.md`**

````md
# Pass 1 – 16 nov 2026

## Läge
Riggen har behörigheter och skillen /tdd.

## Fungerade (med bevis)
- .claude/settings.json med allow, ask och deny. Commit eed4d99.
- deny stoppade `rm -rf` när Claude försökte radera .venv.
- /tdd syns när jag skriver / i Claude Code.

## Misslyckades
- Jag bytte namn på projektmappen. .venv och Docker slutade fungera.
  Jag bytte tillbaka till ovningsprojekt och byggde om .venv.

## Återstår
- Två skills till, till exempel /codemap och /logg.
- Port 5433 används av hotell-solsidan-db.

## Beslut
- Kursmaterialet ligger i AI-utveckling/ och står i .gitignore.

## Förbrukning
- Tokens: 5 013 222 totalt, varav 15 479 output (bara ovningsprojekt, 16 nov)
- /usage: sessionen 30 %, veckan 7 %
- Tid: ca 1 tim 50 min
````

<!-- MIN-RIGG-SLUT -->

---

## Snabbkoll – mina kommandon

| Kommando | Gör |
|----------|-----|
| `npm run dev` | startar servern |
| `npm run check` | lint + typer + tester + audit – allt på en gång |
| `npm test` | bara testerna |
| `npm audit` | sårbara paket (SCA) |
| `git status` | vad som kommer med i commit – leta efter `.env` |
