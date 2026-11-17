# ADR 0002: Konstiga beteenden i price_calc.py bevaras

Datum: 2026-11-17
Status: Beslutad

## Sammanhang
Karakteriseringstesterna (tests/test_price_calc.py) låser fast vad `src/legacy/price_calc.py` svarar i dag.
Fyra beteenden ser fel ut. Ingen har beslutat om de är fel. Facit: docs/analys-price-calc.md, avsnitt 7.

| # | Vad koden gör | Exempel | Varför det ser fel ut |
|---|---------------|---------|-----------------------|
| O1 | Drar av rabatten utan att kontrollera `valid_from` / `valid_to` | Order 1045, `GAMMAL15` (gällde 2024): total 689.56 | En utgången rabatt borde inte gälla. Troligen en bugg. |
| O2 | Kapar momsen till två decimaler i stället för att avrunda | Order 1044: moms 44.9775 → 44.97 (inte 44.98) | Vanligt är avrundning. Men kommentaren i filen säger att ekonomi har stämt av mot den. |
| O3 | Ger pris 0 för en order utan rader, utan fel | Order 1043: net 0, vat 0, total 0 | Ingen regel säger om en tom order ska ha ett pris eller ge ett fel. |
| En decimal | Talen har inte alltid två decimaler | Order 1042: `"1187.5"`, inte `"1187.50"` | docs/standard.md säger att priser är strängar med två decimaler. |

## Beslut
Alla fyra **bevaras tills någon har beslutat**. Karakteriseringstesterna låser dem.
Refaktoreringen ändrar namn och struktur, aldrig dessa svar.

## Alternativ som valdes bort
- Rätta direkt: ändrar priser som ekonomi kan ha stämt av mot (O2), och vi vet inte vad som är rätt (O3).
- Ta bort testerna för de konstiga fallen: då märks det inte om beteendet ändras av misstag.

## Konsekvenser
- Bra: inga priser ändras utan ett beslut. Testerna visar exakt vad som ändras när någon rättar.
- Dåligt: kända fel finns kvar i produktion. O1 ger kunder rabatt de inte ska ha.
- Att rätta en av dem: ett eget beslut (ny ADR), ändra testet först, sedan koden. Rabatten finns i `_dra_av_rabatt` (O1).
