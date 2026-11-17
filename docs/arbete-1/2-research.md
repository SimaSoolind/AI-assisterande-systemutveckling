# Arbete 1 – Research: Avbryta en beställning

## Det som redan finns (jag återanvänder)
| Fall | Det som finns | Fil |
|------|---------------|-----|
| 5 – inte inloggad (401) | requireCustomer | src/auth.ts |
| 6 – id inte ett tal (400) | parseId | src/routes/orders.ts |
| 4 och 7 – inte din (403) / finns inte (404) | getOrder | src/services/orderService.ts |
| 2, 3, 8 – fel läge (409) | felkoden "conflict" | src/result.ts, src/http.ts |

## Det som är nytt (jag bygger)
- En route: POST /orders/:id/cancel
- En funktion i orderService som ändrar status till 'cancelled'

## Viktigt beslut
Tiden (30 minuter) räknas i databasen med now(), inte i Node.
Då kan inte en klocka som går fel ge fel svar. → blir min ADR.
Status och tid kollas i samma UPDATE med $1 och $2. Då kan inte två anrop samtidigt avbryta samma beställning.


## Öppna frågor

- Testerna måste skapa en egen ny beställning (1042 är för gammal).
- Beslut: Bara 'new' kan avbrytas. 'paid' kräver återbetalning, och den är utanför.
