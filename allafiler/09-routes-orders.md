## Fil 09: src/routes/orders.ts
Adresserna för beställningar. Samma uppbyggnad som 03-routes-customers.md.

## Hur den hänger ihop
curl → **den här filen** → middleware (`requireCustomer`) → `orderService.ts` → databasen
Priset: → `pricing/legacyPrice.ts` → Python (`price_calc.py`) → databasen

## Tre adresser

| Adress | Vad den gör | Middleware |
|---|---|---|
| `POST /orders` | Lägger en ny beställning. | `requireCustomer` |
| `GET /orders/:id` | Hämtar en egen beställning med rader. | `requireCustomer` |
| `GET /orders/:id/price` | Räknar priset för en egen beställning. | `requireCustomer` |

Alla tre kräver inloggning (vakten).

## `:id` i adressen

`:id` är en **plats i adressen** som kan ha olika värden.
- `GET /orders/1042` → `req.params.id` blir texten `"1042"`.

## parseId – kontrollerar id:t

```ts
function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}
```

| Del | Vad den gör |
|---|---|
| `Number(raw)` | Gör om texten till ett tal. |
| `Number.isInteger(id) && id > 0` | Är det ett positivt heltal? `&&` betyder "och". |
| `? id : null` | Ja → id:t. Nej → `null` (inget värde). |

| I adressen | Resultat |
|---|---|
| `/orders/1042` | 1042 |
| `/orders/abc` | `null` → svar 400 |

## Priset – kontrollerar behörighet först

```ts
const order = await getOrder(id, (req as AuthedRequest).customerId);
if (!order.ok) {
  sendError(res, order.error);
  return;
}
sendResult(res, await calcPrice(id));
```

1. `getOrder` kontrollerar att beställningen finns **och** är min.
   - Finns inte → 404. Någon annans → 403.
2. Först då räknas priset med `calcPrice`.

✅ Bra säkerhet: auktoriseringen görs **innan** priset räknas.

## Risker
- 🟢 Varje prisfråga startar ett nytt Python-program. Det är långsamt. Många frågor samtidigt kan göra servern seg.
