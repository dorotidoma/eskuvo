# RSVP beállítás (Google Táblázat + Apps Script)

A válaszok és a vendéglista egy **privát Google Táblázatban** vannak, nem a repóban.
Az oldal csak egy „beküldési címet” ismer, amin keresztül egy meghívókód neveit le lehet kérni, és választ lehet beküldeni.

## 1. Táblázat és script

1. Hozz létre egy új Google Táblázatot, pl. „Esküvő RSVP”.
2. Menü: **Bővítmények → Apps Script**.
3. Töröld ki a `Code.gs` tartalmát, és másold be a repóból a `rsvp/Code.gs` fájl teljes tartalmát. Mentés (💾).
4. Fent a függvényválasztóban válaszd a `setup`-ot → **Futtatás**. Első alkalommal engedélyt kér
   („Speciális → Ugrás a projekthez (nem biztonságos)” – ez a saját scripted, nyugodtan engedélyezd).
   Létrejön a **Vendégek** és a **Válaszok** lap.

## 2. Vendéglista

A **Vendégek** lapon egy sor = egy meghívó:

| Kód | Név 1 | Név 2 | Megjegyzés |
|---|---|---|---|
| *(üresen hagyod)* | Kiss Anna | Nagy Péter | |
| *(üresen hagyod)* | Szabó Éva | | egyedül → +1-et hozhat |

- Párnál mindkét név, egyedülinél csak a Név 1. A +1 kérdést csak az egyedül meghívottak látják.
- Ha kész a lista, futtasd a `generateCodes` függvényt: kitöltninci az üres **Kód** cellákat (pl. `k7m2qxa`).
  Később felvett vendégeknél csak futtasd újra – a meglévő kódokat nem bántja.

## 3. Közzététel webalkalmazásként

1. Apps Script jobb fent: **Telepítés → Új telepítés**.
2. Típus (fogaskerék): **Webalkalmazás**.
3. Végrehajtás mint: **Én**. Hozzáférés: **Bárki**.
4. **Telepítés** → másold ki a **Webalkalmazás URL-t** (`https://script.google.com/macros/s/…/exec`).
5. Ezt az URL-t kell beírni az `rsvp.js` elején: `var RSVP_URL = '…';`

Ha később módosítod a scriptet: **Telepítés → Telepítések kezelése → ✏️ → Verzió: Új verzió → Telepítés**
(az URL így ugyanaz marad).

## 4. QR kódok

1. A **Vendégek** lapon: **Fájl → Letöltés → Vesszővel elválasztott értékek (.csv)**.
2. `pip3 install segno`
3. `python3 rsvp/qr.py Vendegek.csv` → a `qr/` mappában meghívónként SVG (nyomdába) és PNG.

A QR link így néz ki: `https://dorotidoma.hu/?m=k7m2qxa#visszajelzes` – megnyitáskor a form a nevekkel előtöltve jelenik meg.

## Értesítés új válaszról

A táblázatban: **Eszközök → Értesítési szabályok** → „Bármilyen módosítás történik” → e-mail azonnal.

## Hogy néz ki egy válasz

A **Válaszok** lapon meghívónként egy sor: időpont, kód, meghívó, hány fő jön, ki jön / ki nem, +1 neve,
ételérzékenységek, szállás, kutya, üzenet. Ha valaki újra kitölti (ugyanazzal a QR-ral), a sora frissül.
QR nélkül kitöltött válaszok mindig új sorként jönnek.
