https://script.google.com/macros/s/AKfycbw0_wGak0psZ7d9-lXRc277x05awHgADkmmUcwi4gyZRvsLYj17-7LuqbkPIohMvxrIzg/exec
# BN ICT Result System — Setup Guide

## Files Included
| File | Purpose |
|------|---------|
| `Code.gs` | Google Apps Script backend |
| `index.html` | Website main page |
| `style.css` | Styles |
| `script.js` | Frontend logic |

---

## STEP 1 — Google Apps Script Setup

1. Open your Google Sheet (`BN All Student 2026`)
2. Click **Extensions → Apps Script**
3. Delete the default `Code.gs` content and paste the contents of `Code.gs` from this folder
4. **Verify sheet tab names** match: `6C, 6F, 6G, 7E, 7G, 8C, 8E, 9C, 10D, 10F`
   - If any tab name differs, update `SHEET_CONFIG` in `Code.gs`
5. Click **Deploy → New Deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Click **Deploy** and **copy the Web App URL**
   - It looks like: `https://script.google.com/macros/s/AKfycbx.../exec`

---

## STEP 2 — Add Script URL to Frontend

Open `script.js` and find line 10:
```js
const SCRIPT_URL = "YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
```
Replace with your actual URL:
```js
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx.../exec";
```

---

## STEP 3 — GitHub Pages Deployment

1. Create a new GitHub repository (e.g. `bn-ict-results`)
2. Upload these 3 files: `index.html`, `style.css`, `script.js`
3. Go to **Settings → Pages**
4. Source: **Deploy from branch → main → / (root)**
5. Save → your site will be live at:
   `https://YOUR_USERNAME.github.io/bn-ict-results/`

---

## OPTION B — Run Entirely Inside Apps Script

If you prefer to host inside Google Apps Script itself (no GitHub needed):

1. In Apps Script, click **+** next to Files → add `index.html`
2. Paste the full `index.html` content
3. The CSS and JS can be inline in the HTML or added as separate `.html` files
4. Deploy → Web App (same as Step 1)
5. The site runs at your Apps Script deployment URL directly

---

## Features

| Feature | How |
|---------|-----|
| View all students | Select class from dropdown |
| Search by roll | Select class + enter roll number |
| Admin edit marks | Login → ✏️ Edit button per row |
| Auto total | D+E+F+G+H computed automatically |
| Add comment | Admin edits J column |
| Print PDF | 🖨️ Print PDF button → browser print dialog |

## Admin Credentials
- **Username:** `admin`
- **Password:** `admin2026`

## Column Structure (6C, 6F, 6G, 7E, 7G, 8C, 8E)
- D = PE (10)
- E = Exam (15)
- F = Practical Assignment (15)
- G = Practical Viva (5)
- H = Practical CT (5)
- I = Total (auto-calculated)
- J = Comment

## Column Structure (9C, 10D, 10F)
- D = PE (10)
- E = Exam (15)
- F = Practical Exam (15)
- G = Practical Viva (5)
- H = Practical Notebook (5)
- I = Total (auto-calculated)
- J = Comment

---

## Notes
- The website works in **demo mode** (with sample data) even before the Apps Script URL is set — useful for testing the design
- Edits made through the website are saved back to Google Sheets in real time
- PDF print header auto-fills Class, Section, and Exam name from your input
