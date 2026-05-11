// ============================================================
// BN ICT Result System — script.js
// Works BOTH as Google Apps Script web-app AND as
// a static GitHub Pages site (with SCRIPT_URL set below)
// ============================================================

// ---------------------------------------------------------------
// ⚙️  CONFIGURATION — set your deployed Apps Script URL here
// ---------------------------------------------------------------
const SCRIPT_URL = "YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
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
// CALL APPS SCRIPT
// ---------------------------------------------------------------
async function callScript(fn, args) {
  // If running inside Apps Script (google.script.run), use that
  if (typeof google !== "undefined" && google.script && google.script.run) {
    return new Promise((res, rej) => {
      google.script.run
        .withSuccessHandler(res)
        .withFailureHandler(rej)
        [fn](...args);
    });
  }
  // Otherwise call via URL (GitHub Pages mode)
  if (!SCRIPT_URL || SCRIPT_URL.includes("YOUR_APPS_SCRIPT")) {
    return showDemoData(fn, args);
  }
  const url = `${SCRIPT_URL}?fn=${fn}&args=${encodeURIComponent(JSON.stringify(args))}`;
  const resp = await fetch(url);
  return resp.json();
}

// ---------------------------------------------------------------
// DEMO DATA (shown when no script URL is set)
// ---------------------------------------------------------------
function showDemoData(fn, args) {
  if (fn === "getClasses") {
    return [
      { key: "6A",  label: "Class 6 — A" },
      { key: "6B",  label: "Class 6 — B" },
      { key: "6C",  label: "Class 6 — C" },
      { key: "7A",  label: "Class 7 — A" },
      { key: "7B",  label: "Class 7 — B" },
      { key: "7C",  label: "Class 7 — C" },
      { key: "8A",  label: "Class 8 — A" },
      { key: "8B",  label: "Class 8 — B" },
      { key: "9A",  label: "Class 9 — A" },
      { key: "9B",  label: "Class 9 — B" },
      { key: "10A", label: "Class 10 — A" },
      { key: "10B", label: "Class 10 — B" },
    ];
  }
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
    return demo;
  }
  return null;
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
  const ok = (user === "admin" && pass === "admin2026")
    || await callScript("adminLogin", [user, pass]).catch(() => false);

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

  // Reset exam fields
  document.getElementById("printExamSelect").value = "";
  document.getElementById("printExam").value = "";
  document.getElementById("printExam").style.display = "none";

  // Build column checkboxes dynamically from current format
  const fmt = getFormat(currentData.classKey);
  const container = document.getElementById("printColOptions");
  container.innerHTML = "";

  // Fixed columns (always shown as checked but toggleable)
  const fixedCols = [
    { id: "col_sl",    label: "Sl. No." },
    { id: "col_roll",  label: "Roll" },
    { id: "col_name",  label: "Student's Name" },
  ];
  fixedCols.forEach(fc => {
    container.innerHTML += `
      <label class="col-check-label">
        <input type="checkbox" id="${fc.id}" value="${fc.id}" checked />
        ${fc.label}
      </label>`;
  });

  // Mark columns
  fmt.marks.forEach((m, idx) => {
    container.innerHTML += `
      <label class="col-check-label">
        <input type="checkbox" id="col_mark_${idx}" value="mark_${idx}" checked />
        ${m.label}
      </label>`;
  });

  // Total & Comment
  container.innerHTML += `
    <label class="col-check-label">
      <input type="checkbox" id="col_total" value="col_total" checked />
      Total (${fmt.total})
    </label>
    <label class="col-check-label">
      <input type="checkbox" id="col_comment" value="col_comment" checked />
      Comment
    </label>`;

  // Reset empty mode
  document.querySelector('input[name="emptyMode"][value="number"]').checked = true;

  openModal("printModal");
}

function onExamSelectChange() {
  const sel = document.getElementById("printExamSelect").value;
  const customInput = document.getElementById("printExam");
  if (sel === "custom") {
    customInput.style.display = "block";
    customInput.value = "";
    customInput.focus();
  } else {
    customInput.style.display = "none";
    customInput.value = sel;
  }
}

function doPrint() {
  if (!currentData) return;

  // Resolve exam name
  const sel = document.getElementById("printExamSelect").value;
  let exam = "";
  if (sel === "custom" || sel === "") {
    exam = document.getElementById("printExam").value.trim() || "—";
  } else {
    exam = sel;
  }

  const fmt   = getFormat(currentData.classKey);
  const label = getClassLabel(currentData.classKey);
  const parts = label.split("—");
  const cls   = (parts[0] || "").trim();
  const sec   = (parts[1] || "").trim();

  // Check which columns are selected
  const showSl      = document.getElementById("col_sl")?.checked;
  const showRoll    = document.getElementById("col_roll")?.checked;
  const showName    = document.getElementById("col_name")?.checked;
  const showTotal   = document.getElementById("col_total")?.checked;
  const showComment = document.getElementById("col_comment")?.checked;
  const emptyMode   = document.querySelector('input[name="emptyMode"]:checked')?.value || "number";

  // Selected mark columns
  const selectedMarks = fmt.marks.filter((m, idx) =>
    document.getElementById(`col_mark_${idx}`)?.checked
  );

  // Build header row
  let headerCells = "";
  if (showSl)      headerCells += `<th>Sl.</th>`;
  if (showRoll)    headerCells += `<th>Roll</th>`;
  if (showName)    headerCells += `<th>Student's Name</th>`;
  selectedMarks.forEach(m => { headerCells += `<th>${m.label}</th>`; });
  if (showTotal)   headerCells += `<th>Total (${fmt.total})</th>`;
  if (showComment) headerCells += `<th>Comment</th>`;

  // Build data rows
  const rows = currentData.students.map((s, i) => {
    let cells = "";
    if (showSl)   cells += `<td>${s["Sl."] || i+1}</td>`;
    if (showRoll) cells += `<td>${s["Roll"] || ""}</td>`;
    if (showName) cells += `<td>${s["Student's Name"] || ""}</td>`;

    selectedMarks.forEach(m => {
      const v = getMarkValue(s, m.label);
      const display = (v !== "" && v !== null && v !== undefined)
        ? v
        : (emptyMode === "blank" ? "" : "0");
      cells += `<td>${display}</td>`;
    });

    if (showTotal) {
      const total = Number(s["Total"] || 0);
      cells += `<td><strong>${total}</strong></td>`;
    }
    if (showComment) cells += `<td>${s["Comment"] || ""}</td>`;

    return `<tr>${cells}</tr>`;
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
        <thead><tr>${headerCells}</tr></thead>
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
