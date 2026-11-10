### Den här filen kommer jag skriva alla steg har gjort för projektet. 
1. steg för steg in för projektet: Studera koden -> göra en   
-  Riskbedömning -> Planera -> Bygga med säkerhet -> Testa ->
- validera -> leverera.

Steg 1: Studera koden (pågår)datum tisdag 10/nov
- Klonade repot och läste README och docs.
- Ändrade databasens port från 5432 till 5433, eftersom min egen PostgreSQL redan använder 5432.
- Ändrade i: docker-compose.yml, tests/helpers/env.ts, .env
-  installerade en ny Python, version 3.12, för att den gamla var för gammal.
-  skapade en mapp .venv för projektets Python-tillägg.
-  installerade psycopg så att Python kan nå databasen.


### Installation (tisdag 10/nov)
1. `npm install` – installerade Node-paketen.
2. `cp .env.example .env` – skapade min egen .env-fil.
3. Startade Docker Desktop. Felet "Cannot connect to the Docker daemon" betydde att Docker inte var igång.
4. `npm run db:up` – startade databasen i Docker.

### Problem 1: Porten var upptagen
- Fel: `role "postgres" does not exist`.
- Orsak: min egen PostgreSQL använder redan port 5432. Projektet pratade med fel databas.
- Lösning: bytte till port 5433 i docker-compose.yml, tests/helpers/env.ts och .env.
5. `npm run db:reset` – skapade tabeller och testdata i båda databaserna.

### Problem 2: Pristestet var rött (15 av 16)
- Orsak: Python saknade paketet psycopg, som pratar med PostgreSQL.
6. Skapade en virtuell miljö (en egen mapp med Python-paket för projektet).

### Problem 3: För gammal Python
- Fel: `psycopg-binary==3.2.3` fanns inte för Python 3.9.
- Lösning: `brew install python@3.12`.
7. Tog bort gamla .venv och skapade en ny med `python3.12 -m venv .venv`.
8. `source .venv/bin/activate` och `pip install -r requirements.txt`.
9. `npm test` – 16 av 16 gröna. ✅

### Att komma ihåg varje gång
- Docker Desktop måste vara igång.
- Kör `source .venv/bin/activate` i varje ny terminal.

### Efter installationen (tisdag 10/nov)
10. La till `.venv/` och `.DS_Store` i .gitignore, så att de inte sparas i git.
11. `npm start` – startade API:t på http://localhost:3000.
12. Frågade efter priset i en andra terminal:
    `curl -s http://localhost:3000/orders/1042/price -H "X-Customer-Id: 1"`
    Svar: `{"net":"950","vat":"237.5","total":"1187.5"}` ✅

### Lärdomar
- Terminalen med `npm start` är upptagen. Kör curl i en andra terminal.
- Stoppa servern med `Ctrl + C`.
- Öppna en fil med `code filnamn`, inte bara filnamnet.

### Fynd att ta med i steg 3 (riskbedömning)
- `npm install` visade 15 sårbarheter (1 hög).
- Priset har inte två decimaler (`"950"` i stället för `"950.00"`). Det bryter mot docs/standard.md.
