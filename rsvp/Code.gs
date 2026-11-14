/**
 * RSVP backend (Google Apps Script, a Google Táblázathoz kötve)
 *
 * Lapok:
 *   "Vendégek": Kód | Név 1 | Név 2 | Megjegyzés   (egy sor = egy meghívó; Név 2 üres, ha egyedül hívjuk)
 *   "Válaszok": a beérkező visszajelzések (kódonként egy sor, újraküldéskor frissül)
 *
 * Beállítás: lásd rsvp/BEALLITAS.md
 */

const SHEET_GUESTS = 'Vendégek';
const SHEET_RESP = 'Válaszok';
const RESP_HEADERS = [
  'Időpont', 'Kód', 'Meghívó', 'Jön (fő)', 'Ki jön', 'Ki nem jön', 'plusz egy neve',
  'Ételérzékenység', 'Szállás', 'Kutya', 'Üzenet', 'Nyers adat'
];
const RAW_COL = RESP_HEADERS.length; // utolsó oszlop: nyers JSON (előtöltéshez)

/** Egyszer futtasd: létrehozza a lapokat és a fejléceket. */
function setup() {
  const ss = SpreadsheetApp.getActive();
  const g = ss.getSheetByName(SHEET_GUESTS) || ss.insertSheet(SHEET_GUESTS);
  if (g.getLastRow() === 0) g.appendRow(['Kód', 'Név 1', 'Név 2', 'Megjegyzés']);
  g.setFrozenRows(1);
  const r = ss.getSheetByName(SHEET_RESP) || ss.insertSheet(SHEET_RESP);
  if (r.getLastRow() === 0) r.appendRow(RESP_HEADERS);
  r.setFrozenRows(1);
}

/** Kitölti az üres Kód cellákat véletlen, nehezen kitalálható kódokkal. */
function generateCodes() {
  const g = SpreadsheetApp.getActive().getSheetByName(SHEET_GUESTS);
  const data = g.getDataRange().getValues();
  const used = new Set(data.slice(1).map(r => String(r[0]).trim().toLowerCase()).filter(Boolean));
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() || !String(data[i][1]).trim()) continue;
    let c;
    do {
      c = '';
      for (let k = 0; k < 7; k++) c += abc[Math.floor(Math.random() * abc.length)];
    } while (used.has(c));
    used.add(c);
    g.getRange(i + 1, 1).setValue(c);
  }
}

function doGet(e) {
  const code = normCode(e.parameter.m);
  const guest = code && findGuest(code);
  if (!guest) return json({ ok: false });
  const prev = findResponse(code);
  return json({
    ok: true,
    names: guest.names,
    previous: prev ? safeParse(prev.values[RAW_COL - 1]) : null
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.website) return json({ ok: true }); // honeypot: bot töltötte ki

    let code = normCode(d.code);
    const guest = code ? findGuest(code) : null;
    if (!guest) code = '';

    const people = (Array.isArray(d.people) ? d.people : [])
      .map(p => ({
        name: clean(p && p.name, 120),
        attending: !!(p && p.attending),
        diet: clean(p && p.diet, 300),
        plusOne: !!(p && p.plusOne)
      }))
      .filter(p => p.name)
      .slice(0, 4);
    if (!people.length) return json({ ok: false, error: 'name' });

    const coming = people.filter(p => p.attending);
    const notComing = people.filter(p => !p.attending);
    const plus = people.find(p => p.plusOne);
    const diets = coming.filter(p => p.diet).map(p => p.name + ': ' + p.diet).join('; ');
    const yn = v => (v === true ? 'Igen' : v === false ? 'Nem' : '');

    const row = [
      new Date(),
      code,
      guest ? guest.names.join(' és ') : people.filter(p => !p.plusOne).map(p => p.name).join(' és '),
      coming.length,
      coming.map(p => p.name).join(', '),
      notComing.map(p => p.name).join(', '),
      plus ? plus.name : '',
      diets,
      coming.length ? yn(d.lodging) : '',
      coming.length ? yn(d.dog) : '',
      clean(d.message, 2000),
      JSON.stringify({ people, lodging: d.lodging, dog: d.dog, message: clean(d.message, 2000) })
    ];

    const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_RESP);
    const existing = code ? findResponse(code) : null;
    if (existing) sheet.getRange(existing.row, 1, 1, row.length).setValues([row]);
    else sheet.appendRow(row);

    return json({ ok: true, updated: !!existing });
  } catch (err) {
    return json({ ok: false, error: 'server' });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- segédfüggvények ---------- */

function findGuest(code) {
  const data = SpreadsheetApp.getActive().getSheetByName(SHEET_GUESTS).getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (normCode(data[i][0]) === code) {
      const names = [data[i][1], data[i][2]].map(n => String(n).trim()).filter(Boolean);
      return names.length ? { names } : null;
    }
  }
  return null;
}

function findResponse(code) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_RESP);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (normCode(data[i][1]) === code) return { row: i + 1, values: data[i] };
  }
  return null;
}

function normCode(c) {
  return String(c || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
}

// Levágja a hosszt, és megakadályozza, hogy a cellába képlet kerüljön (=, +, -, @ az elején).
function clean(s, max) {
  const v = String(s == null ? '' : s).trim().slice(0, max || 500);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function safeParse(s) {
  try { return JSON.parse(s); } catch (e) { return null; }
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
