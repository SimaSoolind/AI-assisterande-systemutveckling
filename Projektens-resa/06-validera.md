# Steg 6: Validera
Kontrollera att jag har byggt rätt sak. Stämmer det med planen och kraven? Kör lint och typecheck.

## Arbete 1: Klart när i docs/plan.md (måndag 17/nov)
| Klart när | Kommando | Resultat |
|-----------|----------|----------|
| Alla 8 fall har ett test, alla gröna | `npm test` (med `.venv` aktiverad) | ✅ 24 av 24 tester, 2 av 2 testfiler |
| Lint och typer | `npm run lint` · `npm run typecheck` | ✅ 0 fel · 0 fel |
| Formatering | `npm run format:check` | ✅ 0 fel |
| Tiden räknas i databasen | `now()` i `UPDATE` i `src/services/orderService.ts` | ✅ |

## Byggde jag rätt sak? Fall → test
| Fall | Kod | Test | Commit |
|------|-----|------|--------|
| 1 inom 30 min | 200 | avbryter en ny beställning | `8cad505` |
| 2 efter 30 min | 409 | flyttar `created_at` 31 min bakåt | `8441a43` |
| 3 redan avbruten / 8 skickad | 409 | `it.each(["cancelled", "shipped"])` | `460a9df` |
| 4 någon annans | 403 | kund 2 försöker – status fortfarande `new` | `a44ec65` |
| 7 finns inte | 404 | beställning 9999 | `20550a3` |
| 5 inte inloggad | 401 | ingen `X-Customer-Id` | `e442a28` |
| 6 id inte ett tal | 400 | `/orders/banan/cancel` | `4ffe276` |

Alla 8 acceptanskriterier i `docs/arbete-1/1-user-story.md` har ett test.

## Beslut och dokumentation
- ADR 0001: 30-minutersregeln räknas i databasen med `now()` – `docs/adr/0001-tiden-i-databasen.md`.
- API-kontraktet: `POST /orders/:id/cancel` med 200, 400, 401, 403, 404, 409 i `docs/api.md` – commit `e15a3b8`.
- tsconfig: `node16` + `isolatedModules`, så att VS Code (TS 6) och ts-jest inte varnar – commit `2367015`.

## Kvar att validera
- [ ] Granskning med agenterna granskare och sakerhetsgranskare → `docs/arbete-1/3-granskning.md`
- [ ] Verifiering mot den riktiga servern med curl → `docs/arbete-1/4-verifiering.md`
