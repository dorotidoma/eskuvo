/**
 * RSVP backend (Google Apps Script, a Google Táblázathoz kötve)
 *
 * Mindenki a saját nevével tölti ki a formot (párok is külön-külön).
 * A válaszok a "Válaszok" lapra kerülnek. Ha valaki ugyanazzal a névvel
 * újra kitölti, a sora frissül (nem duplázódik).
 *
 * Beállítás: lásd rsvp/BEALLITAS.md
 */

const SHEET_RESP = 'Válaszok';
const HEADERS = ['Időpont', 'Név', 'Jön?', 'Ételérzékenység', 'Szállás', 'Kutya', 'Üzenet'];

/** Futtasd egyszer (vagy újra): létrehozza / frissíti a Válaszok lap fejlécét. */
function setup() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(SHEET_RESP) || ss.insertSheet(SHEET_RESP);
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.website) return json({ ok: true }); // honeypot: bot töltötte ki

    const name = clean(d.name, 120);
    if (!name || typeof d.attending !== 'boolean') return json({ ok: false, error: 'invalid' });

    const yn = v => (v === true ? 'Igen' : v === false ? 'Nem' : '');
    const row = [
      new Date(),
      name,
      yn(d.attending),
      d.attending ? clean(d.diet, 300) : '',
      d.attending ? yn(d.lodging) : '',
      d.attending ? yn(d.dog) : '',
      clean(d.message, 2000)
    ];

    const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_RESP);
    const existing = findRow(sheet, name);
    if (existing) sheet.getRange(existing, 1, 1, row.length).setValues([row]);
    else sheet.appendRow(row);

    return json({ ok: true, updated: !!existing });
  } catch (err) {
    return json({ ok: false, error: 'server' });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- segédfüggvények ---------- */

// Ugyanaz a név (kis/nagybetű, ékezet, szóköz nem számít) → ugyanaz a sor.
function findRow(sheet, name) {
  const key = norm(name);
  const names = sheet.getRange(1, 2, Math.max(sheet.getLastRow(), 1), 1).getValues();
  for (let i = 1; i < names.length; i++) {
    if (norm(names[i][0]) === key) return i + 1;
  }
  return 0;
}

function norm(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

// Levágja a hosszt, és megakadályozza, hogy a cellába képlet kerüljön (=, +, -, @ az elején).
function clean(s, max) {
  const v = String(s == null ? '' : s).trim().slice(0, max || 500);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
