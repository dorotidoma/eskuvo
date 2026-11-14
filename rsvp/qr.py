"""QR kód a meghívóra (mindenkinek ugyanaz: az oldal visszajelzés részére visz).

Használat:
  pip3 install segno
  python3 rsvp/qr.py
  → qr/visszajelzes.svg (nyomdába) és qr/visszajelzes.png (előnézet)
"""
from pathlib import Path

import segno

URL = "https://dorotidoma.hu/#visszajelzes"
OUT = Path("qr")

OUT.mkdir(exist_ok=True)
qr = segno.make(URL, error="m")
qr.save(OUT / "visszajelzes.svg", scale=10, border=2, dark="#2c2826")
qr.save(OUT / "visszajelzes.png", scale=12, border=2, dark="#2c2826")
print(f"{URL}\n→ {OUT.resolve()}")
