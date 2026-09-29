// ── Configuration ──────────────────────────────────────────
var SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
var SHEET_SUBMISSIONS = 'Submissions';
var SHEET_QUEUE = 'Queue';
var SHEET_DROPDOWN_OPTIONS = 'Dropdown Options';
var JOB_ID_PREFIX = 'PF-';  // e.g. PF-26-001
var STATUS_COL = 16;             // P
var PRINTER_ASSIGNED_COL = 17;   // Q
var PICKUP_STATUS_COL = 18;      // R

// ── POST: Receive form submissions ─────────────────────────
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_SUBMISSIONS);
    if (!sheet) throw new Error('Missing Submissions sheet');

    // Keep dropdown validations in place before writing rows.
    applySubmissionsDropdowns();

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

    // Send an immediate confirmation email so the submitter knows their Job ID
    var email = sanitize(body.email);
    var firstName = sanitize(body.firstName);
    if (email) {
      sendSubmissionConfirmation(jobId, firstName, email, body.requestType);
    }

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
function getColumnValuesFromRow2(sheet, colIndex) {
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
  var unique = {};
  var out = [];
  for (var i = 0; i < values.length; i++) {
    var v = String(values[i][0] || '').trim();
    if (!v || unique[v]) continue;
    unique[v] = true;
    out.push(v);
  }
  return out;
}

function getDropdownLists(ss) {
  var optionsSheet = ss.getSheetByName(SHEET_DROPDOWN_OPTIONS);
  if (!optionsSheet) {
    optionsSheet = ss.insertSheet(SHEET_DROPDOWN_OPTIONS);
    optionsSheet.getRange(1, 1, 1, 3).setValues([['Status', 'Printer Assigned', 'Pickup Status']]);
    optionsSheet.getRange(2, 1, 6, 3).setValues([
      ['Submitted', 'A1-1', 'No'],
      ['Needs Revision', 'A1-2', 'Yes'],
      ['Waiting', 'A1 Mini-1', ''],
      ['Printing', 'P1S-1', ''],
      ['Complete', 'P1S-2', ''],
      ['Ready for Pickup', '', '']
    ]);
  }

  var statuses = getColumnValuesFromRow2(optionsSheet, 1);
  var printers = getColumnValuesFromRow2(optionsSheet, 2);
  var pickups  = getColumnValuesFromRow2(optionsSheet, 3);

  // Safe defaults if a column is empty.
  if (statuses.length === 0) {
    statuses = ['Submitted', 'Needs Revision', 'Waiting', 'Printing', 'Complete', 'Ready for Pickup'];
  }
  if (pickups.length === 0) {
    pickups = ['No', 'Yes'];
  }

  return {
    statuses: statuses,
    printers: printers,
    pickups: pickups
  };
}

function applySubmissionsDropdowns() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var subSheet = ss.getSheetByName(SHEET_SUBMISSIONS);
  if (!subSheet) return;

  var lists = getDropdownLists(ss);
  var numRows = Math.max(subSheet.getMaxRows() - 1, 1); // from row 2 onward

  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(lists.statuses, true)
    .setAllowInvalid(false)
    .build();
  subSheet.getRange(2, STATUS_COL, numRows, 1).setDataValidation(statusRule);

  var pickupRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(lists.pickups, true)
    .setAllowInvalid(false)
    .build();
  subSheet.getRange(2, PICKUP_STATUS_COL, numRows, 1).setDataValidation(pickupRule);

  // Printer assignment list is optional; only apply if choices exist.
  if (lists.printers.length > 0) {
    var printerRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(lists.printers, true)
      .setAllowInvalid(false)
      .build();
    subSheet.getRange(2, PRINTER_ASSIGNED_COL, numRows, 1).setDataValidation(printerRule);
  } else {
    subSheet.getRange(2, PRINTER_ASSIGNED_COL, numRows, 1).clearDataValidations();
  }
}

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

// ── Immediate submission confirmation email ──────────────────
// Sent by doPost() as soon as the row is appended to Submissions.
function sendSubmissionConfirmation(jobId, firstName, email, requestType) {
  try {
    var greeting = firstName ? 'Hi ' + firstName + ',' : 'Hello,';
    var typeLabel = requestType === 'staff' ? 'staff' : 'print';
    var subject = 'Print request received — Job ' + jobId;
    var body =
      greeting + '\n\n' +
      'We received your 3D ' + typeLabel + ' request and it has been logged.\n\n' +
      'Your Job ID is: ' + jobId + '\n\n' +
      'A lab operator will review your submission and begin printing when a printer is ' +
      'available. You will receive another email when your print is ready for pickup or ' +
      'if any revisions are needed.\n\n' +
      'You can check the live status of your job at:\n' +
      'https://print.geneseelearninglab.com/queue.html\n\n' +
      '— GCI Print Lab\n' +
      'https://print.geneseelearninglab.com';
    GmailApp.sendEmail(email, subject, body);
  } catch (err) {
    console.error('Confirmation email failed for job ' + jobId + ': ' + err.message);
  }
}

// ── Sync the Queue sheet from Submissions ────────────────────
// Rebuilds the Queue tab so it always mirrors the active jobs visible
// on the public queue page. Called when Status, Printer Assigned, or
// Pickup Status changes.
function syncQueueSheet() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var subSheet = ss.getSheetByName(SHEET_SUBMISSIONS);
    var qSheet   = ss.getSheetByName(SHEET_QUEUE);
    if (!subSheet || !qSheet) return;

    var data = subSheet.getDataRange().getValues();
    var activeStatuses = ['Waiting', 'Printing', 'Complete', 'Ready for Pickup'];

    // Collect public-safe fields for every active job
    var queueRows = [['Job ID', 'Project Type', 'Status', 'Printer Assigned', 'Pickup Status']];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var status = String(row[15] || '');
      if (activeStatuses.indexOf(status) === -1) continue;
      queueRows.push([
        String(row[1]  || ''),   // Job ID
        String(row[7]  || ''),   // Project Type
        status,                  // Status
        String(row[16] || ''),   // Printer Assigned
        String(row[17] || 'No')  // Pickup Status
      ]);
    }

    // Clear and rewrite — keeps the tab perfectly in sync with Submissions
    qSheet.clearContents();
    qSheet.getRange(1, 1, queueRows.length, 5).setValues(queueRows);
  } catch (err) {
    console.error('syncQueueSheet failed: ' + err.message);
  }
}

// ── Status-change trigger ────────────────────────────────────
// Called automatically by an installable onEdit trigger (see Step 2b).
// • Syncs the Queue sheet on Status, Printer Assigned, or Pickup Status edits.
// • Emails the submitter when Status becomes "Ready for Pickup" or "Needs Revision".
function onEditInstallable(e) {
  if (!e || !e.range) return;

  var sheet = e.range.getSheet();
  var sheetName = sheet.getName();

  // If dropdown options were edited, immediately re-apply validations.
  if (sheetName === SHEET_DROPDOWN_OPTIONS) {
    applySubmissionsDropdowns();
    return;
  }
  if (sheetName !== SHEET_SUBMISSIONS) return;

  var row = e.range.getRow();
  if (row === 1) return; // skip header

  var firstCol = e.range.getColumn();
  var lastCol = firstCol + e.range.getNumColumns() - 1;
  if (lastCol < STATUS_COL || firstCol > PICKUP_STATUS_COL) return;

  // Keep the public-safe Queue tab current when any operational field changes.
  syncQueueSheet();

  // Bulk edits may affect several jobs, but e.value is only dependable for
  // a single cell. Avoid sending duplicate or incorrect emails.
  if (e.range.getNumRows() !== 1 || e.range.getNumColumns() !== 1 || firstCol !== STATUS_COL) return;
  var newStatus = e.value || '';
  if (newStatus === e.oldValue) return;

  // Only send email for specific status transitions
  if (newStatus !== 'Ready for Pickup' && newStatus !== 'Needs Revision') return;

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
  applySubmissionsDropdowns();

  // Remove any existing copies to avoid duplicate triggers
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
