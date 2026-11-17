# Steg 6: Validera
Kontrollera att jag har byggt rätt sak. Stämmer det med planen och kraven? Kör lint och typecheck.

## Arbete 1: Klart när i docs/plan.md (måndag 17/nov)
| Klart när | Kommando | Resultat |
|-----------|----------|----------|
| Alla 8 fall har ett test, alla gröna | `npm test` (med `.venv` aktiverad) | ✅ 24 av 24 tester (25 efter S2), 2 av 2 testfiler |
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

## Granskning i lager (måndag 17/nov) – commit `3e153d9`
Billigast först (AI D2-F5): automatik → agenter → jag beslutar. Hela granskningen: `docs/arbete-1/3-granskning.md`.

| Lager | Hittade |
|-------|---------|
| Automatik: eslint, tsc, prettier, jest | 0 fel, 24 av 24 gröna |
| Automatik: npm audit (SCA) | 1 hög (body-parser, DoS), 7 medel |
| Agent `granskare` | 5 låga fynd, alla 8 kriterier har test |
| Agent `sakerhetsgranskare` | 2 höga i ny kod (S1, S2), 3 låga, 4 i befintlig kod |

**Viktigaste lärdomen:** automatiken hittade 0 fel, men säkerhetsagenten hittade att ett för stort id
(`/orders/3000000000/cancel`) fick anropet att hänga. Lint och tester räcker inte – därför granskning i lager.

### Jag beslutade (jag är grinden)
| Fynd | Beslut | Commit |
|------|--------|--------|
| S2 för stort id hänger | Rättat: `parseId` nekar id över 2147483647 med 400. Nytt test, rött → grönt. Skyddar alla tre routes som använder `parseId`. | `1044eff` |
| S3 `customer_id` saknades i UPDATE | Rättat: `AND customer_id = $2`. Försvar på djupet (SAL F2). | `c884c34` |
| S1 + B3 ingen global felhanterare | Senare – gäller hela appen. Risken står i 02-riskbedomning.md. | – |
| npm audit | Senare, eget steg – ändrar beroenden. | – |
| 9 övriga | Rättas inte, med motivering i 3-granskning.md | – |

Efter rättningarna: 25 av 25 tester gröna, lint, typecheck och format 0 fel.

## Verifiering mot den riktiga servern (måndag 17/nov)
Startade `npm start` och testade alla 8 fall med curl. Kommandon och svar: `docs/arbete-1/4-verifiering.md`.

| Fall | Svar |
|------|------|
| 1 inom 30 min | ✅ 200, `cancelled` |
| 2 efter 30 min | ✅ 409 |
| 3 redan avbruten | ✅ 409 (samma beställning avbruten två gånger) |
| 4 någon annans | ✅ 403, status fortfarande `new` |
| 5 inte inloggad | ✅ 401 |
| 6 `banan` | ✅ 400 |
| 7 finns inte | ✅ 404 |
| 8 skickad | ✅ 409 |
| Extra: id 3000000000 (S2) | ✅ 400 – förut hängde anropet |

**Varför ett eget lager?** Jest testar appen inuti Node. Curl testar den riktiga servern över HTTP,
med `.env`, porten och Docker-databasen på riktigt.

**Begränsning:** beställning 1040 är både `shipped` och gammal, så fall 8 kan ge 409 av två orsaker.
Det automatiska testet (`it.each`) visar `shipped` ensamt.

## Arbete 1 är klart ✅
Alla rutor i checklistan: user story, acceptanskriterier, research, plan, bygg med tester först,
granska, verifiera, ADR och små commits.
