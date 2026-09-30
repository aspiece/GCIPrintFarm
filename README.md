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
| [`lab-settings.js`](lab-settings.js) | Configurable endpoint URLs — **update these before going live** |
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
3. **Google Apps Script** receives the POST, appends the submission to the operator Sheet, assigns a Job ID, and **immediately emails the submitter** a confirmation with their Job ID
4. A **helpdesk operator** reviews the submission and updates the job status in the `Submissions` sheet
5. Whenever the operator changes Status, Printer Assigned, or Pickup Status, the installable trigger **rebuilds the `Queue` tab** (public-safe fields only). Status changes to **Ready for Pickup** or **Needs Revision** also email the submitter.
6. The public `queue.html` fetches **sanitized data only** from a separate GAS endpoint — no names, emails, or file links are ever exposed
7. The queue auto-refreshes every 60 seconds and supports filter controls (Waiting / Printing / Complete / Ready for Pickup)

---

## ⚙️ Configuration — Update Before Going Live

The existing request and queue endpoints are configured in [`lab-settings.js`](lab-settings.js). After deploying the separate upload app, add its URL to `UPLOAD_APP_URL`:

```js
global.PRINT_CONFIG = {
  STUDENT_SUBMIT_ENDPOINT: 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE',
  STAFF_SUBMIT_ENDPOINT:   'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE',
  QUEUE_ENDPOINT:          'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE',
  QUEUE_REFRESH_INTERVAL:  60000,
  UPLOAD_APP_URL:          'YOUR_UPLOAD_WEB_APP_URL_HERE'
};
```

All three endpoints can point to the same deployed web app URL if you use a single Apps Script project.
The upload app must be a separate deployment that requires sign-in with any Google account. Until `UPLOAD_APP_URL` is set, the request form shows that uploads are being set up and continues to accept Drive or MakerWorld links.

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

5. Create a third sheet tab named **`Dropdown Options`** with these headers in row 1:

```
Status | Printer Assigned | Pickup Status
```

Then add your choices underneath each header. Example:

| Status | Printer Assigned | Pickup Status |
|---|---|---|
| Submitted | A1-1 | No |
| Needs Revision | A1-2 | Yes |
| Waiting | A1 Mini-1 |  |
| Printing | P1S-1 |  |
| Complete | P1S-2 |  |
| Ready for Pickup |  |  |

The Apps Script will copy only the public-safe fields from `Submissions` into `Queue` when updating, and will use `Dropdown Options` to power editable dropdowns in the `Submissions` tab.

---

### Step 2 — Create the Apps Script

1. From the spreadsheet, click **Extensions → Apps Script**.
2. Replace the existing project code with the maintained version linked below, then save it. Redeploy a new version if the web app functions change.

Copy the maintained script from [`apps-script/Code.gs`](apps-script/Code.gs) into the spreadsheet-bound Apps Script project. Keep a copy of your deployed version before replacing it.

---

### Step 2b — Install the Status-Change Trigger

The `onEditInstallable` function responds to operator edits in the `Submissions` sheet:

1. **Rebuilds the `Queue` tab** when Status, Printer Assigned, or Pickup Status changes.
2. **Emails the submitter** when Status becomes **Ready for Pickup** or **Needs Revision**.
3. **Re-applies Submissions dropdowns** when the `Dropdown Options` tab is edited.

Because it uses Gmail it must run as an **installable trigger** (not a simple `onEdit`), which means you register it once from the editor:

1. In the Apps Script editor, select **`installStatusTrigger`** from the function dropdown at the top.
2. Click **Run** (▶). You will be prompted to authorize Gmail access — grant it.
3. That's it. The trigger is now registered. You can verify it under **Triggers** (clock icon in the left sidebar).

> **Note:** You only need to run `installStatusTrigger` once. It removes any old copy of itself automatically, so it's safe to re-run if needed. It also applies dropdown validation rules to `Status`, `Printer Assigned`, and `Pickup Status`.

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

Paste this URL into all three endpoint fields in `lab-settings.js`.

> **Important:** Every time you edit the Apps Script code, you must click **Deploy → Manage deployments → Edit → New version** to update the live endpoint. Changes to the script do not apply automatically.

---

### Step 4 — Managing the Queue

To update job statuses, open your Google Sheet and edit the **Status** column in the `Submissions` tab directly (using the dropdown):

| Status Value | Meaning |
|---|---|
| `Submitted` | Auto-set on submission — awaiting helpdesk review |
| `Needs Revision` | File failed review; student must resubmit |
| `Waiting` | Approved and queued for printing |
| `Printing` | Currently printing on assigned printer |
| `Complete` | Print finished; pending pickup inspection |
| `Ready for Pickup` | Print passed inspection; student can collect |

Set the **Printer Assigned** column (e.g. `P1S-1`, `A1-2`) and **Pickup Status** column (`Yes` / `No`) as appropriate using their dropdowns.

To change any dropdown choices, edit the **`Dropdown Options`** tab.  
Your changes will automatically apply to the `Submissions` tab.

The public queue at `queue.html` will reflect changes within 60 seconds (auto-refresh). The `Queue` sheet tab is rebuilt after edits to Status, Printer Assigned, or Pickup Status. Use the `Operator Guide` tab for the stage sequence.

### Google account file uploads

Both student and staff request forms offer two ways to provide a file: paste an accessible Google Drive or MakerWorld link, or upload a file through a separate sign-in page. After upload, “Return to request form” fills the File Link field automatically; the upload page also shows the link for manual copying if needed. The upload page and server code are in [`apps-script/upload/`](apps-script/upload/). It accepts STL, 3MF, OBJ, STEP, STP, PNG, JPG/JPEG, WEBP, GIF, and HEIC/HEIF files up to 25 MB and saves them in the [GCI Print Lab Uploads folder](https://drive.google.com/drive/folders/1MzYyfqfyOT4Mu5Euv-Rn7uUHtQG5sC87). An image is an idea for operator review, not a print-ready model. Students can select “Idea / design help,” which replaces print settings and the pre-print checklist with a required description in Notes. Staff describe their idea in Purpose of Print.

The [upload web app](https://script.google.com/macros/s/AKfycbz7CIFLQfR9H1gSXejMYqlPpSfKx-iNzxhoeaFXH1tkRvUFYqFl1bz9BH05MwK2T-U/exec) is deployed from the [GCI Print Lab Uploads Apps Script project](https://script.google.com/home/projects/1LW079tQi-o4uXthWG6o-3vC3fdHpIQVryh5NFniTPvFn3AUiNNfL-3sk/edit) under `aspiece@gmail.com`. It **executes as the personal account** and allows **anyone with a Google account**. This requires sign-in but does not require a school account. The URL is set in `UPLOAD_APP_URL` in `lab-settings.js`. Keep this upload deployment separate from the public request endpoint so its sign-in requirement does not block link-based requests.

The upload folder is currently shared with anyone who has its link as an editor, as requested. Such users can add or modify files in the folder even without using the upload page.

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
- Submission names, emails, and file links remain out of the public queue. The live operator Sheet currently allows anyone with its link to edit, so its contents are accessible to link holders.
- `lab-settings.js` contains only web app URLs (not secrets) — these are public endpoints by design

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
- ~~Send email confirmations from Apps Script when a job is approved or ready for pickup~~ ✅ Done — `sendSubmissionConfirmation` fires immediately on submission; `onEditInstallable` handles Ready for Pickup and Needs Revision notifications
- Add Google Form as a fallback for students without JavaScript enabled
- Expand `instructor.html` with linked rubrics, grading templates, and class handouts
- ~~Add an automated "Needs Revision" email notification from Apps Script to the student~~ ✅ Done — see above
- ~~Keep the Queue sheet auto-synced when status changes~~ ✅ Done — `syncQueueSheet()` rebuilds the Queue tab on every Status edit
- ~~Consider migrating to a Cloudflare Worker or similar backend for better CORS handling if GAS CORS issues arise~~ ✅ Done — `doPost` returns JSON with `Content-Type: application/json`; frontend now uses `mode:'cors'` and displays the assigned Job ID on success
