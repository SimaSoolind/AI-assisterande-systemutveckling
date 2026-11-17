# Steg 2: Riskbedömning
**Regler – så här gör jag:** Jag letar efter fel och säkerhetsrisker. Jag märker varje risk som hög 🔴, medel 🟡 eller låg 🟢.
För varje risk svarar jag på tre frågor: vad kan gå fel, hur illa blir det, och vad kostar det?

## Översikt

| # | Risk | Nivå | Status |
|---|------|------|--------|
| 1 | Vem som helst kan låtsas vara en annan kund | 🔴 | med flit i övningen |
| 2 | Anrop kan hänga utan svar | 🔴 | delvis lagad |
| 3 | SQL injection i price_calc.py | 🔴 | ✅ lagad |
| 4 | Servern visar att den kör Express | 🟡 | kvar |
| 5 | E-post kontrolleras inte | 🟡 | kvar |
| 6 | Samma e-post kan finnas flera gånger | 🟡 | kvar |
| 7 | Lösenord i koden | 🟡 | kvar |
| 8 | Sårbara paket | 🟡 | delvis lagad |
| 9 | SQL med `%` i nattrapporten | 🟡 | kvar |
| 10 | 403 visar att en beställning finns | 🟢 | medvetet val |

---

## 1. Vem som helst kan låtsas vara en annan kund 🔴
| | |
|---|---|
| **Vad kan gå fel?** | Man skriver ett annat id i `X-Customer-Id` och blir den kunden. |
| **Hur illa?** | Mycket. Man kan läsa och avbryta andras beställningar. |
| **Kostnad?** | Förlorat förtroende, och personuppgifter läcker (GDPR). |
| **Var?** | `src/auth.ts` |
| **Lösning** | JWT: en signerad token som inte går att fejka. |
| **Status** | Med flit i övningen. OWASP: Identification and Authentication Failures. |

## 2. Anrop kan hänga utan svar 🔴
| | |
|---|---|
| **Vad kan gå fel?** | Ett oväntat fel fångas inte, och servern svarar aldrig. |
| **Hur illa?** | Många hängande anrop kan fylla servern (DoS). |
| **Kostnad?** | Butiken går inte att använda. |
| **Var?** | `src/app.ts` – ingen gemensam felhanterare |
| **Lösning** | En gemensam felhanterare som svarar 500 utan detaljer. |
| **Status** | Bevisad 17/nov: utan `parseId` hängde anropet. Höjd från 🟡 till 🔴. Ett för stort id är lagat (`1044eff`). Den gemensamma felhanteraren är kvar. |

## 3. SQL injection i price_calc.py 🔴
| | |
|---|---|
| **Vad kan gå fel?** | En elak rabattkod byggs in i SQL-frågan. |
| **Hur illa?** | En kod som inte finns gav ändå 10 % rabatt. |
| **Kostnad?** | Butiken förlorar pengar. |
| **Var?** | `src/legacy/price_calc.py` |
| **Lösning** | Parametriserad SQL: `%s` med värdet i en tupel (SAL F4). |
| **Status** | ✅ Lagad och bevisad (`22a05e4`). |

## 4. Servern visar att den kör Express 🟡
| | |
|---|---|
| **Vad kan gå fel?** | Headern `X-Powered-By: Express` berättar vilken teknik servern använder. |
| **Hur illa?** | En angripare vet vilka svagheter den ska leta efter. |
| **Lösning** | `helmet` eller `app.disable("x-powered-by")`. |
| **Status** | Kvar. |

## 5. E-post kontrolleras inte 🟡
| | |
|---|---|
| **Vad kan gå fel?** | `"hej"` godkänns som e-post. |
| **Var?** | `src/services/customerService.ts` |
| **Lösning** | Kontrollera formatet, t.ex. med zod, och svara 400. |
| **Status** | Kvar. |

## 6. Samma e-post kan finnas flera gånger 🟡
| | |
|---|---|
| **Vad kan gå fel?** | Två konton får samma e-post. |
| **Var?** | `db/schema.sql` – ingen regel om unik e-post |
| **Lösning** | `UNIQUE` på `email` som en migrering, och svara 409. |
| **Status** | Kvar. |

## 7. Lösenord i koden 🟡
| | |
|---|---|
| **Vad kan gå fel?** | Lösenordet `postgres` står som reservadress i koden. |
| **Var?** | `src/db.ts` och `price_calc.py` |
| **Lösning** | Ta bort reservadressen. Stoppa appen med ett tydligt fel om `DATABASE_URL` saknas. |
| **Status** | Kvar. Kodstandarden säger: inga lösenord i koden. |

## 8. Sårbara paket 🟡
| | |
|---|---|
| **Vad kan gå fel?** | Ett paket vi använder har en känd säkerhetsbrist. |
| **Var?** | `npm audit` (SCA) |
| **Lösning** | `npm audit fix` |
| **Status** | `body-parser` och `minimatch` lagade (`dd3fc80`). `picomatch` kvar i Jest och ESLint – riskbeslut, se 06-validera.md. |

## 9. SQL med `%` i nattrapporten 🟡
| | |
|---|---|
| **Vad kan gå fel?** | Datumet byggs in i SQL-texten. |
| **Hur illa?** | Mindre än risk 3: datumet kommer från den som kör jobbet, inte från en kund. |
| **Var?** | `jobs/nightly_report.py:8` |
| **Lösning** | Samma som risk 3. |
| **Status** | Kvar. |

## 10. 403 visar att en beställning finns 🟢
| | |
|---|---|
| **Vad kan gå fel?** | 403 betyder "den finns, men är inte din". En angripare kan gissa vilka id som finns. |
| **Lösning** | Svara 404 i stället. |
| **Status** | Medvetet val: docs/standard.md säger 403. |

---

## Lärdom
Jag hittade risk 2 när jag studerade koden. Sedan bevisade jag den med ett test.
Det är hela SAL-livscykeln: hitta → bevisa → dokumentera.
