## Fil 05: src/services/customerService.ts
Tjänstelagret för kunder. Här finns logiken och SQL-frågorna som pratar med databasen.

## Hur den hänger ihop
route (`routes/customers.ts`) → **den här filen** → `db.ts` → PostgreSQL

Det här är första filen som faktiskt pratar med databasen.

## Tre funktioner

| Funktion | Vad den gör | SQL |
|---|---|---|
| `createCustomer` | Kontrollerar att `name` och `email` finns. Sparar en ny kund. | `INSERT INTO customers ...` |
| `getCustomer` | Hämtar en kund. Svarar `not_found` om kunden inte finns. | `SELECT ... WHERE id = $1` |
| `listOrdersForCustomer` | Hämtar kundens beställningar, nyast först. | `SELECT ... ORDER BY created_at DESC` |

## Parametriserad SQL – skyddet mot SQL-injektion

| | Kod | Säkert? |
|---|---|---|
| ❌ Strängsammanslagning | `"... WHERE id = " + id` | Nej. Det kunden skriver blir en del av SQL-koden. |
| ✅ Parametriserad | `"... WHERE id = $1", [id]` | Ja. Värdet skickas separat och blir alltid data. |

- `$1`, `$2` är tomma platser i SQL-frågan.
- Värdena skickas i listan `[...]`, var för sig.
- Databasen behandlar värdena alltid som **data**, aldrig som kod.
- OBS: `price_calc.py` använder det osäkra sättet (se 12-price-calc-python.md).

---

## Funktion 1: getCustomer – hämtar en kund

```ts
export async function getCustomer(id: number) {
  const res = await db.query("SELECT id, uuid, name, email FROM customers WHERE id = $1", [id]);
  if (res.rowCount === 0) {
    return err("not_found", `Kund ${id} finns inte.`);
  }
  return ok(res.rows[0]);
}
```

| Del | Vad den gör |
|---|---|
| `getCustomer(id)` | Får kundens id från routen, t.ex. `7`. |
| `db.query(...)` | Skickar en SQL-fråga till databasen. |
| `SELECT ... FROM customers` | Samma SQL som jag skriver i pgAdmin. |
| `WHERE id = $1` | `$1` är en tom plats. |
| `[id]` | Värdet som läggs in på den tomma platsen. |
| `res.rowCount === 0` | Hittades ingen kund? |
| `err("not_found", ...)` | Då blir svaret 404. |
| `ok(res.rows[0])` | Annars skickas kunden tillbaka. |

---

## Funktion 2: createCustomer – sparar en ny kund

**Steg 1: Kontrollerar att `name` finns**

```ts
if (typeof input.name !== "string" || input.name.trim() === "") {
  return err("invalid_input", "name saknas.");
}
```

- Är `name` inte text, eller är den tom? → svar **400** (ogiltig indata).
- Samma kontroll görs sedan för `email`.
- Exempel: `{ "email": "anna@example.com" }` utan `name` → 400.
- Det finns ett test för det i `tests/customers.test.ts`: "returnerar 400 när name saknas".

**Steg 2: Sparar kunden**

```ts
const res = await db.query(
  "INSERT INTO customers (name, email) VALUES ($1, $2) RETURNING id, uuid, name, email",
  [input.name.trim(), input.email.trim()],
);
```

| Del | Vad den gör |
|---|---|
| `$1`, `$2` | `$1` blir namnet och `$2` blir e-posten. |
| `.trim()` | Tar bort mellanslag före och efter. |
| `RETURNING ...` | Databasen skickar tillbaka den nya kunden direkt. |

---

## Funktion 3: listOrdersForCustomer – kundens beställningar

```sql
SELECT id, status, created_at AS "createdAt"
FROM orders WHERE customer_id = $1 ORDER BY created_at DESC
```

| Del | Vad den gör |
|---|---|
| `created_at AS "createdAt"` | Byter namn från databasens `created_at` till `createdAt` i svaret. Det kräver kodstandarden. |
| `WHERE customer_id = $1` | Bara den inloggade kundens beställningar. Parametriserad. ✅ |
| `ORDER BY created_at DESC` | Nyast först. `DESC` betyder "fallande". |

---

## Övrigt
- `ok(...)` och `err(...)` kommer från `result.ts` (se 07-result.md).

## Risker
- 🟡 E-postadressen kontrolleras inte. `"hej"` godkänns som e-post.
- 🟡 Samma e-post kan registreras flera gånger. Databasen har ingen regel om unik e-post.
- Lösningar: se 03-routes-customers.md, "Risker och lösningar".
