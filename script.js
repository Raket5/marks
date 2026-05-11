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
    return showDemoData(fn, args);
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
  if (data) {
    currentData = data;
    if (!isLoggedIn() && data.students && data.students.length === 1) {
      // Student mode — show result card
      const cardHTML = buildStudentCard(data.students[0], data.classKey);
      document.getElementById("studentCardArea").innerHTML = cardHTML;
      document.getElementById("resultArea").innerHTML = "";
      document.getElementById("studentCardButtons").classList.remove("hidden");
    } else {
      // Admin mode — show table as usual
      document.getElementById("studentCardArea").innerHTML = "";
      document.getElementById("studentCardButtons").classList.add("hidden");
      renderTable(data);
    }
  }
}

function clearSearch() {
  document.getElementById("rollInput").value = "";
  document.getElementById("classSelect").value = "";
  document.getElementById("resultArea").innerHTML = "";
  currentData = null; currentClass = null;
}

function isLoggedIn() {
  return !document.getElementById("adminBadge").classList.contains("hidden");
}

function buildStudentCard(s, classKey) {
  const fmt   = getFormat(classKey);
  const label = getClassLabel(classKey);
  const parts = label.split("—");
  const cls   = (parts[0] || "").trim();
  const sec   = (parts[1] || "").trim();

  const rows = fmt.marks.map(m => {
    const v = getMarkValue(s, m.label);
    const isEmpty = (v === "" || v === null || v === undefined);
    const display = isEmpty
      ? `<span class="sc-pending">— এখনো হয়নি —</span>`
      : `<span class="sc-mark">${v}</span><span class="sc-max"> / ${m.max}</span>`;
    return `
      <tr>
        <td class="sc-label">${m.label}</td>
        <td class="sc-value">${display}</td>
      </tr>`;
  }).join("");

  const total   = Number(s["Total"] || 0);
  const comment = s["Comment"] || "";

  return `
    <div class="student-card" id="studentCard">
      <div class="sc-header">
        <div class="sc-school">Bangladesh Navy School And College, CTG</div>
        <div class="sc-subtitle">ICT Result Card</div>
        <div class="sc-meta-row">
          <span><b>Class:</b> ${cls}</span>
          <span><b>Section:</b> ${sec}</span>
          <span><b>Subject:</b> ICT</span>
        </div>
        <div class="sc-meta-row">
          <span><b>Teacher:</b> Mahmud</span>
          <span><b>Phone:</b> 01883100648</span>
        </div>
      </div>
      <div class="sc-student-info">
        <div class="sc-name">${s["Student's Name"] || "—"}</div>
        <div class="sc-roll">Roll: ${s["Roll"] || "—"}</div>
      </div>
      <table class="sc-table">
        <thead>
          <tr><th>Component</th><th>Marks</th></tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr class="sc-total-row">
            <td><b>Total</b></td>
            <td><b>${total} / ${fmt.total}</b></td>
          </tr>
        </tfoot>
      </table>
      ${comment ? `<div class="sc-comment">💬 ${comment}</div>` : ""}
      <div class="sc-footer">
        <span>Subject Teacher Signature</span>
        <span>________________</span>
      </div>
    </div>`;
}

function printStudentCard() {
  const area = document.getElementById("studentCardArea");
  if (!area || !area.innerHTML.trim()) return;
  const w = window.open("", "_blank");
  w.document.write(`<!DOCTYPE html><html><head><title>Result Card</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; background:#fff; padding: 30px; }
      .student-card { max-width: 520px; margin: 0 auto; border: 2px solid #1a2744; border-radius: 12px; overflow: hidden; }
      .sc-header { background: #1a2744; color: #fff; padding: 20px 24px 14px; text-align: center; }
      .sc-school { font-size: 15pt; font-weight: 700; letter-spacing: 0.3px; }
      .sc-subtitle { font-size: 10pt; color: #c9a84c; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
      .sc-meta-row { display: flex; justify-content: center; gap: 24px; margin-top: 8px; font-size: 9pt; color: #cdd6f4; }
      .sc-student-info { background: #f0f4ff; padding: 14px 24px; border-bottom: 1px solid #dde3f0; }
      .sc-name { font-size: 14pt; font-weight: 700; color: #1a2744; }
      .sc-roll { font-size: 10pt; color: #555; margin-top: 2px; }
      .sc-table { width: 100%; border-collapse: collapse; }
      .sc-table th { background: #eef1fa; padding: 9px 16px; font-size: 9pt; text-align: left; color: #333; border-bottom: 2px solid #c9a84c; }
      .sc-table td { padding: 10px 16px; font-size: 10pt; border-bottom: 1px solid #eee; }
      .sc-label { color: #333; width: 65%; }
      .sc-mark { font-weight: 700; font-size: 11pt; color: #1a2744; }
      .sc-max { color: #888; font-size: 9pt; }
      .sc-pending { color: #aaa; font-style: italic; font-size: 9pt; }
      .sc-total-row td { background: #1a2744; color: #fff; font-size: 11pt; padding: 11px 16px; }
      .sc-comment { padding: 10px 20px; font-size: 9.5pt; color: #555; background: #fffbf0; border-top: 1px solid #ede8d0; }
      .sc-footer { display: flex; justify-content: space-between; padding: 16px 24px 14px; font-size: 9pt; color: #777; border-top: 1px solid #eee; }
      @media print { body { padding: 0; } }
    </style></head><body>
    ${area.innerHTML}
    </body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
}

async function downloadStudentCard() {
  const area = document.getElementById("studentCardArea");
  if (!area || !area.innerHTML.trim()) return;

  const studentName = currentData?.students?.[0]?.["Student's Name"] || "result";
  const roll = currentData?.students?.[0]?.["Roll"] || "";

  const html = `<!DOCTYPE html><html><head><title>Result Card</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; background:#fff; }
      .student-card { max-width: 520px; margin: 0 auto; border: 2px solid #1a2744; border-radius: 12px; overflow: hidden; }
      .sc-header { background: #1a2744; color: #fff; padding: 20px 24px 14px; text-align: center; }
      .sc-school { font-size: 15pt; font-weight: 700; }
      .sc-subtitle { font-size: 10pt; color: #c9a84c; margin-top: 4px; text-transform: uppercase; }
      .sc-meta-row { display: flex; justify-content: center; gap: 24px; margin-top: 8px; font-size: 9pt; color: #cdd6f4; }
      .sc-student-info { background: #f0f4ff; padding: 14px 24px; border-bottom: 1px solid #dde3f0; }
      .sc-name { font-size: 14pt; font-weight: 700; color: #1a2744; }
      .sc-roll { font-size: 10pt; color: #555; margin-top: 2px; }
      .sc-table { width: 100%; border-collapse: collapse; }
      .sc-table th { background: #eef1fa; padding: 9px 16px; font-size: 9pt; text-align: left; color: #333; border-bottom: 2px solid #c9a84c; }
      .sc-table td { padding: 10px 16px; font-size: 10pt; border-bottom: 1px solid #eee; }
      .sc-label { color: #333; width: 65%; }
      .sc-mark { font-weight: 700; font-size: 11pt; color: #1a2744; }
      .sc-max { color: #888; font-size: 9pt; }
      .sc-pending { color: #aaa; font-style: italic; font-size: 9pt; }
      .sc-total-row td { background: #1a2744; color: #fff; font-size: 11pt; padding: 11px 16px; }
      .sc-comment { padding: 10px 20px; font-size: 9.5pt; color: #555; background: #fffbf0; border-top: 1px solid #ede8d0; }
      .sc-footer { display: flex; justify-content: space-between; padding: 16px 24px 14px; font-size: 9pt; color: #777; border-top: 1px solid #eee; }
      @media print { @page { size: A4; margin: 20mm; } }
    </style>
    <script>window.onload = function(){ window.print(); window.onafterprint = function(){ window.close(); }; }<\/script>
    </head><body>
    ${area.innerHTML}
    </body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url  = URL.createObjectURL(blob);
  const w    = window.open(url, "_blank");
  if (!w) {
    // fallback — direct download if popup blocked
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `result_${roll}_${studentName}.html`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
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
          ${isAdmin ? `<button class="btn btn-print btn-sm" onclick="openPrint()">🖨️ Print PDF</button>` : ""}
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
    const raw = el.value.trim();
    if (raw === "") {
      colValues[m.col] = "";
      continue;
    }
    const val = parseFloat(raw);
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
  const s = editTarget.student;
  fmt.marks.forEach(m => {
    s[m.label] = colValues[m.col] === "" ? "" : colValues[m.col];
  });
  s["Comment"] = colValues["J"];
  s["Total"] = fmt.marks.reduce((sum, m) => sum + (Number(colValues[m.col]) || 0), 0);
  closeModal("editModal");
  renderTable(currentData);
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

  document.getElementById("printExamSelect").value = "";
  document.getElementById("printExam").value = "";
  document.getElementById("printExam").style.display = "none";

  const fmt = getFormat(currentData.classKey);
  const container = document.getElementById("printColOptions");
  container.innerHTML = "";

  const fixedCols = [
    { id: "col_sl",   label: "Sl. No." },
    { id: "col_roll", label: "Roll" },
    { id: "col_name", label: "Student's Name" },
  ];
  fixedCols.forEach(fc => {
    container.innerHTML += `
      <label class="col-check-label">
        <input type="checkbox" id="${fc.id}" checked />
        ${fc.label}
      </label>`;
  });

  fmt.marks.forEach((m, idx) => {
    container.innerHTML += `
      <label class="col-check-label">
        <input type="checkbox" id="col_mark_${idx}" checked />
        ${m.label}
      </label>`;
  });

  container.innerHTML += `
    <label class="col-check-label">
      <input type="checkbox" id="col_total" checked />
      Total (${fmt.total})
    </label>
    <label class="col-check-label">
      <input type="checkbox" id="col_comment" checked />
      Comment
    </label>`;

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

  const showSl      = document.getElementById("col_sl")?.checked;
  const showRoll    = document.getElementById("col_roll")?.checked;
  const showName    = document.getElementById("col_name")?.checked;
  const showTotal   = document.getElementById("col_total")?.checked;
  const showComment = document.getElementById("col_comment")?.checked;
  const emptyMode   = document.querySelector('input[name="emptyMode"]:checked')?.value || "number";

  const selectedMarks = fmt.marks.filter((m, idx) =>
    document.getElementById(`col_mark_${idx}`)?.checked
  );

  let headerCells = "";
  if (showSl)      headerCells += `<th>Sl.</th>`;
  if (showRoll)    headerCells += `<th>Roll</th>`;
  if (showName)    headerCells += `<th>Student's Name</th>`;
  selectedMarks.forEach(m => { headerCells += `<th>${m.label}</th>`; });
  if (showTotal)   headerCells += `<th>Total (${fmt.total})</th>`;
  if (showComment) headerCells += `<th>Comment</th>`;

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

    if (showTotal)   cells += `<td><strong>${Number(s["Total"] || 0)}</strong></td>`;
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
    if (!document.getElementById("printModal").classList.contains("hidden")) doPrint();
    // Search — Enter works from class dropdown or roll input
    const allModalsHidden =
      document.getElementById("loginModal").classList.contains("hidden") &&
      document.getElementById("editModal").classList.contains("hidden") &&
      document.getElementById("printModal").classList.contains("hidden");
    if (allModalsHidden) {
      const roll = document.getElementById("rollInput").value.trim();
      if (roll) searchRoll();
      else loadClass();
    }
  }
});

// ---------------------------------------------------------------
// LOADING
// ---------------------------------------------------------------
function showLoading(show) {
  document.getElementById("loadingMsg").classList.toggle("hidden", !show);
  if (show) document.getElementById("resultArea").innerHTML = "";
}
