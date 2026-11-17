# Arbete 1 – Granskning: Avbryta en beställning

Granskat 2026-11-17. Filer: `src/routes/orders.ts`, `src/services/orderService.ts`, `tests/orders.test.ts`.
Mot: `docs/plan.md`, `docs/standard.md`, `docs/arbete-1/1-user-story.md`, `docs/adr/0001-tiden-i-databasen.md`.
Ingen kod ändrades under granskningen.

Granskning i lager, billigast först (AI D2-F5): automatik → agenter → jag beslutar.

## 1. Vad automatiken hittade

| Verktyg | Typ | Resultat |
|---------|-----|----------|
| eslint (`npm run lint`) | SAST | 0 fel |
| tsc (`npm run typecheck`) | typer | 0 fel |
| prettier (`npm run format:check`) | format | ok |
| jest (`npm test`, utan cache) | tester | 24 av 24 gröna, inga varningar |
| npm audit | SCA | 8 sårbarheter: 1 hög (`body-parser` <1.20.9, DoS), 7 medel (bl.a. `minimatch`). Rättning finns via `npm audit fix`. |

Under bygget (Steg 4–5) bevisade jag också att testerna blir röda när skyddet tas bort:
- utan ägarkollen: 403-testet rött (status blev `cancelled`), 404-testet rött (409)
- utan `requireCustomer`: TypeScript stoppade koden (TS2352)
- utan `parseId`: anropet hängde (se fynd S1)

## 2. Vad agenterna hittade

### Agent `granskare` (mot plan och standard)
Inga fynd med hög eller medel allvar. Alla 8 kriterier har test.

| # | Var | Fynd | Allvar |
|---|-----|------|--------|
| G1 | docs/plan.md | Steg 6 och "Klart när" inte avbockade. ADR inte committad. | låg |
| G2 | orderService.ts:86 | `cancelOrder` är pilfunktion, `createOrder`/`getOrder` är `function`. Blandad stil. | låg |
| G3 | orders.test.ts:75-88 | Fall 1: testet skapar beställningen nyss (0 min), kriteriet säger 10 min. | låg |
| G4 | orders.test.ts:75-88 | Fall 1 kollar bara svaret, inte ett separat GET som de andra testerna. | låg |
| G5 | orderService.ts:93-97 | `UPDATE` saknar `AND customer_id = $2` (extra skydd). | låg |

### Agent `sakerhetsgranskare`

**Ny kod**

| # | Var | Fynd | Allvar | SAL |
|---|-----|------|--------|-----|
| S1 | routes/orders.ts:46-53 | Async-route utan try/catch. Express 4 fångar inte felet → inget svar, processen kan krascha. | hög | F5 felhantering |
| S2 | routes/orders.ts:9-12 `parseId` | Ingen övre gräns. `id` är int4 (max 2147483647). **Bekräftat:** `POST /orders/3000000000/cancel` → ohanterat fel `value "3000000000" is out of range for type integer`, inget svar. | hög (med S1) | F4 indata |
| S3 | orderService.ts:93-97 | `UPDATE` filtrerar inte på `customer_id`. Inte exploaterbart i dag, men skyddet ligger utanför skrivningen. Samma som G5. | låg | F2/F3 åtkomst |
| S4 | orderService.ts:88, 93, 105 | Tre frågor utan transaktion. Statusbytet är atomärt (bra). Svaret kan i sällsynta fall visa en nyare status. | låg | race condition |
| S5 | orders.test.ts | Inget test för för stort id eller två samtidiga avbrott. | låg | F4/F8 test |

**Befintlig kod som påverkar funktionen**

| # | Var | Fynd | Allvar | SAL |
|---|-----|------|--------|-----|
| B1 | auth.ts:7-16 | "Inloggning" är bara headern `X-Customer-Id`, inget verifieras. Känd förenkling i övningen. | hög i produktion | F3 autentisering |
| B2 | orderService.ts:70-76 | 403 och 404 skiljer sig → man kan gissa vilka id som finns. Följer standard.md (medvetet val). | låg | informationsläckage |
| B3 | app.ts:5-14 | Ingen global error handler. Grundorsak till S1, gäller alla async-routes. | medel | F5 felhantering |
| B4 | db.ts:4-5 | Reservvärde med inbyggt lösenord om `DATABASE_URL` saknas. Bryter mot standard.md (hemligheter). | låg | F4/F6 hemligheter |

**Bra enligt agenten:** all SQL med `$1`, `requireCustomer` + `req.customerId`, ägarkoll i tjänstelagret,
tid och status atomärt i `UPDATE`, `parseId` avvisar text/0/negativa, felsvar utan SQL eller stack trace,
403- och 401-testerna kollar att statusen inte ändrades.

## 3. Vad jag beslutade

> Jag är grinden. Fyll i: **Rätta nu** / **Senare (Arbete 2)** / **Rättas inte** + varför.

| Fynd | Mitt beslut | Varför |
|------|-------------|--------|
| S2 för stort id | **Rätta nu** | Hög och bekräftad: anropet hänger. Liten ändring i parseId (max 2147483647) + ett test. |
| S1 + B3 felhantering async | Senare | Gäller hela appen, inte bara Arbete 1. Kräver en global error handler och egen plan. Risken står i 02-riskbedomning.md. |
| S3 / G5 `customer_id` i UPDATE | **Rätta nu** | En rad. Försvar på djupet: skyddet ligger i samma fråga som skrivningen. 403-testet skyddar redan. |
| npm audit (1 hög) | Senare, eget steg | `npm audit fix` ändrar beroenden. Kräver egen commit och att alla tester körs igen. |
| G3 fall 1: 10 minuter | Rättas inte | 0 minuter ligger också inom 30. Kriteriet testas ändå rätt. |
| G4 fall 1: separat GET | Rättas inte | Svaret kommer från getOrder efter UPDATE, så det visar redan databasens status. |
| G2 blandad stil | Rättas inte | Pilfunktion är lärarens krav i mina andra kurser. Ingen påverkan på funktionen. |
| S4 transaktion | Rättas inte | Statusbytet är atomärt. Bara svaret kan i sällsynta fall visa en nyare status. |
| S5 fler tester | Delvis | Test för för stort id kommer med S2. Test för två samtidiga avbrott: senare. |
| B1 header-inloggning | Rättas inte | Medveten förenkling i övningen. I produktion: JWT (02-riskbedomning.md). |
| B2 403 vs 404 | Rättas inte | Följer docs/standard.md. Medvetet val. |
| B4 lösenord i db.ts | Senare | Befintlig kod utanför Arbete 1. Står i 02-riskbedomning.md. |
| G1 plan och ADR | **Rätta nu** | Bocka av och committa. |
