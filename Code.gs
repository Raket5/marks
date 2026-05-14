// ============================================================
// Bangladesh Navy School And College - ICT Student Result System
// Google Apps Script Backend
// ============================================================

const ADMIN_USER = "admin";
const ADMIN_PASS = "admin1026";

// Sheet tab names
const SHEET_CONFIG = {
  "6C":  { label: "Class 6 - Section C",  tab: "sixc"   },
  "6F":  { label: "Class 6 - Section F",  tab: "sixf"   },
  "6G":  { label: "Class 6 - Section G",  tab: "sixg"   },
  "7E":  { label: "Class 7 - Section E",  tab: "sevene" },
  "7G":  { label: "Class 7 - Section G",  tab: "seveng" },
  "8C":  { label: "Class 8 - Section C",  tab: "eightc" },
  "8E":  { label: "Class 8 - Section E",  tab: "eighte" },
  "9C":  { label: "Class 9 - Section C",  tab: "ninec"  },
  "10D": { label: "Class 10 - Section D", tab: "tend"   },
  "10F": { label: "Class 10 - Section F", tab: "tenf"   },
};

function doGet(e) {
  const action = e && e.parameter && e.parameter.action;

  // API calls from script.js
  if (action === "getClasses") {
    return jsonOut(getClasses());
  }
  if (action === "getStudents") {
    return jsonOut(getStudents(e.parameter.classKey));
  }
  if (action === "searchByRoll") {
    return jsonOut(searchByRoll(e.parameter.classKey, e.parameter.roll));
  }
  if (action === "adminLogin") {
    const ok = adminLogin(e.parameter.user, e.parameter.pass);
    return jsonOut({ ok });
  }
  if (action === "updateStudent") {
    const colValues = JSON.parse(decodeURIComponent(e.parameter.colValues));
    return jsonOut(updateStudentRow(e.parameter.classKey, Number(e.parameter.rowNumber), colValues));
  }

  // No action = serve the HTML page
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('BN ICT Result System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function jsonOut(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
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
      if (!row[0] && !row[1] && !row[2]) continue;
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = row[idx]; });
      obj._row = i + 1;
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

// Sheet column layout:
// D(4)=PE(10), E(5)=Exam(25), F(6)=Conv(25)[formula], G(7)=Practical, H(8)=Viva, I(9)=CT, J(10)=Total[formula], K(11)=Comment
function updateStudentRow(classKey, rowNumber, colValues) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tab = SHEET_CONFIG[classKey] ? SHEET_CONFIG[classKey].tab : classKey;
    const sheet = ss.getSheetByName(tab);
    if (!sheet) return { error: "Sheet not found" };

    const colMap = { D:4, E:5, G:7, H:8, I:9, K:11 };
    for (const [col, val] of Object.entries(colValues)) {
      if (colMap[col] !== undefined) {
        sheet.getRange(rowNumber, colMap[col]).setValue(val === "" ? "" : val);
      }
    }

    // Total = F(Conv25, formula) + G + H + I
    const f   = Number(sheet.getRange(rowNumber, 6).getValue()) || 0;
    const g   = Number(sheet.getRange(rowNumber, 7).getValue()) || 0;
    const h   = Number(sheet.getRange(rowNumber, 8).getValue()) || 0;
    const i_v = Number(sheet.getRange(rowNumber, 9).getValue()) || 0;
    const total = f + g + h + i_v;
    sheet.getRange(rowNumber, 10).setValue(total);

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