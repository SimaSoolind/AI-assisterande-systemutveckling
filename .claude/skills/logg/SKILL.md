---
name: logg
description: Skriver ett utkast till sessionslogg i sessions/ med de sex rubrikerna. Anrop: /logg <passnummer>
---
Skriv ett utkast till sessions/pass-$ARGUMENTS.md.

1. Läs den senaste sessionsloggen i sessions/ och git log sedan dess.
2. Använd exakt de här rubrikerna:
   ## Läge
   ## Fungerade (med bevis)
   ## Misslyckades
   ## Återstår
   ## Beslut
   ## Förbrukning
3. Bevis är en commit, en testkörning eller en fil. Skriv commit-id.
4. Under Förbrukning: lämna tokens och tid tomma. Jag fyller i dem från /usage.
5. Inga kunduppgifter, inga lösenord, inget från .env.
6. Det är ett utkast. Gör ingen commit. Jag läser och rättar först.
