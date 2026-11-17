# Karakteriseringstest för jobs/nightly_report.py.
# Det låser fast vad skriptet svarar i dag för datumet 2026-10-07.
# Facit: körning mot testdatabasen. Se även docs/adr/0002-konstiga-beteenden-i-price-calc.md

# Gör så att vi kan starta skriptet som en egen process
import os
import subprocess
import sys

# conftest.py sätter DATABASE_URL till testdatabasen innan testet körs


# Order 1045 har den utgångna rabatten GAMMAL15 (O1). Den dras ändå av och ska bevaras
def test_nightly_report_2026_10_07_skriver_1_betald_order_689_56_kr():
    # Kör skriptet som en egen process, eftersom det kör på toppnivå
    svar = subprocess.run(
        [sys.executable, "jobs/nightly_report.py", "2026-10-07"],
        capture_output=True,
        text=True,
        env=os.environ,
    )

    # Skriptet ska avsluta utan fel
    assert svar.returncode == 0

    # Raden ska vara exakt som i dag, utan radbrytning i slutet
    assert svar.stdout.strip() == "2026-10-07: 1 betalda ordrar, totalt 689.56 kr"
