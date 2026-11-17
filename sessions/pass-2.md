# Pass 2 – tisdag 17 nov 2026

## Läge
| | |
|---|---|
| Arbete 1 – avbryta en beställning | ✅ klart och committat |
| Arbete 3 – modernisera price_calc.py | ✅ klart och committat |
| Arbete 2 – lärarens pull request | görs på seminariet |
| Kvar till inlämningen | mallen som PDF, karta i README, taggen, redovisningen 19 nov |

---

## Fungerade (med bevis)

### Arbete 1 – POST /orders/:id/cancel
| Vad | Commit |
|-----|--------|
| User story, 8 acceptanskriterier, research och plan | `1b4b537` |
| Steg 1–3 med `/tdd`, testet först | `8cad505`, `8441a43`, `460a9df` |
| Steg 4–5: felfallen 403, 404, 401, 400 | `a44ec65`, `20550a3`, `e442a28`, `4ffe276` |
| ADR 0001: tiden räknas i databasen med `now()` | `c36b226` |
| Granskning i lager: 13 fynd med mina beslut | `3e153d9` |
| Fynd S2 rättat: för stort id hängde, nu 400 | `1044eff` |
| Fynd S3 rättat: `customer_id` i `UPDATE` | `c884c34` |
| Verifiering med curl: alla 8 fall rätt | `9e9f1ff` |

**Mutationstest:** testerna som var gröna direkt bevisades röda.
| Utan | Hände |
|------|-------|
| ägarkollen | svaret var 403, men statusen blev `cancelled` |
| `requireCustomer` | TypeScript stoppade koden |
| `parseId` | anropet hängde |

### Arbete 3 – price_calc.py
| Vad | Commit |
|-----|--------|
| Analys och körning av order 1040–1047 | `748e015` |
| 5 karakteriseringstester, även buggarna O1–O3 | `d625203` |
| Codemap med båda vägarna in | `b6a0af6` |
| Refaktorering 1: tydliga namn | `b2f37ec` |
| Refaktorering 2: rabatten i en egen funktion | `63ee45a` |
| Refaktorering 3: säker SQL – SQL injection bevisad och stängd | `22a05e4` |
| Migreringsplan, provkörd med ROLLBACK | `97d51d0` |
| ADR 0002: konstiga beteenden bevaras | `940fdd7` |

### Riggen
| Vad | Commit |
|-----|--------|
| ESLint med säkerhetsregler och egen regel mot `${}` i SQL | `d7fffeb` |
| `npm audit fix`: 2 av 3 sårbara paket lagade, 1 riskbeslut | `dd3fc80` |
| Agenten utforskare: `paid` och `shipped` sätts utanför koden | `1234946` |
| Agenten testskrivare: test för nattrapporten (väg 2) | `dd09546` |

**Testkörning i slutet:**
| Kontroll | Resultat |
|----------|----------|
| `npm test` | 25 av 25 |
| `npm run test:legacy` | 6 av 6 |
| lint | 0 fel, 2 varningar |
| typer | 0 fel |

---

## Misslyckades
| Problem | Orsak | Lösning |
|---------|-------|---------|
| Pristestet såg trasigt ut | `.venv` var inte aktiverad | `source .venv/bin/activate` |
| Röda fel i testfilen i VS Code | VS Code har TypeScript 6, terminalen 5.9 | `types`, `node16` och `isolatedModules` i tsconfig (`8441a43`, `2367015`) |
| Beviset för 400-testet fick Jest att hänga | ingen felhantering för async-routes | blev fyndet S1 |
| Backsteget i migreringsplanen gick inte | regeln fanns kvar | rättat: ta bort regeln först |
| Steg 3 hamnade i en commit som heter "Steg 2" | agenten hade redan committat steg 2 | förklarat, historiken inte omskriven (`460a9df`) |

---

## Återstår
| Vad | Var beslutet står |
|-----|-------------------|
| Global felhantering för async-routes (S1/B3) | docs/arbete-1/3-granskning.md |
| `picomatch` i Jest och ESLint – riskbeslut | Projektens-resa/06-validera.md |
| Nattrapporten har kvar SQL med `%` | docs/mall-svar.md, "en vecka till" |
| 2 lint-varningar i tests/helpers/db.ts | testkod, varningar först |
| Mallen som PDF, karta i README, `git tag inlamning` | – |
| Öva redovisningen 19 nov | – |

---

## Beslut
- Bara status `new` kan avbrytas, och bara inom 30 minuter. `paid` är utanför (återbetalning).
- Tiden räknas i databasen, inte i Node (ADR 0001).
- Konstiga beteenden i price_calc.py bevaras tills någon har beslutat (ADR 0002).
- Ägaren kollas två gånger: `getOrder` och `customer_id` i `UPDATE` (försvar på djupet).
- Rigg-mallen är privat och ligger inte i repot (`9a60e1e`).
- Arbete 2 görs med lärarens pull request på seminariet.

---

## Förbrukning
Räknat ur Claude Codes loggar för bara ovningsprojekt-chatten, med API-priser (se docs/mall-svar.md, del 8).

| | Arbete 1 | Arbete 3 | Totalt |
|---|----------|----------|--------|
| Tokens | 19,4 milj. | 7,9 milj. | 27,4 milj. |
| Kostnad (API-pris) | 6,8 USD | 2,3 USD | ca 9 USD |
| Aktiv tid i chatten | 3,5 h | 1,3 h | ca 4,8 h |

- Över 98 % av tokens är cache-läsning. Jag har abonnemang.
- **Min arbetstid:** kl 10–20, ca 10 h med pauser.
- Skillnaden mot chattens tid är mitt eget arbete: läsa, granska, dokumentera och besluta.
