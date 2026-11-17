# Arbete 1 – Verifiering: Avbryta en beställning

Verifierat 2026-11-17 mot den riktiga servern (`npm start`, http://localhost:3000) och utvecklingsdatabasen i Docker.
Ingen kod ändrades. Inga tester, ingen mock – riktiga HTTP-anrop med curl.

## Resultat

| Fall | Förväntat | Fick | OK |
|------|-----------|------|----|
| 1 Inom 30 minuter | 200, `cancelled` | 200, `cancelled` | ✅ |
| 2 Efter 30 minuter | 409 | 409 | ✅ |
| 3 Redan avbruten | 409 | 409 | ✅ |
| 4 Någon annans | 403, status kvar `new` | 403, status `new` | ✅ |
| 5 Inte inloggad | 401 | 401 | ✅ |
| 6 id inte ett tal | 400 | 400 | ✅ |
| 7 Finns inte | 404 | 404 | ✅ |
| 8 Redan skickad | 409 | 409 | ✅ |
| Extra: S2 för stort id | 400 (inte hänga) | 400 | ✅ |

## Förberedelse

Två nya beställningar för kund 1, så att de är lagda nyss och har status `new`:

```
$ curl -s -X POST http://localhost:3000/orders -H "X-Customer-Id: 1" -H "Content-Type: application/json" \
    -d '{"lines":[{"product":"Musmatta","quantity":1,"unitPrice":200}]}'
→ id 2001   (används i fall 1 och 3)
→ id 2002   (samma anrop igen, används i fall 4 och 5)
```

Fall 2 och 8 använder testdata från `db/seed.sql`:
- 1043: kund 3, status `new`, lagd 2026-10-03 (mer än 30 min sedan)
- 1040: kund 1, status `shipped`, lagd 2026-09-02

## Kommandon och svar

### 1. Inom 30 minuter
```
$ curl -s -i -X POST http://localhost:3000/orders/2001/cancel -H 'X-Customer-Id: 1'
HTTP/1.1 200 OK
{"id":2001,"customerId":1,"status":"cancelled","discountCode":null,"lines":[{"product":"Musmatta","quantity":1,"unitPrice":"200.00"}]}
```

### 2. Efter 30 minuter
```
$ curl -s -i -X POST http://localhost:3000/orders/1043/cancel -H 'X-Customer-Id: 3'
HTTP/1.1 409 Conflict
{"error":{"code":"conflict","message":"Bara en ny beställning kan avbrytas, och bara inom 30 minuter."}}
```

### 3. Redan avbruten (2001 avbröts i fall 1)
```
$ curl -s -i -X POST http://localhost:3000/orders/2001/cancel -H 'X-Customer-Id: 1'
HTTP/1.1 409 Conflict
{"error":{"code":"conflict","message":"Bara en ny beställning kan avbrytas, och bara inom 30 minuter."}}
```

### 4. Någon annans beställning
```
$ curl -s -i -X POST http://localhost:3000/orders/2002/cancel -H 'X-Customer-Id: 2'
HTTP/1.1 403 Forbidden
{"error":{"code":"forbidden","message":"Beställningen tillhör en annan kund."}}

$ curl -s -i http://localhost:3000/orders/2002 -H 'X-Customer-Id: 1'
HTTP/1.1 200 OK
{"id":2002,"customerId":1,"status":"new", ...}
```
Statusen är fortfarande `new`.

### 5. Inte inloggad
```
$ curl -s -i -X POST http://localhost:3000/orders/2002/cancel
HTTP/1.1 401 Unauthorized
{"error":{"code":"unauthorized","message":"Logga in först."}}
```

### 6. id är inte ett tal
```
$ curl -s -i -X POST http://localhost:3000/orders/banan/cancel -H 'X-Customer-Id: 1'
HTTP/1.1 400 Bad Request
{"error":{"code":"invalid_input","message":"Ogiltigt id."}}
```

### 7. Beställningen finns inte
```
$ curl -s -i -X POST http://localhost:3000/orders/9999/cancel -H 'X-Customer-Id: 1'
HTTP/1.1 404 Not Found
{"error":{"code":"not_found","message":"Beställning 9999 finns inte."}}
```

### 8. Redan skickad
```
$ curl -s -i -X POST http://localhost:3000/orders/1040/cancel -H 'X-Customer-Id: 1'
HTTP/1.1 409 Conflict
{"error":{"code":"conflict","message":"Bara en ny beställning kan avbrytas, och bara inom 30 minuter."}}
```

### Extra: S2, för stort id
```
$ curl -s -i -m 5 -X POST http://localhost:3000/orders/3000000000/cancel -H 'X-Customer-Id: 1'
HTTP/1.1 400 Bad Request
{"error":{"code":"invalid_input","message":"Ogiltigt id."}}
```
Före rättningen av `parseId` gav samma anrop inget svar alls.

## Begränsningar (ärligt)

| Sak | Betyder |
|-----|---------|
| Fall 8 (1040) är både `shipped` **och** äldre än 30 min | 409 kan komma av båda orsakerna. Att `shipped` ensamt ger 409 visas i det automatiska testet (`it.each`, där beställningen är ny). |
| Fall 2 och 3 ger samma meddelande | Medvetet val: ett meddelande för båda orsakerna (ADR 0001, konsekvenser). |
| Inloggningen är bara headern `X-Customer-Id` | Känd förenkling i övningen (granskning B1). |
| Utvecklingsdatabasen har nu två nya beställningar (2001 `cancelled`, 2002 `new`) | Försvinner vid `npm run db:reset`. |
