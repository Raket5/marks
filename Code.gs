// ============================================================
// Bangladesh Navy School And College - ICT Student Result System
// Google Apps Script Backend
// ============================================================

const ADMIN_USER = "admin";
const ADMIN_PASS = "admin2026";

// Sheet tab names — adjust if yours differ
const SHEET_CONFIG = {
  "6C":  { label: "Class 6 - Section C",  tab: "6C"  },
  "6F":  { label: "Class 6 - Section F",  tab: "6F"  },
  "6G":  { label: "Class 6 - Section G",  tab: "6G"  },
  "7E":  { label: "Class 7 - Section E",  tab: "7E"  },
  "7G":  { label: "Class 7 - Section G",  tab: "7G"  },
  "8C":  { label: "Class 8 - Section C",  tab: "8C"  },
  "8E":  { label: "Class 8 - Section E",  tab: "8E"  },
  "9C":  { label: "Class 9 - Section C",  tab: "9C"  },
  "10D": { label: "Class 10 - Section D", tab: "10D" },
  "10F": { label: "Class 10 - Section F", tab: "10F" },
};

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('BN ICT Result System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  return ContentService.createTextOutput("OK");
}

// ---- Called from client JS ----

function getClasses() {
  return Object.keys(SHEET_CONFIG).map(k => ({ key: k, label: SHEET_CONFIG[k].label }));
}

function getStudents(classKey) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tab = SHEET_CONFIG[classKey] ? SHEET_CONFIG[classKey].tab : classKey;
    const sheet = ss.getSheetByName(tab);
    if (!sheet) return { error: "Sheet not found: " + tab };

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return { students: [], headers: [] };

    const headers = data[0].map(String);
    const students = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] && !row[1] && !row[2]) continue; // skip empty rows
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = row[idx]; });
      obj._row = i + 1; // 1-indexed sheet row
      students.push(obj);
    }
    return { students, headers, classKey };
  } catch(err) {
    return { error: err.message };
  }
}

function adminLogin(user, pass) {
  return (user === ADMIN_USER && pass === ADMIN_PASS);
}

// Update a single student row: updates columns D-H and J (Comment)
// colValues = { D, E, F, G, H, J }   (column letters as keys)
function updateStudentRow(classKey, rowNumber, colValues) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tab = SHEET_CONFIG[classKey] ? SHEET_CONFIG[classKey].tab : classKey;
    const sheet = ss.getSheetByName(tab);
    if (!sheet) return { error: "Sheet not found" };

    const colMap = { D:4, E:5, F:6, G:7, H:8, J:10 };
    for (const [col, val] of Object.entries(colValues)) {
      if (colMap[col] !== undefined) {
        sheet.getRange(rowNumber, colMap[col]).setValue(val === "" ? 0 : val);
      }
    }
    // Auto-calc Total in col I = D+E+F+G+H
    const row = sheet.getRange(rowNumber, 4, 1, 5).getValues()[0];
    const total = row.reduce((s, v) => s + (Number(v) || 0), 0);
    sheet.getRange(rowNumber, 9).setValue(total);

    return { success: true, total };
  } catch(err) {
    return { error: err.message };
  }
}

function searchByRoll(classKey, roll) {
  const result = getStudents(classKey);
  if (result.error) return result;
  const found = result.students.filter(s => String(s["Roll"]) === String(roll));
  return { students: found, headers: result.headers, classKey };
}
