// Deploy this as a separate web app from the public order endpoint.
// Execute as: aspiece@gmail.com, the owner of UPLOAD_FOLDER_ID.
// Access: Anyone with a Google account (sign-in required by the deployment).
var UPLOAD_FOLDER_ID = '1MzYyfqfyOT4Mu5Euv-Rn7uUHtQG5sC87';
var MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
var ALLOWED_EXTENSIONS = ['stl', '3mf', 'obj', 'step', 'stp'];

function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  var formType = e && e.parameter && e.parameter.form;
  var state = e && e.parameter && e.parameter.state;
  template.formType = formType === 'student' || formType === 'staff' ? formType : '';
  template.state = /^[A-Za-z0-9_-]{8,80}$/.test(String(state || '')) ? state : '';
  return template.evaluate()
    .setTitle('Upload a Print File | GCI Print Lab');
}

function uploadPrintFile(form) {
  var blob = form && form.printFile;
  if (!blob || typeof blob.getBytes !== 'function') {
    throw new Error('Choose a print file before uploading.');
  }

  var originalName = String(blob.getName() || '');
  var extension = originalName.split('.').pop().toLowerCase();
  if (ALLOWED_EXTENSIONS.indexOf(extension) === -1) {
    throw new Error('Upload an STL, 3MF, OBJ, STEP, or STP file.');
  }
  var bytes = blob.getBytes();
  if (!bytes.length || bytes.length > MAX_UPLOAD_BYTES) {
    throw new Error('The file must be between 1 byte and 25 MB.');
  }

  var safeName = originalName.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 100);
  var folder = DriveApp.getFolderById(UPLOAD_FOLDER_ID);
  var file = folder.createFile(blob.setName(safeName));
  file.setDescription('GCI Print Lab print request upload');
  return { name: safeName, url: file.getUrl() };
}
