// ============================================================
// BN ICT Result System — script.js
// Works BOTH as Google Apps Script web-app AND as
// a static GitHub Pages site (with SCRIPT_URL set below)
// ============================================================

// ---------------------------------------------------------------
// ⚙️  CONFIGURATION — set your deployed Apps Script URL here
// ---------------------------------------------------------------
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw0_wGak0psZ7d9-lXRc277x05awHgADkmmUcwi4gyZRvsLYj17-7LuqbkPIohMvxrIzg/exec";
// e.g. "https://script.google.com/macros/s/AKfycbx.../exec"
// ---------------------------------------------------------------

// Column header mappings per class group
const FORMAT_678 = {
  marks: [
    { col: "D", label: "PE (10)",                  max: 10 },
    { col: "E", label: "Exam (15)",                max: 15 },
    { col: "F", label: "Practical Assignment (15)", max: 15 },
    { col: "G", label: "Practical Viva (5)",       max: 5  },
    { col: "H", label: "Practical CT (5)",         max: 5  },
  ],
  total: 50
};
const FORMAT_910 = {
  marks: [
    { col: "D", label: "PE (10)",                  max: 10 },
    { col: "E", label: "Exam (15)",                max: 15 },
    { col: "F", label: "Practical Exam (15)",      max: 15 },
    { col: "G", label: "Practical Viva (5)",       max: 5  },
    { col: "H", label: "Practical Notebook (5)",   max: 5  },
  ],
  total: 50
};

function getFormat(classKey) {
  return (classKey.startsWith("9") || classKey.startsWith("10"))
    ? FORMAT_910 : FORMAT_678;
}

// ---------------------------------------------------------------
// STATE
// ---------------------------------------------------------------
let isAdmin      = false;
let currentClass = null;
let currentData  = null; // { students, headers, classKey }
let editTarget   = null; // { student, rowIndex }

// ---------------------------------------------------------------
// INIT
// ---------------------------------------------------------------
window.addEventListener("DOMContentLoaded", async () => {
  const classes = await callScript("getClasses", []);
  const sel = document.getElementById("classSelect");
  (classes || []).forEach(c => {
    const o = document.createElement("option");
    o.value = c.key; o.textContent = c.label;
    sel.appendChild(o);
  });
});

// ---------------------------------------------------------------
// CALL APPS SCRIPT — URL parameter based (CORS-safe)
// ---------------------------------------------------------------
async function callScript(fn, args) {
  if (!SCRIPT_URL || SCRIPT_URL.includes("YOUR_APPS_SCRIPT")) {
    showDemoData(fn, args);
    return null;
  }

  let url = SCRIPT_URL;

  if (fn === "getClasses") {
    url += "?action=getClasses";

  } else if (fn === "getStudents") {
    url += "?action=getStudents&classKey=" + encodeURIComponent(args[0]);

  } else if (fn === "searchByRoll") {
    url += "?action=searchByRoll&classKey=" + encodeURIComponent(args[0])
         + "&roll=" + encodeURIComponent(args[1]);

  } else if (fn === "adminLogin") {
    url += "?action=adminLogin&user=" + encodeURIComponent(args[0])
         + "&pass=" + encodeURIComponent(args[1]);

  } else if (fn === "updateStudentRow") {
    url += "?action=updateStudent"
         + "&classKey="  + encodeURIComponent(args[0])
         + "&rowNumber=" + encodeURIComponent(args[1])
         + "&colValues=" + encodeURIComponent(JSON.stringify(args[2]));
  }

  try {
    const resp = await fetch(url);
    const text = await resp.text();
    return JSON.parse(text);
  } catch(err) {
    console.error("Script call failed:", err);
    return { error: err.message };
  }
}

// ---------------------------------------------------------------
// DEMO DATA (shown when no script URL is set)
// ---------------------------------------------------------------
function showDemoData(fn, args) {
  if (fn === "getStudents" || fn === "searchByRoll") {
    const demo = {
      classKey: args[0] || "6C",
      headers: ["Sl.", "Roll", "Student's Name", "PE (10)", "Exam(15)",
                "Practical Assignment(15)", "Practical viva(5)", "Practical CT(5)", "Total", "Comment"],
      students: [
        { "Sl.":1, "Roll":3,  "Student's Name":"Md. Inqiad Shahriar Shafee", "PE (10)":8, "Exam(15)":12, "Practical Assignment(15)":13, "Practical viva(5)":4, "Practical CT(5)":4, "Total":41, "Comment":"Good", _row:2 },
        { "Sl.":2, "Roll":10, "Student's Name":"Tasnim Adiba",               "PE (10)":9, "Exam(15)":11, "Practical Assignment(15)":14, "Practical viva(5)":5, "Practical CT(5)":3, "Total":42, "Comment":"",    _row:3 },
        { "Sl.":3, "Roll":24, "Student's Name":"Nur Mohammed",               "PE (10)":7, "Exam(15)":10, "Practical Assignment(15)":12, "Practical viva(5)":4, "Practical CT(5)":4, "Total":37, "Comment":"",    _row:4 },
        { "Sl.":4, "Roll":31, "Student's Name":"Maymuna Anjum Barsha",       "PE (10)":10,"Exam(15)":14, "Practical Assignment(15)":15, "Practical viva(5)":5, "Practical CT(5)":5, "Total":49, "Comment":"Excellent", _row:5 },
        { "Sl.":5, "Roll":38, "Student's Name":"Adity Panna Majumder",       "PE (10)":6, "Exam(15)":9,  "Practical Assignment(15)":10, "Practical viva(5)":3, "Practical CT(5)":2, "Total":30, "Comment":"Needs improvement", _row:6 },
      ]
    };
    currentData = demo;
    renderTable(demo);
  }
}

// ---------------------------------------------------------------
// LOAD CLASS
// ---------------------------------------------------------------
async function loadClass() {
  const key = document.getElementById("classSelect").value;
  if (!key) { document.getElementById("resultArea").innerHTML = ""; return; }
  currentClass = key;
  document.getElementById("rollInput").value = "";
  showLoading(true);
  const data = await callScript("getStudents", [key]);
  showLoading(false);
  if (data) { currentData = data; renderTable(data); }
}

// ---------------------------------------------------------------
// SEARCH BY ROLL
// ---------------------------------------------------------------
async function searchRoll() {
  const key  = document.getElementById("classSelect").value;
  const roll = document.getElementById("rollInput").value.trim();
  if (!key)  { alert("Please select a class first."); return; }
  if (!roll) { loadClass(); return; }
  currentClass = key;
  showLoading(true);
  const data = await callScript("searchByRoll", [key, roll]);
  showLoading(false);
  if (data) { currentData = data; renderTable(data); }
}

function clearSearch() {
  document.getElementById("rollInput").value = "";
  document.getElementById("classSelect").value = "";
  document.getElementById("resultArea").innerHTML = "";
  currentData = null; currentClass = null;
}

// ---------------------------------------------------------------
// RENDER TABLE
// ---------------------------------------------------------------
function renderTable(data) {
  const area = document.getElementById("resultArea");
  if (!data || !data.students || data.students.length === 0) {
    area.innerHTML = `<div class="result-card"><div class="empty-state">
      <div class="icon">🔍</div><p>No students found.</p></div></div>`;
    return;
  }

  const fmt    = getFormat(data.classKey);
  const label  = getClassLabel(data.classKey);
  const count  = data.students.length;

  // Build column headers from format
  const colHeaders = fmt.marks.map(m => `<th>${m.label}</th>`).join("");

  // Build rows
  const rows = data.students.map((s, idx) => {
    const markCells = fmt.marks.map(m => {
      const val = getMarkValue(s, m.label);
      return `<td>${val !== "" ? val : "—"}</td>`;
    }).join("");

    const total   = Number(s["Total"] || 0);
    const comment = s["Comment"] || s["comment"] || "";
    const grade   = gradeLabel(total, fmt.total);

    const editBtn = isAdmin
      ? `<button class="btn btn-edit btn-sm" onclick="openEdit(${idx})">✏️ Edit</button>`
      : "";

    return `<tr>
      <td>${s["Sl."] || idx+1}</td>
      <td><strong>${s["Roll"] || ""}</strong></td>
      <td>${s["Student's Name"] || s["Students Name"] || s["Student Name"] || ""}</td>
      ${markCells}
      <td class="total-cell"><span class="badge ${grade.cls}">${total}</span></td>
      <td class="comment-cell">${comment}</td>
      ${isAdmin ? `<td class="action-cell">${editBtn}</td>` : ""}
    </tr>`;
  }).join("");

  const adminCol = isAdmin ? "<th>Action</th>" : "";

  area.innerHTML = `
    <div class="result-card">
      <div class="card-header">
        <div>
          <h3>${label}</h3>
          <p>${count} students &nbsp;|&nbsp; Total marks: ${fmt.total}</p>
        </div>
        <div class="card-actions">
          <button class="btn btn-print btn-sm" onclick="openPrint()">🖨️ Print PDF</button>
        </div>
      </div>
      <div class="table-wrapper">
        <table>
          <thead><tr>
            <th>Sl.</th>
            <th>Roll</th>
            <th>Student's Name</th>
            ${colHeaders}
            <th>Total (${fmt.total})</th>
            <th>Comment</th>
            ${adminCol}
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function getMarkValue(student, label) {
  // Try the exact label, or common variants
  const keys = Object.keys(student);
  // direct match
  if (student[label] !== undefined) return student[label];
  // fuzzy: strip spaces/parens
  const clean = s => s.replace(/[\s()]/g,"").toLowerCase();
  for (const k of keys) {
    if (clean(k) === clean(label)) return student[k];
  }
  // fallback by column index using header list
  return "";
}

function gradeLabel(total, max) {
  const pct = (total / max) * 100;
  if (pct >= 90) return { cls: "badge-gold",  text: "A+" };
  if (pct >= 80) return { cls: "badge-blue",  text: "A"  };
  if (pct >= 60) return { cls: "badge-green", text: "B"  };
  return               { cls: "badge-red",   text: "C"  };
}

function getClassLabel(key) {
  const MAP = {
    "6C":"Class 6 — Section C","6F":"Class 6 — Section F","6G":"Class 6 — Section G",
    "7E":"Class 7 — Section E","7G":"Class 7 — Section G",
    "8C":"Class 8 — Section C","8E":"Class 8 — Section E",
    "9C":"Class 9 — Section C",
    "10D":"Class 10 — Section D","10F":"Class 10 — Section F"
  };
  return MAP[key] || key;
}

// ---------------------------------------------------------------
// ADMIN LOGIN
// ---------------------------------------------------------------
function openAdminLogin() {
  if (isAdmin) { doLogout(); return; }
  document.getElementById("adminUser").value = "";
  document.getElementById("adminPass").value = "";
  document.getElementById("loginError").classList.add("hidden");
  openModal("loginModal");
}

async function doLogin() {
  const user = document.getElementById("adminUser").value.trim();
  const pass = document.getElementById("adminPass").value;

  // For GitHub Pages mode: check hardcoded creds client-side
  // (In Apps Script mode, verifies server-side too)
  // Check credentials: client-side for GitHub Pages, also verify via server
  let ok = (user === "admin" && pass === "admin1026");
  if (!ok) {
    const res = await callScript("adminLogin", [user, pass]).catch(() => null);
    ok = res && res.ok === true;
  }

  if (ok) {
    isAdmin = true;
    closeModal("loginModal");
    document.getElementById("adminBadge").classList.remove("hidden");
    document.getElementById("adminBtn").textContent = "🔓 Logout Admin";
    document.getElementById("adminBtn").classList.remove("btn-outline");
    document.getElementById("adminBtn").classList.add("btn-ghost");
    if (currentData) renderTable(currentData);
  } else {
    document.getElementById("loginError").classList.remove("hidden");
  }
}

function doLogout() {
  isAdmin = false;
  document.getElementById("adminBadge").classList.add("hidden");
  document.getElementById("adminBtn").textContent = "🔐 Admin Login";
  document.getElementById("adminBtn").classList.add("btn-outline");
  document.getElementById("adminBtn").classList.remove("btn-ghost");
  if (currentData) renderTable(currentData);
}

// ---------------------------------------------------------------
// EDIT STUDENT
// ---------------------------------------------------------------
function openEdit(idx) {
  if (!isAdmin || !currentData) return;
  const student = currentData.students[idx];
  const fmt = getFormat(currentData.classKey);
  editTarget = { student, idx };

  document.getElementById("editStudentName").textContent =
    `Roll: ${student["Roll"]} — ${student["Student's Name"] || ""}`;

  const fields = document.getElementById("editFields");
  fields.innerHTML = fmt.marks.map(m => {
    const val = getMarkValue(student, m.label);
    return `<div>
      <label>${m.label} <em style="color:#999">(max ${m.max})</em></label>
      <input type="number" id="ef_${m.col}" min="0" max="${m.max}" step="0.5"
             value="${val !== "" ? val : 0}" />
    </div>`;
  }).join("") + `<div class="full-width">
      <label>Comment</label>
      <input type="text" id="ef_J" value="${student["Comment"] || ""}"
             placeholder="Optional comment…" style="width:100%"/>
    </div>`;

  document.getElementById("editError").classList.add("hidden");
  openModal("editModal");
}

async function saveEdit() {
  if (!editTarget) return;
  const fmt = getFormat(currentData.classKey);
  const colValues = {};
  let valid = true;

  for (const m of fmt.marks) {
    const el  = document.getElementById("ef_" + m.col);
    const val = parseFloat(el.value);
    if (isNaN(val) || val < 0 || val > m.max) {
      document.getElementById("editError").textContent =
        `"${m.label}" must be between 0 and ${m.max}.`;
      document.getElementById("editError").classList.remove("hidden");
      valid = false; break;
    }
    colValues[m.col] = val;
  }
  if (!valid) return;

  colValues["J"] = document.getElementById("ef_J").value;

  // Update local data immediately (optimistic)
  const s = editTarget.student;
  fmt.marks.forEach(m => { s[m.label] = colValues[m.col]; });
  s["Comment"] = colValues["J"];
  s["Total"] = fmt.marks.reduce((sum, m) => sum + (Number(colValues[m.col]) || 0), 0);

  closeModal("editModal");
  renderTable(currentData);

  // Persist to sheet if Apps Script available
  if (s._row) {
    const res = await callScript("updateStudentRow",
      [currentData.classKey, s._row, colValues]);
    if (res && res.error) {
      alert("Saved locally. Sheet sync error: " + res.error);
    }
  }
}

// ---------------------------------------------------------------
// PRINT PDF
// ---------------------------------------------------------------
function openPrint() {
  if (!currentData) return;
  document.getElementById("printExam").value = "";
  openModal("printModal");
}

function doPrint() {
  if (!currentData) return;
  const exam  = document.getElementById("printExam").value.trim() || "—";
  const fmt   = getFormat(currentData.classKey);
  const label = getClassLabel(currentData.classKey);
  const parts = label.split("—");
  const cls   = (parts[0] || "").trim();
  const sec   = (parts[1] || "").trim();

  const colHeaders = fmt.marks.map(m => `<th>${m.label}</th>`).join("");
  const rows = currentData.students.map((s, i) => {
    const markCells = fmt.marks.map(m => {
      const v = getMarkValue(s, m.label);
      return `<td>${v !== "" ? v : "0"}</td>`;
    }).join("");
    const total   = Number(s["Total"] || 0);
    const comment = s["Comment"] || "";
    return `<tr>
      <td>${s["Sl."] || i+1}</td>
      <td>${s["Roll"] || ""}</td>
      <td>${s["Student's Name"] || ""}</td>
      ${markCells}
      <td><strong>${total}</strong></td>
      <td>${comment}</td>
    </tr>`;
  }).join("");

  document.getElementById("printArea").innerHTML = `
    <div class="print-page">
      <div class="print-header">
        <h2>Bangladesh Navy School And College, CTG</h2>
        <p><strong>Subject:</strong> ICT &nbsp;&nbsp;&nbsp;
           <strong>Subject Teacher:</strong> Mahmud</p>
        <div class="print-meta">
          <span>Class: ${cls}</span>
          <span>Section: ${sec}</span>
          <span>Exam: ${exam}</span>
        </div>
      </div>
      <table class="print-table">
        <thead><tr>
          <th>Sl.</th><th>Roll</th><th>Student's Name</th>
          ${colHeaders}
          <th>Total (${fmt.total})</th><th>Comment</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  closeModal("printModal");
  setTimeout(() => window.print(), 100);
}

// ---------------------------------------------------------------
// MODAL HELPERS
// ---------------------------------------------------------------
function openModal(id)  { document.getElementById(id).classList.remove("hidden"); }
function closeModal(id) { document.getElementById(id).classList.add("hidden"); }

// Close modal on overlay click
document.addEventListener("click", e => {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.add("hidden");
  }
});

// Enter key in login
document.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    if (!document.getElementById("loginModal").classList.contains("hidden")) doLogin();
    if (!document.getElementById("editModal").classList.contains("hidden"))  saveEdit();
  }
});

// ---------------------------------------------------------------
// LOADING
// ---------------------------------------------------------------
function showLoading(show) {
  document.getElementById("loadingMsg").classList.toggle("hidden", !show);
  if (show) document.getElementById("resultArea").innerHTML = "";
}
