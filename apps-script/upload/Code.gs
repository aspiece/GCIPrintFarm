// Deploy this as a separate web app from the public order endpoint.
// Execute as: aspiece@gmail.com, the owner of UPLOAD_FOLDER_ID.
// Access: Anyone with a Google account (sign-in required by the deployment).
var UPLOAD_FOLDER_ID = '1MzYyfqfyOT4Mu5Euv-Rn7uUHtQG5sC87';
var MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
var ALLOWED_EXTENSIONS = ['stl', '3mf', 'obj', 'step', 'stp'];

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
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
    throw new Error('The file must be between 1 byte and 10 MB.');
  }

  var safeName = originalName.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 100);
  var folder = DriveApp.getFolderById(UPLOAD_FOLDER_ID);
  var file = folder.createFile(blob.setName(safeName));
  file.setDescription('GCI Print Lab print request upload');
  return { name: safeName, url: file.getUrl() };
}
