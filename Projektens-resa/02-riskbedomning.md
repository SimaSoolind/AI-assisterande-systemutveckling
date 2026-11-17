# Steg 2: Riskbedömning
Leta efter fel och säkerhetsrisker. Märk varje risk som hög 🔴, medel 🟡 eller låg 🟢.

- 🟡 Headern `X-Powered-By: Express` visar vilken teknik servern använder (informationsläckage).
- 🔴 Vem som helst kan skriva vilket id som helst i `X-Customer-Id` och låtsas vara en annan kund (src/auth.ts). Med flit i övningen. Lösning i ett riktigt system: JWT, en signerad token som inte går att fejka. OWASP: Identification and Authentication Failures.
- 🟡 E-postadressen kontrolleras inte. `"hej"` godkänns som e-post (src/services/customerService.ts). Lösning: kontrollera formatet, t.ex. med Zod, och svara 400.
- 🟡 Samma e-post kan registreras flera gånger. Databasen har ingen regel om unik e-post (db/schema.sql). Lösning: `UNIQUE` på `email` som en migrering, och svara 409.
- 🟡 Lösenordet `postgres` står i koden som reservadress (src/db.ts). Kodstandarden säger: inga lösenord i koden. Lösning: ta bort reservadressen efter `??` och stoppa appen med ett tydligt fel om `DATABASE_URL` saknas.
- 🟡 Ingen gemensam felhanterare. Om databasen kraschar fångas felet inte, och klienten kan bli utan svar (src/app.ts, src/http.ts). Lösning: en gemensam felhanterare i app.ts som svarar 500 utan interna detaljer. Se 03-planera.md.
  **Bevisad 17/nov:** utan `parseId` kraschade SQL på `NaN`, och anropet hängde utan svar (se 05-testa.md).
  Risk för DoS: många hängande anrop kan fylla servern. Höjd till 🔴 hög.
- 🟢 403 avslöjar att en beställning finns, även om den är någon annans (src/services/orderService.ts). Lösning: svara 404 i stället, så att en angripare inte kan se vilka id:n som finns.
