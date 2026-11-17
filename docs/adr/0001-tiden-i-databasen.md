# ADR 0001: 30-minutersregeln räknas i databasen

Datum: 2026-11-17
Status: Beslutad

## Sammanhang
En kund får avbryta sin beställning inom 30 minuter efter att den lades.
Frågan är var tiden ska jämföras: i Node-koden eller i databasen.
Två saker gör det svårt: Node och databasen har olika klockor,
och två anrop kan komma samtidigt (race condition).

## Beslut
Tiden, statusen och id:t kollas i samma UPDATE, och databasen räknar tiden med now():

    UPDATE orders SET status = 'cancelled'
    WHERE id = $1 AND status = 'new' AND created_at > now() - interval '30 minutes'

Ändras 0 rader blir svaret 409 (conflict).
Ägaren (403) och att beställningen finns (404) kollas före, med getOrder.


## Alternativ som valdes bort
- Jämföra i Node med Date.now(): två klockor kan visa olika tid,
  och det blir ett glapp mellan läsning och skrivning (race condition).
- Databasregel (trigger eller CHECK): kräver en migrering,
  och planen säger att tabellerna inte ska ändras.

## Konsekvenser
- Bra: en klocka, och kontroll och ändring sker i ett steg. Två avbrott samtidigt ger 200 + 409.
- Bra: värdena skickas som $1 (SAL F4, säker SQL).
- Dåligt: regeln syns inte i TypeScript, bara i SQL-texten.
- Dåligt: samma meddelande för "fel status" och "för sent".
- Dåligt: testet måste flytta created_at bakåt med SQL för att testa 31 minuter.
