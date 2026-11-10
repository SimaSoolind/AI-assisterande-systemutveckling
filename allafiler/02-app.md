## Fil 2: src/app.ts filen som bygger appen. Den bestämmer vilka adresser API:t svarar på.
- Bygger appen med Express.
- express.json() gör om JSON i förfrågan till ett objekt.
- /health svarar {"status":"ok"}. Visar att servern lever.
- Kopplar in routes för kunder och beställningar.
- Används av server.ts och av testerna.

```ts
import express from "express";
import { customers } from "./routes/customers";
import { orders } from "./routes/orders";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use(customers);
  app.use(orders);
  return app;
}
```
