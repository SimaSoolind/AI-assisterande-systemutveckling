## Fil 07: src/result.ts
Bestämmer hur ett svar från tjänstelagret ser ut. Ett svar är alltid **antingen** lyckat **eller** ett fel.

## Hur den hänger ihop
services skapar ett `Result` med `ok(...)` eller `err(...)` → routen tar emot det → `http.ts` gör om det till ett HTTP-svar

## Koden

```ts
export type ErrorCode = "not_found" | "invalid_input" | "forbidden" | "conflict";

export type AppError = { code: ErrorCode; message: string };

export type Result<T> = { ok: true; value: T } | { ok: false; error: AppError };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });

export const err = <T = never>(code: ErrorCode, message: string): Result<T> => ({
  ok: false,
  error: { code, message },
});
```

## Rad för rad

| Del | Vad den gör |
|---|---|
| `type ErrorCode = "not_found" \| ...` | De enda felkoder som får användas. `\|` betyder "eller". |
| `type AppError` | Ett fel har en `code` och ett `message`. |
| `type Result<T>` | Ett svar är **antingen** `{ ok: true, value }` **eller** `{ ok: false, error }`. |
| `<T>` | "Vilken typ som helst". Kan vara en kund, en beställning osv. |
| `ok(value)` | Hjälpfunktion. Skapar ett lyckat svar. |
| `err(code, message)` | Hjälpfunktion. Skapar ett fel. |

## Exempel

| Anrop | Blir |
|---|---|
| `ok({ name: "Alva Lind" })` | `{ ok: true, value: { name: "Alva Lind" } }` |
| `err("not_found", "Kund 999 finns inte.")` | `{ ok: false, error: { code: "not_found", message: "Kund 999 finns inte." } }` |

## Varför?
- Kodstandarden säger: tjänstelagret **kastar inte fel** för förväntade fall, t.ex. "kunden finns inte".
- I stället returneras ett `Result`. Då måste routen alltid kontrollera `ok` innan den använder värdet.
- TypeScript varnar om man glömmer det.

## Risker
- Inga säkerhetsrisker i den här filen.
- 🟢 `unauthorized` (401) finns inte i listan. `auth.ts` skriver sitt eget 401-svar i stället. Det fungerar, men felhanteringen finns på två ställen.
