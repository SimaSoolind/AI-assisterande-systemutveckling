# Vad jag har lärt mig under arbetet
Alla mina lärdomar på ett ställe, ordnade efter stegen i resan.
Varje rubrik länkar till steget där jag lärde mig det.

## Översikt
| Steg | Fil | Antal |
|------|-----|-------|
| Steg 1: Studera koden och installera | [00-installation.md](00-installation.md) | 4 |
| Steg 2: Riskbedömning | [02-riskbedomning.md](02-riskbedomning.md) | 2 |
| Steg 4: Bygga med säkerhet | [04-bygga-med-sakerhet.md](04-bygga-med-sakerhet.md) | 13 |
| Steg 5: Testa | [05-testa.md](05-testa.md) | 7 |
| Steg 6: Validera | [06-validera.md](06-validera.md) | 4 |
| Steg 7: Leverera | [07-leverera.md](07-leverera.md) | 3 |

---

## Steg 1: Studera koden och installera
→ [00-installation.md](00-installation.md)
- Terminalen med `npm start` är upptagen. Jag kör curl i en andra terminal.
- Jag stoppar servern med `Ctrl + C`.
- Jag öppnar en fil med `code filnamn`, inte bara filnamnet.
- Jag kör `source .venv/bin/activate` i varje ny terminal, annars hittar Python inte sina paket.

## Steg 2: Riskbedömning
→ [02-riskbedomning.md](02-riskbedomning.md)
- Jag hittade en risk när jag studerade koden, och bevisade den med ett test.
  Det är SAL-livscykeln: hitta → bevisa → dokumentera.
- Ett fel som hittas tidigt är billigast att rätta (shift-left).

## Steg 4: Bygga med säkerhet
→ [04-bygga-med-sakerhet.md](04-bygga-med-sakerhet.md)

**API och statuskoder**
- Middleware säger ja med `next()` utan svar, eller nej med 401. En förfrågan får bara ett svar.
- 401 = jag vet inte vem du är. 403 = jag vet vem du är, men du får inte.
  403 gäller både fel roll och någon annans rad.
- `rowCount === 0` kan betyda tre saker: finns inte, fel status, för sent.
  Därför kollar jag att raden finns innan jag ändrar den.

**Säkerhet**
- `$1` i Node och `%s` med en tupel i Python är samma regel: värdet skickas separat, aldrig in i SQL-texten.

**Arbetssätt**
- TDD: först ett rött test, sedan koden som gör det grönt. Testet kontrollerar, koden gör jobbet.
- Ett kriterium = en orsak. Därför "10 minuter" i alla fall utom tidsfallet.
- Förstå först, ändra sedan: analys, codemap och karakteriseringstester innan jag ändrar gammal kod.
- Refaktorering ändrar hur koden ser ut, inte vad den gör. Buggar rättas med ett eget beslut.
- Det svåraste var att skriva user storyn och att tolka koden.
  Jag har inte gått igenom alla delar än, och hittills kan jag bara sätta upp ett API.
- Det som hjälpte mig mest: tester, lint och typkontroll kontrollerade koden åt mig.
  Jag granskade block för block: vad gör varje del, och vilket kriterium löser den?

**Terminal och git**
- `set -a; source .env; set +a` laddar `.env` utan att visa innehållet.
- Jag skriver filnamnen i `git add`, inte bara en punkt. `git add .` tog med min privata mall.
- Jag kollar `git log` innan jag committar, så att en commit inte får fel namn.

## Steg 5: Testa
→ [05-testa.md](05-testa.md)
- Ett test ska vara rött först. Annars vet jag inte om det fångar något.
- Jag kollar inte bara svaret, utan också datan.
  Servern svarade 403, men hade redan ändrat beställningen.
- Mutationstest: jag förstör koden med flit en kort stund och ser att testet larmar.
  Som testknappen på ett brandlarm.
- Jag kan inte lita blint på testerna.
- Ett namnbyte är ett säkert steg (liten risk): det ändrar inte vad koden gör, bara vad sakerna heter.
  Karakteriseringstesterna gav exakt samma svar före och efter. Därför görs testerna först.
- En plan som bara är skriven är en gissning. Migreringsplanen hade ett fel som syntes först när jag provkörde den.
- Jag ångrar i omvänd ordning: sist in, först ut. Regeln måste bort innan gamla data kan läggas tillbaka.

## Steg 6: Validera
→ [06-validera.md](06-validera.md)
- Granskning i lager: gratis verktyg först (lint, typer, tester), dyr AI-granskning sist.
- Automatiken hittade 0 fel, men säkerhetsagenten hittade att ett för stort id fick anropet att hänga.
  Lint och tester räcker inte.
- `npm audit fix` utan `--force` uppdaterar bara till säkra versioner. `--force` kan göra stora versionsbyten.
- En sårbarhet som inte går att laga får ett dokumenterat riskbeslut.

## Steg 7: Leverera
→ [07-leverera.md](07-leverera.md)
- Riggen arbetar åt mig: hooks stoppar fel automatiskt, och jag behöver inte komma ihåg varje kontroll.
- Över 98 % av alla tokens var cache-läsning. Planen i en fil och en ny chatt per arbete håller kostnaden nere.
- När jag läste resan fil för fil hittade jag det som var otydligt, svårläst eller saknades.
  Till exempel att två agenter aldrig hade använts. Då kunde jag rätta det.
