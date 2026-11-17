# Plan – Arbete 1: Avbryta en beställning

**Mål:** En kund kan avbryta sin egen beställning inom 30 minuter.
Kriterier: docs/arbete-1/1-user-story.md · Research: docs/arbete-1/2-research.md

## Steg (ett test först i varje steg)
- [x] Steg 1: Inom 30 minuter → 200 och status 'cancelled' (fall 1)
- [ ] Steg 2: Efter 30 minuter → 409 (fall 2)
- [ ] Steg 3: Redan avbruten eller skickad → 409 (fall 3 och 8)
- [ ] Steg 4: Någon annans → 403, finns inte → 404 (fall 4 och 7)
- [ ] Steg 5: Inte inloggad → 401, id inte ett tal → 400 (fall 5 och 6)
- [ ] Steg 6: ADR om att tiden räknas i databasen (docs/adr/)

## Klart när
- [ ] Alla 8 fall har ett test, och alla tester är gröna (npm test)
- [ ] npm run lint och npm run typecheck visar 0 fel
- [ ] npm run format:check visar 0 fel
- [ ] Tiden räknas i databasen med now()

## Utanför (rör vi inte)
- Avbryta betalda beställningar ('paid'): kräver återbetalning
- price_calc.py (Arbete 3)
- Ändringar i databasens tabeller: status och created_at finns redan
