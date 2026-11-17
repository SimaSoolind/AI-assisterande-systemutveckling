# Analys: src/legacy/price_calc.py

Arbete 3, steg 1. Gjord 2026-11-17 enligt avsnitt F i Riggen-steg-för-steg. Ingen kod ändrad.
Varje påstående är märkt **[kod]** (står i koden) eller **[antagande]** (tror, men kan inte läsas ut).

## 0. Vem anropar filen (Grep efter `calc_price` och `price_calc`)

| Väg in | Fil:rad | Hur | Märkning |
|--------|---------|-----|----------|
| API:t `GET /orders/:id/price` | src/pricing/legacyPrice.ts:7–12 | Startar `python3 price_calc.py <id>` som egen process (`execFile`) och läser JSON från stdout | [kod] |
| Nattrapporten | jobs/nightly_report.py:3–4, 12 | `import` av `calc_price` och `conn`, anropar för varje betald order samma dag | [kod] |
| Routen före bryggan | src/routes/orders.ts:33–45 | Kollar ägare med `getOrder` innan `calcPrice` anropas | [kod] |

Inga andra träffar i `src/`, `jobs/`, `scripts/`, `tests/` eller `package.json`. [kod]

## 1. Syfte

Räknar netto, moms och totalpris för en order, med rabattkod om ordern har en. [kod]

## 2. In och ut

**In**

| Väg | Parameter | Typ | Märkning |
|-----|-----------|-----|----------|
| Funktion `calc_price(order_id)` | `order_id` | ingen typkontroll, används direkt i SQL-text med `%` | [kod] rad 28, 30, 36 |
| Kommandorad `python3 price_calc.py 1042` | `sys.argv[1]` | görs om med `int(...)`, text som inte är ett tal kraschar med `ValueError` | [kod] rad 62 |

**Ut**

| Fall | Funktionen returnerar | Kommandoraden skriver | Märkning |
|------|-----------------------|-----------------------|----------|
| Order finns | `Pris(net, vat, total)` med tre `Decimal` | `{"net": "...", "vat": "...", "total": "..."}`, talen som strängar | [kod] rad 58, 66 |
| Order finns inte | `None` | `{"error": "finns inte"}` och avslutskod 1 | [kod] rad 32–33, 63–65 |

Talen har **inte alltid två decimaler**: `Decimal(int(x*100))/100` ger t.ex. `950` och `1187.5`, inte `950.00` och `1187.50`. [kod] – formeln provad fristående i Python, inte mot databasen.

Bryggan gör om **alla** fel (avslutskod skild från 0) till `not_found` → 404, även när felet är något annat. [kod] legacyPrice.ts:13–15

## 3. Sidoeffekter

| Sidoeffekt | När | Märkning |
|------------|-----|----------|
| Öppnar en databasanslutning (`psycopg.connect`, autocommit) | **redan vid import**, inte vid anrop | [kod] rad 9–10 |
| Reservvärde med lösenord i koden om `DATABASE_URL` saknas | vid import | [kod] rad 9 |
| Skriver en rad (tid, order-id, total) till `src/legacy/price_calc.log` | vid varje lyckad beräkning | [kod] rad 51–54 |
| Alla fel vid loggningen tystas (`except: pass`) | vid loggning | [kod] rad 55–56 |
| Loggfilen ligger i `.gitignore` | – | [kod] .gitignore:6 |
| Cursorn stängs aldrig | vid varje anrop | [kod] rad 29 |
| Skriver inget till databasen, bara `select` | – | [kod] rad 30, 36, 42 |

## 4. Antaganden

| # | Antagande | Varför jag tror det | Märkning |
|---|-----------|---------------------|----------|
| A1 | `unit_price` kommer som `Decimal` från psycopg (NUMERIC) och `quantity` som `int` | psycopgs vanliga typomvandling, syns inte i filen | [antagande] |
| A2 | Momsen 25 % gäller alla varor | `MOMS = 25` är fast, men det finns ingen regel för t.ex. livsmedel (12 %) | [kod] att den är fast, [antagande] att det är rätt |
| A3 | Att momsen **kapas** (inte avrundas) är avsiktligt | Kommentaren rad 3: "rör inte avrundningen, ekonomi har stämt av mot den" | [kod] kommentaren, [antagande] att den fortfarande stämmer |
| A4 | Rabattens `valid_from`/`valid_to` borde kontrolleras | Kolumnerna finns i `discounts`, men koden läser bara `percent` | [kod] att de inte läses, [antagande] att det är en bugg |
| A5 | Python-processen behöver `.venv` med `psycopg` | `execFile("python3", ...)` använder den `python3` som finns i PATH | [kod] anropet, [antagande] om miljön (pris-testet var rött utan `.venv`) |
| A6 | Nattrapporten kraschar om en betald order försvinner mellan frågorna | `p.total` på `None` ger `AttributeError` | [kod] att `None` inte hanteras, [antagande] att det kan hända |
| A7 | Okänd rabattkod ger tyst fullpris | `if r:` hoppar över rabatten utan fel | [kod] |
| A8 | Rabattkoder är skiftlägeskänsliga (`var10` ≠ `VAR10`) | `where code = '...'` utan `lower()` | [kod] frågan, [antagande] om Postgres-kollationen |

## 5. Tre osäkerheter – och ett order-id som prövar var och en

| # | Osäkerhet | Order (db/seed.sql) | Varför just den | Märkning |
|---|-----------|---------------------|-----------------|----------|
| O1 | Ger en **utgången** rabattkod ändå rabatt? | **1045** – `GAMMAL15`, gällde 2024-01-01–2024-12-31, ordern lagd 2026-10-07 | Datumet kontrolleras inte i koden. Ger körningen 15 % rabatt är beteendet bekräftat. | [kod] rad 41–45 + seed rad 17, 26 |
| O2 | Kapas momsen eller avrundas den? | **1044** – `VAR10`, en vara 199.90 → netto 179.91, moms 44.9775 | Formeln ger moms 44.97 (kapad), inte 44.98. Körningen visar vad databasen faktiskt ger. | [kod] rad 23–25, 48 |
| O3 | Vad blir priset för en order **utan rader**? | **1043** – status `new`, inga rader i `order_lines` | Summan blir 0 och inget fel uppstår. Ingen regel säger om det är rätt. | [kod] rad 37–39 + seed (inga rader för 1043) |

Fler att pröva vid körningen (steg 3): **1042** (formen "1187.5" i stället för "1187.50"), **9999** (finns inte → `None` → 404 i API:t).

## 6. Säkerhet (SAL F4) – noterat, inte rättat

| Rad | Vad | Risk | Märkning |
|-----|-----|------|----------|
| 42 | `"... where code = '%s'" % kod` – rabattkoden byggs in i SQL-texten | **SQL-injektion.** Koden kommer från kunden via `POST /orders` (`discountCode`, vilken sträng som helst, orderService.ts) och körs när priset räknas | [kod] |
| 30, 36 | `% order_id` i SQL-texten | I dag ett heltal (från `int()` eller databasen), men mönstret är osäkert | [kod] att det är text, [antagande] att ingen annan anropare skickar text |
| jobs/nightly_report.py:8 | `'%s'" % dag` – datumet från kommandoraden i SQL-texten | SQL-injektion från den som kör cron-jobbet | [kod] |

Enligt avsnitt F: rätta **inte** förrän karakteriseringstesterna är gröna. Rättningen är steg 3 i förslaget:
`cur.execute("... where code = %s", (kod,))`.

## Nästa steg (avsnitt F)

1. Codemap (`docs/codemap.md`) – båda vägarna in.
2. `npm run db:reset`, kör `python3 src/legacy/price_calc.py <id>` för 1040–1047 och skriv svaren i en tabell.
3. Minst fem karakteriseringstester i `tests/test_price_calc.py`, gröna mot den orörda filen.

## 7. Körning 17/nov: vad koden svarar i dag (även buggarna)

Kört efter `npm run db:reset`, med `.env` laddad (`set -a; source .env; set +a`):
`python3 src/legacy/price_calc.py <id>` för 1040–1047.

| Order | Varor | Rabatt | Status | net | vat | total | Konstigt? |
|-------|-------|--------|--------|-----|-----|-------|-----------|
| 1040 | 899 | – | shipped | 899 | 224.75 | 1123.75 | `"899"`, inte `"899.00"` |
| 1041 | 3×129 + 349 | SOMMAR20 | shipped | 588.8 | 147.2 | 736.0 | en decimal |
| 1042 | 2×375 + 200 | – | paid | 950 | 237.5 | 1187.5 | en decimal |
| 1043 | inga rader | – | new | 0 | 0 | 0 | **O3**: ingen vara, men pris 0 och inget fel |
| 1044 | 199.90 | VAR10 | paid | 179.91 | 44.97 | 224.88 | **O2**: 44.9775 kapas till 44.97, avrundas inte till 44.98 |
| 1045 | 649 | GAMMAL15 | paid | 551.65 | 137.91 | 689.56 | **O1**: en utgången rabatt dras ändå av |
| 1046 | 899 | – | cancelled | 899 | 224.75 | 1123.75 | en avbruten beställning får ändå ett pris |
| 1047 | 129 + 2×200 | – | new | 529 | 132.25 | 661.25 | – |

Karakteriseringstesterna låser fast de här svaren, även buggarna. Buggarna rättas senare, med ett beslut.

Upptäckt: utan `.env` letar filen på port 5432 (reservadressen i koden, fynd B4 i 3-granskning.md).
