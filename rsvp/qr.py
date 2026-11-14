"""QR kódok a meghívókra.

Használat:
  1. A Google Táblázatban a "Vendégek" lapon: Fájl → Letöltés → CSV
  2. pip3 install segno
  3. python3 rsvp/qr.py Vendegek.csv
     → qr/ mappába kerül meghívónként egy SVG (nyomdába) és egy PNG (előnézet)

A qr/ mappa és a CSV ne kerüljön a publikus repóba (.gitignore-ban van).
"""
import csv
import re
import sys
import unicodedata
from pathlib import Path

import segno

BASE_URL = "https://dorotidoma.hu/"
OUT = Path("qr")


def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-").lower() or "vendeg"


def main(path):
    OUT.mkdir(exist_ok=True)
    n = 0
    with open(path, newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            code = (row.get("Kód") or "").strip()
            names = [x.strip() for x in (row.get("Név 1"), row.get("Név 2")) if x and x.strip()]
            if not code or not names:
                continue
            url = f"{BASE_URL}?m={code}#visszajelzes"
            qr = segno.make(url, error="m")
            base = OUT / f"{slug(' '.join(names))}_{code}"
            qr.save(f"{base}.svg", scale=10, border=2, dark="#2c2826")
            qr.save(f"{base}.png", scale=12, border=2, dark="#2c2826")
            print(f"{' és '.join(names):40} {url}")
            n += 1
    print(f"\n{n} QR kód elkészült: {OUT.resolve()}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Használat: python3 rsvp/qr.py Vendegek.csv")
    main(sys.argv[1])
