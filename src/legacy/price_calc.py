# price_calc.py
# prisberakning for ordrar. skriven 2019, flyttad hit fran gamla admin-systemet.
# OBS rör inte avrundningen, ekonomi har stämt av mot den.

import os, sys, json, datetime
from decimal import Decimal
import psycopg

DB = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/butik")
conn = psycopg.connect(DB, autocommit=True)

MOMS = 25
LOGG = os.path.join(os.path.dirname(__file__), "price_calc.log")


class Pris:
    def __init__(self, net, vat, total):
        self.net = net
        self.vat = vat
        self.total = total


def _kapa(belopp):
    # två decimaler
    return Decimal(int(belopp * 100)) / 100


def calc_price(order_id):
    cur = conn.cursor()
    cur.execute("select discount_code from orders where id = %s" % order_id)
    orderrad = cur.fetchone()
    if orderrad == None:
        return None
    rabattkod = orderrad[0]

    cur.execute("select quantity, unit_price from order_lines where order_id = %s" % order_id)
    summa = Decimal(0)
    for antal, styckpris in cur.fetchall():
        summa = summa + antal * styckpris

    if rabattkod:
        cur.execute("select percent from discounts where code = '%s'" % rabattkod)
        rabattrad = cur.fetchone()
        if rabattrad:
            summa = summa - summa * rabattrad[0] / 100

    net = _kapa(summa)
    vat = _kapa(net * MOMS / 100)
    total = net + vat

    try:
        loggfil = open(LOGG, "a")
        loggfil.write("%s %s %s\n" % (datetime.datetime.now().isoformat(), order_id, total))
        loggfil.close()
    except:
        pass

    return Pris(net, vat, total)


if __name__ == "__main__":
    pris = calc_price(int(sys.argv[1]))
    if pris is None:
        print(json.dumps({"error": "finns inte"}))
        sys.exit(1)
    print(json.dumps({"net": str(pris.net), "vat": str(pris.vat), "total": str(pris.total)}))
