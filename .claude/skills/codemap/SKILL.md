---
name: codemap
description: Skriver eller uppdaterar docs/codemap.md, en karta över filerna i src/, jobs/ och db/. Anrop: /codemap
---
Uppdatera docs/codemap.md så att den stämmer med koden just nu.

1. Lista filerna i src/, jobs/, scripts/ och db/. Läs aldrig .env.
2. Skriv en rad per fil: sökväg, vad filen gör (en mening),
   och vilka andra filer den anropar.
3. Rita flödet för en förfrågan som en kort lista:
   route → middleware → service → db.ts → databas.
4. Märk filer som är äldre kod (src/legacy/, jobs/) med "äldre".
5. Ändra bara docs/codemap.md. Ändra ingen kod.
6. Visa diffen och vänta på min granskning. Gör ingen commit.
