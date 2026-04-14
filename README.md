# GCIPrintFarm
Tools, Training, and Print Queue System for the GCI 3D Print Farm

## About the GCI Print Farm

The GCI Print Farm is a student-operated 3D printing lab that provides accessible, hands-on fabrication services for learners and staff. Equipped with **Bambu Lab A1**, **A1 Mini**, and **P1S** printers, the farm supports everything from rapid prototyping to multi-color prints. Students learn the full workflow — from model selection and slicing to quality inspection and troubleshooting — through a structured five-day training program.

---

## 🆕 What Was Added

This repository now includes a full **print request and live queue system** integrated into the existing site at [print.geneseelearninglab.com](https://print.geneseelearninglab.com).

### New Pages

| Page | Description |
|------|-------------|
| [`requests.html`](requests.html) | Tabbed form for student print submissions and staff print requests |
| [`queue.html`](queue.html) | Public live queue showing sanitized job status (no names or private data) |
| [`instructor.html`](instructor.html) | Instructor hub — helpdesk guide, workflow, queue reference, class documents |

### New JavaScript Files

| File | Description |
|------|-------------|
| [`print-config.js`](print-config.js) | Configurable endpoint URLs — **update these before going live** |
| [`print-workflow.js`](print-workflow.js) | Handles tab switching, form validation, form submission, and queue rendering |

### Modified Pages

| Page | Changes |
|------|---------|
| `theme.css` | Added form, tab, queue, and status badge styles |
| `index.html` | Updated nav, announcements card, print queue CTA |
| `print-farm.html` | Updated nav, CTAs, queue placeholder → live queue link, added student rules section |
| `projects.html` | Updated nav, CTAs |
| `resources.html` | Updated nav, footer |
| `training/index.html` | Updated nav, footer, submit link |
| `training/day1–5.html` | Updated nav |
| `training/glossary.html` | Updated nav |

---

## 🔧 How the Print Request Workflow Works

1. **Student or staff submits** a request through `requests.html` (email address required)
2. The form validates required fields, then sends the payload via `fetch()` to a Google Apps Script endpoint
3. **Google Apps Script** receives the POST, appends the submission to a private Google Sheet, and assigns a Job ID
4. A **helpdesk operator** reviews the submission and updates the job status in the Sheet
5. When status changes to **Ready for Pickup** or **Needs Revision**, the Apps Script installable trigger automatically emails the submitter
6. The public `queue.html` fetches **sanitized data only** from a separate GAS endpoint — no names, emails, or file links are ever exposed
7. The queue auto-refreshes every 60 seconds and supports filter controls (Waiting / Printing / Complete / Ready for Pickup)

---

## ⚙️ Configuration — Update Before Going Live

Open [`print-config.js`](print-config.js) and replace the three placeholder values with your real Google Apps Script web app URLs:

```js
global.PRINT_CONFIG = {
  STUDENT_SUBMIT_ENDPOINT: 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE',
  STAFF_SUBMIT_ENDPOINT:   'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE',
  QUEUE_ENDPOINT:          'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE',
  QUEUE_REFRESH_INTERVAL:  60000   // milliseconds
};
```

All three endpoints can point to the same deployed web app URL if you use a single Apps Script project.

---

## 🤖 Google Apps Script Setup

### Step 1 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
2. Rename the first sheet tab to **`Submissions`**.
3. Add these column headers in row 1 (exact spelling matters):

```
Timestamp | Job ID | Request Type | First Name | Last Name | Class/Department |
Class Period | Project Type | File Name | File Link | Estimated Print Time |
Filament Color | Printer Requested | Checklist | Notes | Status | Printer Assigned | Pickup Status | Email
```

4. Create a second sheet tab named **`Queue`** with these headers:

```
Job ID | Project Type | Status | Printer Assigned | Pickup Status
```

The Apps Script will copy only the public-safe fields from `Submissions` into `Queue` when updating.

---

### Step 2 — Create the Apps Script

1. From the spreadsheet, click **Extensions → Apps Script**.
2. Delete any boilerplate code and paste the following:

```javascript
// ── Configuration ──────────────────────────────────────────
var SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
var SHEET_SUBMISSIONS = 'Submissions';
var SHEET_QUEUE = 'Queue';
var JOB_ID_PREFIX = 'PF-';  // e.g. PF-26-001

// ── POST: Receive form submissions ─────────────────────────
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_SUBMISSIONS);

    var jobId = generateJobId(sheet);
    var timestamp = new Date().toISOString();

    // Build row based on requestType
    var row;
    if (body.requestType === 'student') {
      row = [
        timestamp,
        jobId,
        'student',
        sanitize(body.firstName),
        sanitize(body.lastName),
        sanitize(body.className),
        sanitize(body.classPeriod),
        sanitize(body.projectType),
        sanitize(body.fileName),
        sanitize(body.fileLink),
        sanitize(body.estimatedPrintTime),
        sanitize(body.filamentColor),
        sanitize(body.printerRequested),
        (body.checklist || []).join(', '),
        sanitize(body.notes),
        'Submitted',   // Status
        '',            // Printer Assigned
        'No',          // Pickup Status
        sanitize(body.email)  // Email
      ];
    } else if (body.requestType === 'staff') {
      row = [
        timestamp,
        jobId,
        'staff',
        sanitize(body.firstName),
        sanitize(body.lastName),
        sanitize(body.department),
        '',
        sanitize(body.projectName),
        sanitize(body.fileName),
        sanitize(body.fileLink),
        '',
        sanitize(body.filamentColor),
        sanitize(body.printerRequested),
        '',
        sanitize(body.notes),
        'Submitted',
        '',
        'No',
        sanitize(body.email)  // Email
      ];
    } else {
      throw new Error('Unknown requestType');
    }

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, jobId: jobId }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── GET: Return sanitized public queue data ─────────────────
function doGet(e) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_SUBMISSIONS);
    var data = sheet.getDataRange().getValues();

    // Skip header row, filter for active jobs only (not old "Submitted" with no action)
    var activeStatuses = ['Waiting', 'Printing', 'Complete', 'Ready for Pickup'];
    var queue = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var status = row[15] || '';   // Column P = Status
      if (activeStatuses.indexOf(status) === -1) continue;

      queue.push({
        jobId:           String(row[1]  || ''),
        projectType:     String(row[7]  || ''),
        status:          String(status),
        printerAssigned: String(row[16] || ''),
        pickupStatus:    String(row[17] || 'No')
        // ⚠️  Do NOT add firstName, lastName, email, fileLink here
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify(queue))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Helpers ─────────────────────────────────────────────────
function generateJobId(sheet) {
  var lastRow = sheet.getLastRow();
  var year = new Date().getFullYear().toString().slice(-2);
  var seq = String(lastRow).padStart(3, '0');
  return JOB_ID_PREFIX + year + '-' + seq;
}

function sanitize(value) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/<[^>]*>/g, '').trim().slice(0, 500);
}

// ── Status-change email notifications ───────────────────────
// Called automatically by an installable onEdit trigger (see Step 2b).
// Sends an email when an operator changes Status to "Ready for Pickup"
// or "Needs Revision".
function onEditInstallable(e) {
  if (!e || !e.range) return;

  var sheet = e.range.getSheet();
  if (sheet.getName() !== SHEET_SUBMISSIONS) return;

  // Status lives in column 16 (1-based) — adjust if you added columns before it
  var STATUS_COL = 16;
  if (e.range.getColumn() !== STATUS_COL) return;

  var newStatus = e.value || '';
  if (newStatus !== 'Ready for Pickup' && newStatus !== 'Needs Revision') return;

  var row = e.range.getRow();
  if (row === 1) return; // skip header

  var rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  var jobId     = String(rowData[1]  || '');
  var firstName = String(rowData[3]  || '');
  var email     = String(rowData[18] || ''); // Email column (0-indexed 18)

  if (!email) return; // no email on file — skip silently

  try {
    var subject, body;
    if (newStatus === 'Ready for Pickup') {
      subject = 'Your 3D print is ready for pickup! (Job ' + jobId + ')';
      body =
        'Hi ' + firstName + ',\n\n' +
        'Great news — your 3D print job ' + jobId + ' has passed inspection ' +
        'and is ready for pickup at the GCI Print Lab.\n\n' +
        'Stop by during lab hours to collect your print. ' +
        'If you have any questions, ask your lab operator.\n\n' +
        '— GCI Print Lab\n' +
        'https://print.geneseelearninglab.com';
    } else {
      subject = 'Action required: your 3D print needs revision (Job ' + jobId + ')';
      body =
        'Hi ' + firstName + ',\n\n' +
        'Your 3D print job ' + jobId + ' could not be approved as submitted. ' +
        'Please review the feedback from your lab operator and resubmit your file.\n\n' +
        'Visit the submission page to try again:\n' +
        'https://print.geneseelearninglab.com/requests.html\n\n' +
        '— GCI Print Lab';
    }
    GmailApp.sendEmail(email, subject, body);
  } catch (err) {
    console.error('Email notification failed for job ' + jobId + ': ' + err.message);
  }
}

// ── Run this ONCE to register the installable trigger ────────
// Open the Apps Script editor, select this function from the dropdown,
// and click Run. You only need to do this one time per deployment.
function installStatusTrigger() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  // Remove any existing copies to avoid duplicate emails
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onEditInstallable') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('onEditInstallable')
    .forSpreadsheet(ss)
    .onEdit()
    .create();
  console.log('Status notification trigger installed successfully.');
}
```

---

### Step 2b — Install the Status-Change Email Trigger

The `onEditInstallable` function sends notification emails when you change a job's Status to **Ready for Pickup** or **Needs Revision**. Because it uses Gmail it must run as an **installable trigger** (not a simple `onEdit`), which means you register it once from the editor:

1. In the Apps Script editor, select **`installStatusTrigger`** from the function dropdown at the top.
2. Click **Run** (▶). You will be prompted to authorize Gmail access — grant it.
3. That's it. The trigger is now registered. You can verify it under **Triggers** (clock icon in the left sidebar).

> **Note:** You only need to run `installStatusTrigger` once. It removes any old copy of itself automatically, so it's safe to re-run if needed.

---

### Step 3 — Deploy the Web App

1. Click **Deploy → New deployment**.
2. Click the gear icon next to **Type** and select **Web app**.
3. Set **Description** to something like `GCI Print Farm v1`.
4. Set **Execute as** → **Me** (your Google account).
5. Set **Who has access** → **Anyone, even anonymous**.
6. Click **Deploy**.
7. Copy the **Web app URL** that appears — it will look like:
   `https://script.google.com/macros/s/AKfy.../exec`

Paste this URL into all three endpoint fields in `print-config.js`.

> **Important:** Every time you edit the Apps Script code, you must click **Deploy → Manage deployments → Edit → New version** to update the live endpoint. Changes to the script do not apply automatically.

---

### Step 4 — Managing the Queue

To update job statuses, open your Google Sheet and edit the **Status** column in the `Submissions` tab directly:

| Status Value | Meaning |
|---|---|
| `Submitted` | Auto-set on submission — awaiting helpdesk review |
| `Needs Revision` | File failed review; student must resubmit |
| `Waiting` | Approved and queued for printing |
| `Printing` | Currently printing on assigned printer |
| `Complete` | Print finished; pending pickup inspection |
| `Ready for Pickup` | Print passed inspection; student can collect |

Set the **Printer Assigned** column (e.g. `P1S-1`, `A1-2`) and **Pickup Status** column (`Yes` / `No`) as appropriate.

The public queue at `queue.html` will reflect changes within 60 seconds (auto-refresh).

---

### Step 5 — Test the Endpoint

After deploying, test the GET endpoint in a browser by visiting the web app URL directly. You should see a JSON response. If you see an error, verify:

- The `Submissions` sheet has the correct header in row 1
- The deployment is set to **Anyone, even anonymous**
- You are using the correct URL from the **Manage deployments** screen (not the test URL)

---

## 🔒 How Private Data Is Protected

- **Student/staff names, emails, and file links are never displayed** on the public queue
- The `doGet()` function in Apps Script only returns: `jobId`, `projectType`, `status`, `printerAssigned`, `pickupStatus`
- The frontend (`print-workflow.js`) additionally strips any unexpected fields using a strict `sanitizeJob()` function before rendering
- Private submission data lives only in your Google Sheet, which is not public
- `print-config.js` contains only web app URLs (not secrets) — these are public endpoints by design

---

## 📁 Legacy Files

| File | Notes |
|------|-------|
| [`GCI3Dorder.html`](GCI3Dorder.html) | Legacy order form — kept for backward compatibility but superseded by `requests.html` |
| [`Invoice_Generator.html`](Invoice_Generator.html) | Legacy invoice tool — kept as-is |

---

## 🎓 Training

The [`training/`](training/README.md) directory contains a complete five-day student training program, including instructor slides and student activity pages.

### Training Slides

| Day | Slides |
|-----|--------|
| Day 1 | [Foundations of 3D Printing](training/slides-day1.html) |
| Day 2 | [From Model to Print Setup](training/slides-day2.html) |
| Day 3 | [Designing for 3D Printing — File Types and Tinkercad](training/slides-day3.html) |
| Day 4 | [Troubleshoot and Reflect](training/slides-day4.html) |
| Day 5 | [Capstone – Remix and Improve](training/slides-day5.html) |

### Student Pages

| Day | Focus | Link |
|-----|-------|------|
| Day 1 | Foundations of 3D Printing | [Open Day 1](training/day1.html) |
| Day 2 | From Model to Print Setup | [Open Day 2](training/day2.html) |
| Day 3 | Designing for 3D Printing — File Types and Tinkercad | [Open Day 3](training/day3.html) |
| Day 4 | Troubleshoot and Reflect | [Open Day 4](training/day4.html) |
| Day 5 | Capstone – Remix and Improve | [Open Day 5](training/day5.html) |

See the full [Training README](training/README.md) for details on the program structure, shared assets, and accessibility features.

---

## 🚀 Recommended Next Improvements

- Add an instructor-only Google Sheet view with filtering and bulk status updates
- ~~Send email confirmations from Apps Script when a job is approved or ready for pickup~~ ✅ Done — `onEditInstallable` handles Ready for Pickup and Needs Revision notifications
- Add Google Form as a fallback for students without JavaScript enabled
- Expand `instructor.html` with linked rubrics, grading templates, and class handouts
- ~~Add an automated "Needs Revision" email notification from Apps Script to the student~~ ✅ Done — see above
- ~~Consider migrating to a Cloudflare Worker or similar backend for better CORS handling if GAS CORS issues arise~~ ✅ Done — `doPost` returns JSON with `Content-Type: application/json`; frontend now uses `mode:'cors'` and displays the assigned Job ID on success

