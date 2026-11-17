# Codemap

Uppdaterad 2026-11-17. Karta över filerna i `src/`, `jobs/`, `scripts/` och `db/`.
Fokus: `src/legacy/price_calc.py` (Arbete 3). Detaljer i [analys-price-calc.md](analys-price-calc.md).

## Filer

| Fil | Gör | Anropar | |
|-----|-----|---------|---|
| src/server.ts | Startar API:t på `PORT` (standard 3000) | app.ts | |
| src/app.ts | Skapar Express-appen, läser JSON och kopplar in routerna | routes/customers.ts, routes/orders.ts | |
| src/auth.ts | `requireCustomer`: läser `X-Customer-Id`, annars 401 | – | |
| src/http.ts | `sendResult` / `sendError`: gör `Result` till HTTP-svar och statuskod | result.ts | |
| src/result.ts | Typen `Result` med `ok` och `err` (felkoder) | – | |
| src/db.ts | Delad `pg.Pool` mot `DATABASE_URL` | Postgres | |
| src/routes/customers.ts | `POST /customers`, `GET /customers/me`, `GET /customers/me/orders` | auth.ts, http.ts, services/customerService.ts | |
| src/routes/orders.ts | `POST /orders`, `GET /orders/:id`, `GET /orders/:id/price`, `POST /orders/:id/cancel`; `parseId` | auth.ts, http.ts, services/orderService.ts, pricing/legacyPrice.ts | |
| src/services/customerService.ts | Skapar och hämtar kunder och deras beställningar | db.ts, result.ts | |
| src/services/orderService.ts | `createOrder`, `getOrder` (ägarkoll), `cancelOrder` | db.ts, result.ts | |
| src/pricing/legacyPrice.ts | **Väg in 1** till price_calc.py: startar `python3 price_calc.py <id>` och läser JSON | src/legacy/price_calc.py (som egen process), result.ts | |
| src/legacy/price_calc.py | Räknar netto, moms och total med rabatt. Ansluter till databasen **vid import**, skriver till `price_calc.log` | Postgres (egen anslutning via psycopg, inte db.ts) | **äldre** |
| jobs/nightly_report.py | **Väg in 2** till price_calc.py: summerar dagens betalda ordrar (cron) | src/legacy/price_calc.py (`import calc_price, conn`) | **äldre** |
| scripts/db-reset.ts | Återställer utvecklings- och testdatabasen till schema + seed | db/schema.sql, db/seed.sql, Postgres | |
| scripts/create-test-db.sql | Skapar databasen `butik_test` | – | |
| db/schema.sql | Tabellerna `customers`, `discounts`, `orders`, `order_lines` | – | |
| db/seed.sql | Testdata: kunder, rabattkoder, beställningar 1040–1047 | – | |

## Flöde för en förfrågan

Vanlig förfrågan, t.ex. `POST /orders/:id/cancel`:

1. **route** – src/routes/orders.ts (`parseId` → 400 vid fel id)
2. **middleware** – src/auth.ts `requireCustomer` (401 utan inloggning)
3. **service** – src/services/orderService.ts `cancelOrder` → `Result`
4. **db.ts** – src/db.ts `db.query(sql, [värden])`
5. **databas** – Postgres
6. tillbaka: src/http.ts `sendResult` → JSON-svar

## Två vägar in till price_calc.py (äldre)

**Väg 1 – API:t, `GET /orders/:id/price`**

1. **route** – src/routes/orders.ts (`parseId`)
2. **middleware** – src/auth.ts `requireCustomer`
3. **service** – src/services/orderService.ts `getOrder` (finns + ägare, 403/404)
4. **brygga** – src/pricing/legacyPrice.ts `calcPrice` → `execFile("python3", [price_calc.py, id])`
5. **äldre** – src/legacy/price_calc.py, kör som `__main__`, skriver JSON till stdout
6. **databas** – Postgres via **egen** psycopg-anslutning (inte db.ts)
7. tillbaka: alla fel i Python blir `not_found` (404) i bryggan

**Väg 2 – nattrapporten (cron på driftservern)**

1. **äldre** – jobs/nightly_report.py: `select id from orders where status = 'paid' ...`
2. **äldre** – `import calc_price, conn` från src/legacy/price_calc.py, anropar `calc_price(oid)` per order
3. **databas** – Postgres via samma psycopg-anslutning (`conn` delas)
4. ut: en rad på stdout med antal och summa

## Att tänka på vid ändring av price_calc.py

| Sak | Varför |
|-----|--------|
| Båda vägarna använder filen på **olika sätt** | Väg 1 läser stdout-JSON (`__main__`), väg 2 importerar `calc_price` och `conn`. Ändra båda gränssnitten försiktigt. |
| Ansluter vid import | Tester måste sätta `DATABASE_URL` först – görs i tests/conftest.py |
| Låst av karakteriseringstester | tests/test_price_calc.py (5 tester, `npm run test:legacy`) |
| SQL byggd med `%` | price_calc.py rad 30, 36, 42 och nightly_report.py rad 8 – rättas efter gröna tester |
