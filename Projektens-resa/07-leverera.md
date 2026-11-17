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
- **Riggen arbetar åt mig:** hooks stoppar fel automatiskt, och jag behöver inte komma ihåg varje kontroll.
- **Granskning i lager:** gratis verktyg först (lint, typer, tester), dyr AI-granskning sist.
  Automatiken hittade 0 fel, men säkerhetsagenten hittade att ett för stort id fick anropet att hänga.
- **Jag kan inte lita blint på testerna:** ett test som aldrig har varit rött kan vara trasigt. Mutationstest bevisar det.
- **Kolla datan, inte bara svaret:** servern svarade 403, men hade redan ändrat beställningen.
- **Förstå först, ändra sedan:** analys, codemap och karakteriseringstester innan den gamla koden ändrades.
- **En plan som bara är skriven är en gissning:** migreringsplanen hade ett fel som bara syntes när den provkördes.
- **Säkerhet från första raden:** `$1` i Node och `%s` med tupel i Python är samma regel (SAL F4).
- **Kostnad:** över 98 % av alla tokens var cache-läsning. Planen i en fil och en ny chatt per arbete håller kostnaden nere.
