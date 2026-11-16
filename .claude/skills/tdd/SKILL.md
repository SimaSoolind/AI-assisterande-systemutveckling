---
name: tdd
description: Ett steg ur docs/plan.md med test först. Anrop: /tdd <steg>
---
Du ska genomföra följande steg ur planen: $ARGUMENTS

Arbeta i den här ordningen och hoppa inte över något:

1. Läs docs/plan.md och hitta steget. Läs docs/standard.md och koden som berörs.
2. Skriv ETT nytt test i tests/ för det nya beteendet. Följ mönstret i
   tests/orders.test.ts. Rör inte src/.
3. Kör npm test och visa att det nya testet är rött. Är det grönt: stanna.
   Går testerna inte att köra: stanna och säg att databasen ska startas
   med npm run db:up.
4. Gör den minsta ändring i src/ som får testet grönt. Regler och kontroller
   hör hemma i src/services/ och returnerar Result.
5. Kör npm test, npm run typecheck och npm run lint. Allt ska vara grönt.
6. Ta aldrig bort och stäng aldrig av ett test.
7. Visa diffen och vänta på min granskning. Gör ingen commit.
