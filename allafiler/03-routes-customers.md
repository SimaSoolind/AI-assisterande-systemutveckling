## Fil 03: src/routes/customers.ts
Filen bestämmer vilka adresser som finns för kunder, och vad som händer när någon frågar efter dem.

## Routern och middleware

| Del | Mina ord | Jobb | Exempel |
|---|---|---|---|
| Routern | Vägvisaren | Bestämmer **vart** förfrågan ska. Jämför adressen och metoden. | `GET /customers/me` → kör koden för "hämta inloggad kund" |
| Middleware (`requireCustomer`) | Vakten | Kontrollerar **om** förfrågan får fortsätta. | Saknas `X-Customer-Id`? → svar 401, stopp |

- Routern säger **vart**. Middlewaren säger **ja eller nej**.
- `requireCustomer` skrivs i `src/auth.ts` (se 04-auth.md), men används här.
- `POST /customers` har ingen `requireCustomer`. Man måste kunna registrera sig utan att vara inloggad.

## Autentisering eller auktorisering

| Ord | Frågan | Var i projektet |
|---|---|---|
| Autentisering | **Vem** är du? Är du inloggad? | `requireCustomer` (middlewaren) |
| Auktorisering (behörighet) | **Får** du se just det här? | Tjänstelagret, t.ex. "är beställning 1042 din?" |

## Koden

```ts
export const customers = Router();

// Registrera en ny kund.
customers.post("/customers", async (req, res) => {
  const result = await createCustomer(req.body ?? {});
  sendResult(res, result, 201);
});

// Den inloggade kunden.
customers.get("/customers/me", requireCustomer, async (req, res) => {
  const result = await getCustomer((req as AuthedRequest).customerId);
  sendResult(res, result);
});
```

## Rad för rad

| Del | Vad den gör |
|---|---|
| `Router()` | Skapar en egen grupp av adresser. `app.ts` kopplar in gruppen. |
| `customers.post(...)` | POST betyder "skapa något nytt". |
| `customers.get(...)` | GET betyder "hämta". |
| `requireCustomer` | Middlewaren. Kontrollerar inloggningen innan resten körs. |
| `async` / `await` | Väntar på databasen innan koden går vidare. |
| `req.body ?? {}` | Det kunden skickade. Om inget skickades används ett tomt objekt. |
| `createCustomer(...)` | Anropar tjänstelagret, som pratar med databasen. |
| `sendResult(res, result, 201)` | Skickar svaret. 201 betyder "skapad". |

## Vägen till databasen

curl → route (den här filen) → middleware (`requireCustomer`) → service (`customerService.ts`) → SQL → PostgreSQL → svar tillbaka

## Risker och lösningar

Riskerna syns i adressen `POST /customers` (den här filen). Koden som ska rättas ligger i `customerService.ts` och `db/schema.sql`.

| Risk | Varför det är farligt | Lösning |
|---|---|---|
| 🟡 E-postadressen kontrolleras inte. `"hej"` godkänns som e-post. | Kunden kan inte nås. Fel data sparas i databasen. | Kontrollera formatet i `createCustomer` innan kunden sparas, t.ex. med Zod. Svara 400 om formatet är fel. |
| 🟡 Samma e-post kan registreras flera gånger. | Två konton för samma person. Svårt att veta vilket som är rätt. | Lägg till `UNIQUE` på kolumnen `email` i databasen (som en migrering). Svara 409 (konflikt) om e-posten redan finns. |
