## Fil 04: src/auth.ts
Här skrivs vakten (middlewaren `requireCustomer`). Den kontrollerar om kunden är inloggad.

## Koden

```ts
import { NextFunction, Request, Response } from "express";

export type AuthedRequest = Request & { customerId: number };

export function requireCustomer(req: Request, res: Response, next: NextFunction): void {
  const raw = req.header("X-Customer-Id");
  const id = Number(raw);
  if (!raw || !Number.isInteger(id) || id <= 0) {
    res.status(401).json({ error: { code: "unauthorized", message: "Logga in först." } });
    return;
  }
  (req as AuthedRequest).customerId = id;
  next();
}
```

## Rad för rad

| Del | Vad den gör |
|---|---|
| `import { NextFunction, Request, Response }` | Hämtar typer från Express: förfrågan, svar och `next`. |
| `type AuthedRequest = Request & { customerId: number }` | En ny typ: en vanlig förfrågan **och** ett fält `customerId`. `&` betyder "båda". |
| `requireCustomer(req, res, next)` | Vakten. Får förfrågan, svaret och `next`. |
| `: void` | Funktionen lämnar inte tillbaka något värde. |
| `req.header("X-Customer-Id")` | Läser headern. Blir text, t.ex. `"1"`, eller `undefined` om den saknas. |
| `Number(raw)` | Gör om texten till ett tal. `"abc"` blir `NaN` (inte ett tal). |
| `!raw` | Sant om headern saknas. |
| `!Number.isInteger(id)` | Sant om id inte är ett heltal. |
| `id <= 0` | Sant om id är 0 eller negativt. |
| `\|\|` | "eller". Räcker att en av dem är sann. |
| `res.status(401).json(...)` | Svarar 401 med ett felmeddelande. |
| `return;` | Stoppar funktionen. `next()` körs aldrig. |
| `(req as AuthedRequest).customerId = id` | Sparar kundens id på förfrågan, så att routen kan läsa det. |
| `next();` | Släpper in förfrågan till routen. |

## Exempel

| Headern `X-Customer-Id` | Resultat |
|---|---|
| saknas | 401 |
| `abc` | 401 (inte ett tal) |
| `-5` | 401 (negativt) |
| `7` | Släpps in. `customerId` blir 7. |

## Säkerhet

- 🔴 Vem som helst kan skriva vilket id som helst i headern och låtsas vara en annan kund.
- Filen säger själv att det bara gäller övningen.
- I ett riktigt system kommer id:t från en verifierad token, t.ex. JWT. Det bygger jag i Bibel-appens Fas 2.
