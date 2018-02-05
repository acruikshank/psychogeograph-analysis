const fs = require('fs')
const { dialog, nativeImage } = require('electron')

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

exports.saveToolset = function saveToolset(toolset) {
  dialog.showSaveDialog({
    title: 'Save Toolset',
    defaultPath: 'toolset.pgatools'
  }, writeToolset);

  function writeToolset(filename) {
    if (!filename) return;
    if (!filename.match(/\.pgatools$/)) filename += '.pgatools';
    fs.writeFile(filename, JSON.stringify(toolset), function(err) {
      if (err) throw err;
    });
  }
}

exports.openToolset = function openToolset(cb) {
  dialog.showOpenDialog({
    title: 'Open Toolset',
    filters: [{name:'PGA Toolset', extensions:['pgatools']}],
    properties: ['openFile']
  }, loadToolset);

  function loadToolset(filenames) {
    if (!filenames || !filenames[0]) return;
    fs.readFile(filenames[0], 'utf8', function(err, file) {
      if (err) return cb(err);
      cb(null, JSON.parse(file))
    });
  }
}

exports.saveImageReport = function saveImageReport(dataURL) {
  var img = nativeImage.createFromDataURL(dataURL).toPng();

  dialog.showSaveDialog({
    title: 'Save Image Report',
    defaultPath: 'image_report.png'
  }, writeImageReport);

  function writeImageReport(filename) {
    if (!filename) return;
    if (!filename.match(/\.png$/)) filename += '.png';
    fs.writeFile(filename, img, function(err) {
      if (err) throw err;
    });
  }
}

exports.exportCSV = function exportCSV(data) {
  dialog.showSaveDialog({
    title: 'Export CSV'
  }, writeToCSV);

  function safe(str) { return '"'+str.replace(/"/g,'""')+'"' }

  function writeToCSV(filename) {
    if (!filename) return;
    if (!filename.match(/\.csv$/)) filename += '.csv';
    let markerPredicates = data.markers.map((m) => {
      let start = new Date(m.start)
      let end = new Date(m.end)
      return (d) => d >= start && d <= end
    })

    let csv = data.labels.map((l) => safe(l))
      .concat(data.markers.map((m) => safe(m.name))).join(',')
      + '\n'

      + data.data.map((row) => {
        let date = new Date(row[0])
        return safe(date.toLocaleString()) + ','
          + row.slice(1).map((f) => f.toFixed(4))
          .concat(markerPredicates.map((p) => (p(date) ? 'Y' : ''))).join(',')
      }).join('\n')

    fs.writeFile(filename, csv, function(err) {
      if (err) throw err;
    });
  }
}
