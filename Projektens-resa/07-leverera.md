# Steg 7: Leverera
**Regler – så här gör jag:** Jag sparar i git med ett tydligt meddelande. Jag lämnar in eller publicerar.
Jag skriver vad jag lärde mig.

## Spara i git (15–17 nov)
- Små commits, en sak per commit. Varje meddelande säger vad, varför, att AI-stöd användes och vad granskningen ändrade.
- `git status` före varje commit: ingen `.env`, ingen `node_modules`. Filnamn i `git add`, inte bara en punkt.
- Rigg-mallen är privat och ligger i `.gitignore` (commit `9a60e1e`).

## Beslut och loggar
| Fil | Innehåll | Commit |
|-----|----------|--------|
| `docs/adr/0001-tiden-i-databasen.md` | 30-minutersregeln räknas i databasen med `now()` | `c36b226` |
| `docs/adr/0002-konstiga-beteenden-i-price-calc.md` | O1, O2, O3 och en decimal bevaras tills någon har beslutat | `940fdd7` |
| `sessions/pass-1.md` | riggen, 16 nov | `f251c00` |
| `sessions/pass-2.md` | Arbete 1 och 3, med bevis och förbrukning, 17 nov | `e9411ba` |

## Lämna in
- [ ] Mallen ifylld (`docs/mall-svar.md`) och sparad som PDF
- [ ] Karta i README: var läraren hittar vad
- [ ] `git tag inlamning` och `git push --tags`
- [ ] Länken till repot på Learnpoint
- [ ] Arbete 2: lärarens pull request på seminariet
- [ ] Redovisning 19 nov

## Vad jag lärde mig
Alla mina lärdomar står samlade i [08-vad-jag-har-lart-mig.md](08-vad-jag-har-lart-mig.md) – under Steg 7.
