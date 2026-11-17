# Steg 5: Testa
**Regler – så här gör jag:** Jag skriver tester för det jag har byggt.
Jag kör alla tester, så att inget gammalt har gått sönder.

## Alla tester för Arbete 1 bevisades röda
| Fall | Test | Grönt direkt? | Vad jag tog bort | Resultat |
|------|------|---------------|------------------|----------|
| 4 – någon annans (403) | `a44ec65` | ja | ägarkollen `getOrder` | rött: status blev `cancelled` |
| 7 – finns inte (404) | `20550a3` | ja | ägarkollen `getOrder` | rött: 409 i stället för 404 |
| 5 – inte inloggad (401) | `e442a28` | ja | middlewaren `requireCustomer` | TypeScript stoppade innan testerna startade |
| 6 – id inte ett tal (400) | `4ffe276` | ja | `parseId` | anropet **hängde**: SQL kraschade på `NaN`, och ingen try/catch fångade felet |

**Fynd från fall 6:** risken "ingen gemensam felhanterare" i 02-riskbedomning.md är verklig.
Ett hängande anrop är värre än 500: klienten får inget svar, och många sådana anrop kan fylla servern (DoS, SAL F5).
`parseId` är alltså inte bara snyggt – den skyddar SQL mot ogiltig indata (SAL F4, fråga 5b).

## Mutationstest: bevisa att testet fångar en säkerhetsbrist (måndag 17/nov)

### Bakgrund
Testet för fall 4 (kund 2 försöker avbryta kund 1:s beställning → 403) blev **grönt direkt**.
Orsak: `cancelOrder` anropar `getOrder` först, och den ger redan 403. Det byggdes i steg 1.
Men ett test som aldrig har varit rött kan vara trasigt. Därför testade jag testet.

### Vad jag gjorde
1. Tog bort ägarkollen en kort stund (rad 88–89 i `src/services/orderService.ts`: `getOrder` + `if`).
2. Körde testet: kund 2 försöker avbryta kund 1:s beställning.
3. Lade tillbaka raderna. `git diff src/` visar ingen ändring. 21 av 21 tester gröna.

### Vad som hände
| Kontroll i testet | Utan ägarkollen | Betyder |
|-------------------|-----------------|---------|
| `expect(res.status).toBe(403)` | ✅ **fortfarande grönt** | Svaret ljög |
| `expect(order.body.status).toBe("new")` | ❌ **rött**: status var `cancelled` | Beställningen var avbruten! |

### Varför svaret ljög
| Rad | Vad hände |
|-----|-----------|
| `UPDATE ... WHERE id = $1` | Ändrade kund 1:s beställning, för ingen kollade ägaren |
| `return getOrder(orderId, customerId)` (sist) | Såg att den var kund 1:s och svarade 403 |

Kund 2 fick 403, men hann ändå avbryta kund 1:s beställning.
**Ett test som bara kollar statuskoden hade varit grönt, trots en allvarlig säkerhetsbrist.**

### Säkerhet
- SAL F2, fråga 5d: en användare får bara ändra sin egen rad.
- OWASP Top 10, nr 1: **Broken Access Control**.

### Lärdomar
- Ett test ska vara rött först. Annars vet jag inte om det fångar något.
- Kolla inte bara svaret. Kolla också **datan**: ändrades något som inte skulle ändras?
- Mutationstest = förstör koden med flit en kort stund och se att testet larmar. Som testknappen på ett brandlarm.
- Ett namnbyte är ett säkert steg (liten risk): ett namn ändrar inte vad koden gör, utan bara vad sakerna heter.
  Det visades av karakteriseringstesterna, som gav exakt samma svar före och efter. Det är därför testerna görs först.
- En plan som bara är skriven är en gissning. Först när migreringsplanen provkördes syntes att backstegen
  beror på varandra: regeln måste tas bort innan gamla data kan läggas tillbaka. Ångra i omvänd ordning.

### Med mina egna ord
- Jag bevisade att mitt test fångar en säkerhetsbrist genom att ta bort skyddet en kort stund.
- Eftersom testet aldrig hade visat rött, fanns det en risk att testet var trasigt.
- När jag förstörde koden med flit blev testet rött. Testet fungerar.
  Men raden som bara kollar `res.status` var fortfarande grön – den raden ensam hade ljugit.
- Varför räcker det inte att kolla `res.status`? Servern svarade 403 ("du får inte"),
  men den hade redan ändrat beställningen. Därför måste testet också kolla datan, inte bara svaret.
- Det är beviset på att jag inte kan lita blint på testerna.
