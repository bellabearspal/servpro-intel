// ============================================================
// SERVPRO Marketing Intelligence — Google Apps Script
// ============================================================
// SETUP INSTRUCTIONS:
//   1. Go to sheets.google.com → create a new sheet named "SERVPRO Intel"
//   2. Click Extensions → Apps Script
//   3. Delete all default code and paste this entire file
//   4. Click Deploy → New deployment
//        Type: Web app
//        Execute as: Me
//        Who has access: Anyone
//   5. Click Deploy → copy the Web App URL
//   6. Paste that URL into the dashboard under ⚙ Sheets Setup
// ============================================================

const SHEET_NAME = 'SERVPRO Intel';

// ── ENTRY POINTS ────────────────────────────────────────────

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action  = payload.action;
    const ss      = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'save')   return handleSave(ss, payload);
    if (action === 'load')   return handleLoad(ss, payload);
    if (action === 'list')   return handleList(ss);
    if (action === 'delete') return handleDelete(ss, payload);
    if (action === 'ping')   return json({ ok: true, message: 'SERVPRO Intel connected', sheetId: ss.getId() });

    return json({ ok: false, error: 'Unknown action: ' + action });

  } catch(err) {
    return json({ ok: false, error: err.toString() });
  }
}

function doGet(e) {
  try {
    const raw = e.parameter.data;
    if (!raw) return json({ ok: true, message: 'SERVPRO Intel API ready' });

    const payload = JSON.parse(raw);
    const action  = payload.action;
    const ss      = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'list')   return handleList(ss);
    if (action === 'load')   return handleLoad(ss, payload);
    if (action === 'ping')   return json({ ok: true, message: 'SERVPRO Intel connected' });

    return json({ ok: true, message: 'SERVPRO Intel API ready' });

  } catch(err) {
    return json({ ok: false, error: err.toString() });
  }
}

// ── HANDLERS ────────────────────────────────────────────────

function handleSave(ss, payload) {
  const tabName = payload.tabName;   // e.g. "GBP_2026-05"
  const rows    = payload.rows;      // array of arrays (CSV parsed)
  const meta    = payload.meta || {};

  if (!tabName) return json({ ok: false, error: 'tabName required' });
  if (!rows || !rows.length) return json({ ok: false, error: 'No rows provided' });

  // Get or create the tab
  let sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
  } else {
    sheet.clearContents();
  }

  // Write all rows
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);

  // Bold the header row
  sheet.getRange(1, 1, 1, rows[0].length).setFontWeight('bold');
  sheet.setFrozenRows(1);

  // Auto-resize columns (max 300px wide)
  sheet.autoResizeColumns(1, rows[0].length);

  // Update the master index
  updateIndex(ss, tabName, meta, rows.length);

  return json({ ok: true, tab: tabName, rowsSaved: rows.length });
}

function handleLoad(ss, payload) {
  const tabName = payload.tabName;
  if (!tabName) return json({ ok: false, error: 'tabName required' });

  const sheet = ss.getSheetByName(tabName);
  if (!sheet) return json({ ok: false, error: 'Tab not found: ' + tabName });

  const data = sheet.getDataRange().getValues();
  return json({ ok: true, tab: tabName, rows: data, rowCount: data.length });
}

function handleList(ss) {
  const index = ss.getSheetByName('__index__');
  if (!index) return json({ ok: true, datasets: [] });

  const allRows = index.getDataRange().getValues();
  if (allRows.length <= 1) return json({ ok: true, datasets: [] }); // only header

  const datasets = allRows.slice(1).map(r => ({
    tabName:  r[0] || '',
    source:   r[1] || '',
    period:   r[2] || '',
    rows:     r[3] || 0,
    savedAt:  r[4] ? r[4].toString() : ''
  })).filter(d => d.tabName); // remove blank rows

  return json({ ok: true, datasets });
}

function handleDelete(ss, payload) {
  const tabName = payload.tabName;
  if (!tabName) return json({ ok: false, error: 'tabName required' });

  const sheet = ss.getSheetByName(tabName);
  if (sheet) ss.deleteSheet(sheet);

  // Remove from index
  const index = ss.getSheetByName('__index__');
  if (index) {
    const data = index.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][0] === tabName) {
        index.deleteRow(i + 1);
      }
    }
  }

  return json({ ok: true, deleted: tabName });
}

// ── INDEX MAINTENANCE ─────────────────────────────────────────

function updateIndex(ss, tabName, meta, rowCount) {
  let index = ss.getSheetByName('__index__');

  if (!index) {
    index = ss.insertSheet('__index__');
    const headerRow = [['Tab Name', 'Source', 'Period', 'Row Count', 'Last Saved']];
    index.getRange(1, 1, 1, 5).setValues(headerRow);
    index.getRange(1, 1, 1, 5).setFontWeight('bold');
    index.setFrozenRows(1);
    index.setTabColor('#6C3FFF');
  }

  const data    = index.getDataRange().getValues();
  const rowIdx  = data.findIndex((r, i) => i > 0 && r[0] === tabName);
  const newRow  = [
    tabName,
    meta.source  || '',
    meta.period  || new Date().toISOString().slice(0, 7),
    rowCount,
    new Date()
  ];

  if (rowIdx > 0) {
    index.getRange(rowIdx + 1, 1, 1, 5).setValues([newRow]);
  } else {
    index.appendRow(newRow);
  }
}

// ── UTILITIES ────────────────────────────────────────────────

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
