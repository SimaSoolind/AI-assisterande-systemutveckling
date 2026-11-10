## Fil 08: src/http.ts
Gör om ett `Result` (från result.ts) till ett HTTP-svar med rätt statuskod.

## Hur den hänger ihop
service → `Result` → route → **den här filen** → svar till klienten (curl)

## Koden

```ts
const STATUS: Record<AppError["code"], number> = {
  invalid_input: 400,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
};

export function sendError(res: Response, error: AppError): void {
  res.status(STATUS[error.code]).json({ error });
}

export function sendResult<T>(res: Response, result: Result<T>, okStatus = 200): void {
  if (result.ok) {
    res.status(okStatus).json(result.value);
  } else {
    sendError(res, result.error);
  }
}
```

## Rad för rad

| Del | Vad den gör |
|---|---|
| `const STATUS = { ... }` | En tabell: felkod → statuskod. |
| `Record<AppError["code"], number>` | TypeScript kontrollerar att **alla** felkoder från result.ts finns med. |
| `sendError(res, error)` | Slår upp statuskoden i `STATUS` och skickar felet som JSON. |
| `STATUS[error.code]` | T.ex. `STATUS["not_found"]` → `404`. |
| `sendResult(res, result, okStatus = 200)` | Skickar ett lyckat svar eller ett fel. `= 200` betyder att 200 används om inget annat anges. |
| `if (result.ok)` | Lyckat? → skicka värdet med `okStatus`. |
| `else` | Fel? → låt `sendError` sköta det. |

## Felkod → statuskod

| Felkod | Statuskod | Betyder |
|---|---|---|
| `invalid_input` | 400 | Ogiltig indata |
| `forbidden` | 403 | Jag vet vem du är, men du får inte |
| `not_found` | 404 | Finns inte |
| `conflict` | 409 | Krock, t.ex. finns redan |

## Felsvarets form

Alla fel ser likadana ut, som kodstandarden kräver:

```json
{ "error": { "code": "not_found", "message": "Kund 999 finns inte." } }
```

## Risker
- 🟡 Om databasen kraschar kastas ett fel som ingen fångar. Det finns ingen gemensam felhanterare i appen. Klienten kan bli utan svar. Lösning: en felhanterare (error middleware) i app.ts som svarar 500 utan interna detaljer.
- 🟢 403 avslöjar att en beställning finns, även om den är någon annans. Med 404 i stället vet en angripare inte vilka id:n som finns.
