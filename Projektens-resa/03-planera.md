# Steg 3: Planera
Välj vad jag ska bygga eller rätta. Dela upp det i små steg. Skriv vad som ska vara klart när jag är färdig.

## Arbete 1: Avbryta en beställning (17/nov) ✅ planerad
- User story och 8 acceptanskriterier: `docs/arbete-1/1-user-story.md`
- Research: `docs/arbete-1/2-research.md`
- Plan med steg, Klart när och Utanför: `docs/plan.md`
- Beslut: tiden räknas i databasen med `now()`, och status + tid kollas i samma UPDATE. Blir ADR 001.
- Beslut: bara status 'new' kan avbrytas. 'paid' kräver återbetalning och är utanför.

## Idéer att planera (från riskbedömningen)

### Gemensam felhanterare (risk 🟡 i 02-riskbedomning.md)
**Mål:** Om något oväntat går fel får klienten alltid ett svar: 500, utan interna detaljer.

Som en gemensam try/catch för hela appen. Skrivs en gång, i `app.ts`.

```ts
// En felhanterare har FYRA parametrar. Då vet Express att den fångar fel.
app.use((error, req, res, next) => {
  // Skriv felet i serverns logg, så att utvecklaren kan se det
  console.error(error);
  // Skicka ett enkelt svar till klienten, utan interna detaljer
  res.status(500).json({ error: { code: "internal", message: "Något gick fel." } });
});
```

**Att tänka på:**
- Express 4 fångar inte fel i `async`-funktioner automatiskt. Det behövs ett extra steg (lär mig i Node-kursen).
- Loggen får inte innehålla personuppgifter (namn, e-post). Det säger kodstandarden.

**Klart när:**
- [ ] Ett test visar att ett databasfel ger 500.
- [ ] Svaret innehåller inga interna detaljer.
- [ ] Alla gamla tester är fortfarande gröna.
