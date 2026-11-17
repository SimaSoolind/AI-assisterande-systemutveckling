# Migreringsplan: regel för `orders.status`

Arbete 3, sista steget i avsnitt F. Skriven 2026-11-17. **Planen ska inte köras.**

## Problemet

`orders.status` är `TEXT NOT NULL DEFAULT 'new'` (db/schema.sql:27). Ingen regel säger vilka värden som är tillåtna.
Ett stavfel som `'canceled'` eller `'Paid'` sparas utan fel. Då missar koden raden:

| Kod som läser status | Fil |
|----------------------|-----|
| `status = 'new'` i avbrottet | src/services/orderService.ts (cancelOrder) |
| `status = 'paid'` i nattrapporten | jobs/nightly_report.py:8 |

Tillåtna värden i dag (seed + kod): `new`, `paid`, `shipped`, `cancelled`.

### Varför regeln ska ligga i databasen
Agenten utforskare sökte igenom `src/`, `jobs/` och `tests/` (17 nov):

| Status | Skrivs av | Läses av |
|--------|-----------|----------|
| `new` | databasen (DEFAULT) | cancelOrder |
| `cancelled` | cancelOrder | bara tester |
| `paid` | **ingen kod** – sätts utifrån | nattrapporten |
| `shipped` | **ingen kod** – sätts utifrån | bara tester |

`paid` och `shipped` skrivs utanför koden, av ett annat system eller för hand.
Där kan stavfel uppstå, och en kontroll i TypeScript stoppar dem inte. Bara en regel i databasen gör det.
I dag finns stavningen `'canceled'` ingenstans i koden.

## Varför expand/contract och inte en enda ändring

En vanlig `ALTER TABLE ... ADD CHECK` kontrollerar **alla gamla rader direkt**. Finns en enda rad med okänt värde misslyckas migreringen,
och tabellen låses medan den kontrolleras. Med expand/contract gör vi det i små steg som var och ett går att stoppa.

## Stegen

### Steg 1 – Expand: lägg till regeln, bara för nya rader

```sql
ALTER TABLE orders
  ADD CONSTRAINT orders_status_tillaten
  CHECK (status IN ('new', 'paid', 'shipped', 'cancelled'))
  NOT VALID;
```

| | |
|---|---|
| **Vad** | Regeln gäller nya och ändrade rader. `NOT VALID` betyder att gamla rader inte kontrolleras än. |
| **Varför** | Inga fel stoppar migreringen, och ingen lång låsning. Nya stavfel stoppas från och med nu. |
| **Kontroll efter** | `npm test` och `npm run test:legacy` gröna. Testerna sätter bara tillåtna värden (`cancelled`, `shipped`). |
| **Backa** | ✅ Ja: `ALTER TABLE orders DROP CONSTRAINT orders_status_tillaten;` Ingen data ändras. |

### Steg 2 – Verifiera: leta efter gamla rader med okänd status

```sql
SELECT id, status, created_at
  FROM orders
 WHERE status NOT IN ('new', 'paid', 'shipped', 'cancelled');
```

| | |
|---|---|
| **Vad** | Listar raderna som skulle bryta regeln. |
| **Om listan är tom** | Gå till steg 4. |
| **Om listan inte är tom** | Gå till steg 3. Gissa inte vad raderna ska vara. Fråga den som äger datan (t.ex. ekonomi). |
| **Backa** | ✅ Behövs inte. Bara läsning. |

### Steg 3 – Rätta gamla rader (bara om steg 2 hittade något)

Spara först en kopia, sedan en rättning per beslutat värde. Exempel om `'canceled'` hittades:

```sql
CREATE TABLE orders_status_backup AS
  SELECT id, status FROM orders
   WHERE status NOT IN ('new', 'paid', 'shipped', 'cancelled');

UPDATE orders SET status = 'cancelled' WHERE status = 'canceled';
```

| | |
|---|---|
| **Vad** | Gör om okända värden till tillåtna, efter beslut. |
| **Kontroll efter** | Kör frågan i steg 2 igen. Den ska ge 0 rader. |
| **Backa** | ⚠️ Delvis, bara tack vare kopian, och **i den här ordningen**: 1) backa steg 1 (`DROP CONSTRAINT`), annars vägrar regeln de gamla värdena. 2) `UPDATE orders SET status = b.status FROM orders_status_backup b WHERE orders.id = b.id;` Utan kopian går det inte. |

### Steg 4 – Contract: gör regeln tvingande för alla rader

```sql
ALTER TABLE orders VALIDATE CONSTRAINT orders_status_tillaten;
```

| | |
|---|---|
| **Vad** | Databasen kontrollerar nu även de gamla raderna. Efter det gäller regeln överallt. |
| **Varför sist** | Steg 2 och 3 har redan visat att alla rader klarar regeln, så kommandot kan inte misslyckas. |
| **Kontroll efter** | `SELECT convalidated FROM pg_constraint WHERE conname = 'orders_status_tillaten';` ska ge `true`. |
| **Backa** | ✅ Ja, med samma `DROP CONSTRAINT` som i steg 1. |

### Steg 5 – Städa

| Gör | Backa |
|-----|-------|
| Lägg in regeln i `db/schema.sql` så att nya databaser (och `npm run db:reset`) får den från början | ✅ Ja, med en vanlig commit-revert |
| Ta bort `orders_status_backup` när regeln har fungerat ett tag | ❌ **Nej.** Efter det går steg 3 inte att backa. Gör det sist och medvetet. |

## Sammanfattning: vad går att backa?

| Steg | Typ | Går att backa? |
|------|-----|----------------|
| 1 Expand (`NOT VALID`) | schema | ✅ ja |
| 2 Verifiera | läsning | ✅ inget att backa |
| 3 Rätta gamla rader | data | ⚠️ bara med kopian, och efter att steg 1 backats |
| 4 Contract (`VALIDATE`) | schema | ✅ ja |
| 5a Regel i schema.sql | kod | ✅ ja |
| 5b Ta bort kopian | data | ❌ nej |

## Provkörning 2026-11-17 (testdatabasen, inuti `BEGIN … ROLLBACK`)

Planen kördes på `butik_test` i en transaktion som ångrades. En påhittad gammal rad (id 9001, `'canceled'`) lades in före steg 1.

| Kontroll | Resultat |
|----------|----------|
| Steg 1: nytt stavfel `'Paid'` | ✅ stoppat: `violates check constraint "orders_status_tillaten"` |
| Steg 1: gamla raden 9001 | ✅ släpptes igenom (`NOT VALID`) |
| Contract **före** rättning | ✅ misslyckades som väntat: `is violated by some row` |
| Steg 2: verifiera | ✅ hittade 9001 `canceled` |
| Steg 3: rättning | ✅ 0 okända kvar |
| Steg 3: backa med regeln kvar | ❌ **gick inte** – regeln stoppade återställningen. Planen rättad: backa steg 1 först. |
| Steg 3: backa i rätt ordning | ✅ 9001 fick tillbaka `canceled` |
| Steg 4: contract | ✅ `convalidated = t` |
| Steg 4: backa | ✅ regeln borta |
| Efter `ROLLBACK` | ✅ rad 9001, kopian och regeln borta – testdatabasen orörd |

## Utanför planen

- Regler för hur status får **byta** (t.ex. `shipped` → `new`) – det är logik i koden, inte en CHECK-regel.
- En egen tabell eller `ENUM` för status – mer att migrera, och svårare att lägga till ett värde senare.
- Rabatternas giltighetsdatum (O1) – kräver ett beslut först, se docs/analys-price-calc.md.
