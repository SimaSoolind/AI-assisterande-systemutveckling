# Karakteriseringstester för src/legacy/price_calc.py (Arbete 3).
# De låser fast vad koden svarar i dag, även buggarna.
# Facit: docs/analys-price-calc.md, avsnitt 7 (körning 17 nov).

# Gör så att Python hittar den gamla filen
import sys
from decimal import Decimal

sys.path.insert(0, "src/legacy")

# Importen öppnar en anslutning till databasen. Den måste vara igång
from price_calc import calc_price


# Grundfallet: två lampor och en musmatta, ingen rabatt
def test_order_1042_utan_rabatt_950_plus_moms_blir_1187_50():
    pris = calc_price(1042)
    assert pris.net == Decimal("950")
    assert pris.vat == Decimal("237.5")
    assert pris.total == Decimal("1187.5")
    # Svaret har bara en decimal, inte två
    assert str(pris.total) == "1187.5"


# O3: en beställning utan rader får pris 0 och inget fel
def test_order_1043_utan_rader_blir_0():
    pris = calc_price(1043)
    assert pris.net == Decimal("0")
    assert pris.vat == Decimal("0")
    assert pris.total == Decimal("0")


# O2: momsen 44,9775 kapas till 44,97. Den avrundas inte till 44,98
def test_order_1044_momsen_kapas_inte_avrundas():
    pris = calc_price(1044)
    assert pris.net == Decimal("179.91")
    assert pris.vat == Decimal("44.97")
    assert pris.total == Decimal("224.88")


# O1: rabattkoden GAMMAL15 gällde 2024, men dras ändå av (15 %)
def test_order_1045_utgangen_rabatt_dras_anda_av():
    pris = calc_price(1045)
    assert pris.net == Decimal("551.65")
    assert pris.vat == Decimal("137.91")
    assert pris.total == Decimal("689.56")


# Giltig rabatt SOMMAR20 (20 %) på tre kablar och en powerbank
def test_order_1041_sommar20_ger_20_procent_rabatt():
    pris = calc_price(1041)
    assert pris.net == Decimal("588.8")
    assert pris.vat == Decimal("147.2")
    assert pris.total == Decimal("736.0")
