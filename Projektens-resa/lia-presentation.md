# LIA-presentation: En rigg för en kodbas
Grund till intervjun 23 nov och till sida B. Varje del är en mening jag kan säga.

## 1. Problemet
> "Ett team ska börja använda en AI-kodagent. Om alla skriver egna instruktioner i chatten arbetar agenten olika för varje person, och ingen kan se i efterhand vad som hände."

## 2. Min lösning: en rigg
> "Jag byggde en rigg. Det är regler och verktyg som ligger i repot, så att agenten arbetar likadant för alla."

| Del | Vad den gör | Exempel |
|---|---|---|
| Behörigheter | Bestämmer vad agenten får göra | Den får aldrig läsa `.env` |
| Kodstandard | Kontrollerar koden automatiskt | Linter och typkontroll |
| Skills | Färdiga arbetssätt | `/tdd`: tester skrivs först |
| Subagenter | Hjälpagenter med en uppgift var | En granskar säkerheten |
| Hooks | Stoppar fel automatiskt | Agenten får inte ta bort tester |
| Sessionsloggar | Visar vad som hände och varför | En logg per arbetspass |

## 3. Tre arbeten där jag använde riggen
1. **Ny funktion:** från krav till granskad kod, med tester först.
2. **Granskning:** jag hittade brister i kod som AI hade skrivit.
3. **Modernisering:** en gammal Python-fil med SQL injection, som jag gjorde säker utan att priset ändrades.

## 4. Resultatet
> "Mina mätningar visar ..."

Fylls i när arbetet är klart:
- Antal fel som hookarna stoppade:
- Antal fel som kodstandarden fångade:
- Tokens, tid eller kostnad per arbete:

## 5. Varför det passar för LIA
- **Säkerhet:** risker hittade och märkta 🔴🟡🟢 (se 02-riskbedomning.md)
- **Arbetssätt:** 7 steg, från att förstå koden till att leverera
- **Spårbarhet:** varje commit går att förklara
