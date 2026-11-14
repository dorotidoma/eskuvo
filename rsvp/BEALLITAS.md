# RSVP beállítás (Google Táblázat + Apps Script)

A válaszok egy **privát Google Táblázatban** gyűlnek, nem a repóban.
Mindenki a saját nevével tölti ki a formot (pároknál is külön-külön).

## 1. Táblázat és script

1. Hozz létre egy új Google Táblázatot, pl. „Esküvő RSVP”.
2. Menü: **Bővítmények → Apps Script**.
   (Ha „Sajnos nem sikerült megnyitni a fájlt” hibát kapsz: több Google-fiókkal vagy bejelentkezve –
   nyisd meg inkognitóablakban, csak azzal a fiókkal.)
3. Töröld ki a `Code.gs` tartalmát, és másold be a repóból a `rsvp/Code.gs` teljes tartalmát. Mentés (💾).
4. Fent a függvényválasztóban válaszd a `setup`-ot → **Futtatás**. Első alkalommal engedélyt kér
   („Speciális → Ugrás a projekthez” – ez a saját scripted, nyugodtan engedélyezd).
   Létrejön / frissül a **Válaszok** lap fejléce.

## 2. Közzététel webalkalmazásként

1. Apps Script jobb fent: **Telepítés → Új telepítés**.
2. Típus (fogaskerék): **Webalkalmazás**.
3. Végrehajtás mint: **Én**. Hozzáférés: **Bárki**.
4. **Telepítés** → a **Webalkalmazás URL** (`https://script.google.com/macros/s/…/exec`) kerül az `rsvp.js` elejére: `var RSVP_URL = '…';`

**Ha módosítod a scriptet:** Telepítés → **Telepítések kezelése** → ✏️ (szerkesztés) → Verzió: **Új verzió** → Telepítés.
Így az URL ugyanaz marad, nem kell az `rsvp.js`-t módosítani. (Az „Új telepítés” új URL-t adna!)

## 3. QR kód a meghívóra

Mindenkinek ugyanaz a QR kód, ami az oldal visszajelzés részére visz:

```
pip3 install segno
python3 rsvp/qr.py
```

→ `qr/visszajelzes.svg` (nyomdába) és `qr/visszajelzes.png`.

## Értesítés új válaszról

A táblázatban: **Eszközök → Értesítési szabályok** → „Bármilyen módosítás történik” → e-mail azonnal.

## A Válaszok lap

Egy sor = egy ember: Időpont | Név | Jön? | Ételérzékenység | Szállás | Kutya | Üzenet.
Ha valaki ugyanazzal a névvel újra kitölti (kis/nagybetű, ékezet nem számít), a sora frissül.
