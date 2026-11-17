# Arbete 1 – User story: Avbryta en beställning

## Story

Som kund vill jag kunna avbryta en beställning inom 30 minuter efter att jag lagt den.

## Varför jag valde den

Jag valde den för att samma mönster behövs i mitt Node-projekt Skär (avboka en bokning),
och för att den visar säkerhet: bara egen beställning (403), inloggning (401) och regler i servern.
Den är liten nog att hinna före redovisningen 19 nov.

Bortvalda: Omförsök (idempotensnycklar, för svår nu), Lagersaldo (ny tabell och transaktioner, för stor),
Rabattkod (krockar med Arbete 3, price_calc.py).

## Acceptanskriterier

Statuskoderna följer `docs/standard.md`: 400 ogiltig indata, 401 inte inloggad, 403 inte din resurs, 404 finns inte, 409 konflikt.

### 1. Inom 30 minuter

Givet att jag är inloggad som kund 1
och har en beställning med status 'new' som lades för 10 minuter sedan
När jag skickar POST /orders/1042/cancel
Så får jag 200
och beställningens status blir 'cancelled'

### 2. Efter 30 minuter

Givet att jag är inloggad som kund 1
och har en beställning med status 'new' som lades för 31 minuter sedan
När jag skickar POST /orders/1042/cancel
Så får jag 409
och beställningens status är fortfarande 'new'

### 3. Redan avbruten

Givet att jag är inloggad som kund 1
och har en beställning med status 'cancelled' som lades för 10 minuter sedan
När jag skickar POST /orders/1042/cancel
Så får jag 409
och beställningens status är fortfarande 'cancelled'

### 4. Någon annans beställning

Givet att jag är inloggad som kund 2
och beställning 1042 tillhör kund 1, status 'new', lagd för 10 minuter sedan
När jag skickar POST /orders/1042/cancel
Så får jag 403
och beställningens status är fortfarande 'new'

### 5. Inte inloggad

Givet att jag inte är inloggad (ingen X-Customer-Id i anropet)
och beställning 1042 tillhör kund 1, status 'new', lagd för 10 minuter sedan
När jag skickar POST /orders/1042/cancel
Så får jag 401
och beställningens status är fortfarande 'new'

### 6. id är inte ett tal

Givet att jag är inloggad som kund 1
När jag skickar POST /orders/banan/cancel
Så får jag 400
och ingen beställning ändras

### 7. Beställningen finns inte

Givet att jag är inloggad som kund 1
och det finns ingen beställning med id 9999
När jag skickar POST /orders/9999/cancel
Så får jag 404
och ingen beställning ändras

### 8. Redan skickad

Givet att jag är inloggad som kund 1
och har en beställning med status 'shipped' som lades för 10 minuter sedan
När jag skickar POST /orders/1042/cancel
Så får jag 409
och beställningens status är fortfarande 'shipped'
