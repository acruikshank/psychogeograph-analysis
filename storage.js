const fs = require('fs')
const { dialog } = require('electron')

exports.saveWorkspace = function saveWorkspace(workspace) {
  dialog.showSaveDialog({
    title: 'Save Workspace',
    defaultPath: 'workspace.pgawkspc'
  }, writeWorkspace);

  function writeWorkspace(filename) {
    if (!filename) return;
    if (!filename.match(/\.pgawkspc$/)) filename += '.pgawkspc';
    fs.writeFile(filename, JSON.stringify(workspace), function(err) {
      if (err) throw err;
    });
  }
}

exports.openWorkspace = function openWorkspace(cb) {
  dialog.showOpenDialog({
    title: 'Open Workspace',
    filters: [{name:'PGA Workspace', extensions:['pgawkspc']}],
    properties: ['openFile']
  }, loadWorkspace);

  function loadWorkspace(filenames) {
    if (!filenames || !filenames[0]) return;
    fs.readFile(filenames[0], 'utf8', function(err, file) {
      if (err) return cb(err);
      cb(null, JSON.parse(file))
    });
  }
}
