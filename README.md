# SERVPRO Marketing Intelligence Platform

A password-protected marketing analytics dashboard for SERVPRO of Central Pennsylvania — with persistent cloud storage via Google Sheets.

---

## Files in this repo

| File | Purpose |
|------|---------|
| `index.html` | The entire dashboard application |
| `Code.gs` | Google Apps Script — paste into Apps Script editor |
| `.nojekyll` | Tells GitHub Pages not to process files with Jekyll |
| `README.md` | This file |

---

## First-time setup (do this once)

### Part 1 — Create your Google Sheet database

**Step 1** — Go to sheets.google.com and create a new spreadsheet. Name it **SERVPRO Intel**.

**Step 2** — Click **Extensions → Apps Script**. A new browser tab opens.

**Step 3** — Delete all default code. Copy the entire contents of `Code.gs` and paste it in.

**Step 4** — Click **Deploy → New deployment**:
- Click gear icon → **Web app**
- Execute as: **Me**
- Who has access: **Anyone**
- Click **Deploy** → authorize when prompted

**Step 5** — Copy the **Web app URL** (looks like `https://script.google.com/macros/s/AKfycb.../exec`)

**Step 6** — In your dashboard, click **Sheets Setup** in the left sidebar → paste the URL → click **Save & Test Connection**.

Green confirmation = you're connected. Every CSV you import now saves to the Sheet automatically.

---

### Part 2 — Host on GitHub Pages

**Step 1** — Create a GitHub account at github.com if needed.

**Step 2** — Click + → New repository. Name: `servpro-intel`. Set to **Private**. Check "Add a README". Click **Create repository**.

**Step 3** — Click **Add file → Upload files**. Upload: `index.html`, `Code.gs`, `.nojekyll`, `README.md`. Commit.

**Step 4** — Go to **Settings → Pages**. Source: Deploy from branch. Branch: main, folder: / (root). Save.

**Step 5** — Your URL: `https://YOUR-USERNAME.github.io/servpro-intel/` — live in ~2 minutes.

---

## How data persistence works

When you upload a CSV, the dashboard parses it in your browser and sends the rows to your Apps Script URL. Apps Script writes a new tab to your Google Sheet named by source and month (e.g. `GBP_2026-05`). It also updates a master `__index__` tab.

Next time you open the dashboard on any device — phone, laptop, anywhere — it reads the index and shows all your saved datasets. Click Load on any one to pull it in instantly.

Every month's data is kept as a separate tab, so you can compare periods over time.

---

## Changing your password

Open browser console (F12) and run:
```javascript
async function h(p){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(p));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');}
h('YourNewPassword').then(console.log);
```
Copy the 64-character hash. In GitHub, edit `index.html` and replace the `PW_HASH` value with your new hash. Commit.

**Default password:** `SERVPRO2026` — change this.

---

## Troubleshooting

**"Could not reach Sheets"** — Redeploy the Apps Script with "Who has access: Anyone". After code changes, always create a new deployment version.

**Data not appearing on another device** — Go to Sheets Setup on that device and enter the Apps Script URL again. It's stored per-browser in localStorage.

**Apps Script auth expired** — Open Apps Script editor, run the doGet function manually to trigger a fresh authorization.
