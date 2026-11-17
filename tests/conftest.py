# pytest läser den här filen före testfilerna.
# Testerna körs alltid mot testdatabasen, samma som tests/helpers/env.ts för Jest.
# Måste ske före importen av price_calc, som ansluter till databasen direkt.
import os

# Adressen till testdatabasen (TEST_DATABASE_URL om den finns, annars Docker på port 5433)
os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/butik_test"
)
