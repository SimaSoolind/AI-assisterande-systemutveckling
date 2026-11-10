## Fil 1: src/server.ts
- Startar servern när jag skriver `npm start`.
- Hämtar appen från app.ts.
- Läser porten från .env. Annars används 3000.
- Pratar inte med databasen.

```ts
import { createApp } from "./app";

const port = Number(process.env.PORT ?? 3000);
createApp().listen(port, () => {
  console.log(`API:t lyssnar på http://localhost:${port}`);
});
```

- ?? är alltså ett kort sätt att skriva hela den if-satsen.

