# LIA-presentation: En rigg för en kodbas
Grund till intervjun 23 nov och till sida B. Varje del är en mening jag kan säga.

## 1. Problemet
> "Ett team ska börja använda en AI-kodagent. Om alla skriver egna instruktioner i chatten arbetar agenten olika för varje person, och ingen kan se i efterhand vad som hände."

## 2. Min lösning: en rigg
> "Jag byggde en rigg. Det är regler och verktyg som ligger i repot, så att agenten arbetar likadant för alla."

| Del | Vad den gör | Exempel |
|---|---|---|
| Behörigheter | Bestämmer vad agenten får göra | Den får aldrig läsa `.env` |
| Kodstandard | Kontrollerar koden automatiskt | ESLint med säkerhetsregler, typkontroll, prettier |
| Skills | Färdiga arbetssätt | `/tdd`: tester skrivs först |
| Subagenter | Fyra hjälpagenter med en uppgift var | En granskar säkerheten |
| Hooks | Fem hooks som stoppar fel automatiskt | Agenten får inte ta bort tester eller skriva nycklar i koden |
| Sessionsloggar | Visar vad som hände och varför | En logg per arbetspass |

## 3. Tre arbeten där jag använde riggen
1. **Ny funktion:** en kund kan avbryta sin beställning inom 30 minuter.
   > "Jag gick från user story till granskad kod, med testet först i varje steg."
2. **Granskning:** lärarens pull request med kod som AI har skrivit – görs på seminariet.
3. **Modernisering:** en gammal Python-fil som räknar pris.
   > "Jag låste fast beteendet med tester, och stängde en SQL injection utan att priset ändrades."

## 4. Resultatet
> "Mina kontroller hittade fel som jag själv hade missat."

| Vad | Resultat |
|---|---|
| Tester | 25 API-tester och 6 karakteriseringstester, alla gröna |
| Mutationstest | 4 tester bevisade röda när skyddet togs bort |
| Säkerhetsagenten | hittade att ett för stort id fick servern att hänga – lint och tester hade missat det |
| SQL injection | en påhittad rabattkod gav 10 % rabatt – stängd och bevisad |
| Behörigheter | agenten nekades att läsa `.env` och att radera `.venv` |
| Sårbara paket | 3 hittade med `npm audit`, 2 lagade, 1 dokumenterat riskbeslut |
| Kostnad | ca 38 $ för hela projektet (API-pris), över 98 % var cache-läsning |
| Tid | ca 17,6 timmar aktiv tid |

## 5. Varför det passar för LIA
- **Säkerhet:** 10 risker hittade och märkta 🔴🟡🟢, och flera lagade och bevisade (se 02-riskbedomning.md).
- **Arbetssätt:** 7 steg, från att förstå koden till att leverera.
- **Spårbarhet:** varje commit går att förklara – vad, varför och att AI-stöd användes.
- **Jag är grinden:** AI genererar, men jag granskar block för block och beslutar.
- **Kostnadsmedveten:** gratis kontroller först, dyr AI-granskning sist.

## 6. Tre saker jag kan berätta om
1. **Mutationstestet:** servern svarade 403, men hade redan avbrutit beställningen.
   > "Jag lärde mig att kolla datan, inte bara svaret."
2. **Migreringsplanen:** provkörningen hittade ett fel i backstegen.
   > "En plan som bara är skriven är en gissning."
3. **Säkerhetsagenten:** automatiken hittade 0 fel, men agenten hittade ett hängande anrop.
   > "Granskning i lager – billigt först, dyrt sist."

Alla lärdomar: [08-vad-jag-har-lart-mig.md](08-vad-jag-har-lart-mig.md)
