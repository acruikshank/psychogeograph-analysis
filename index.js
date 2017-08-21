// Module to control application life.
const {app, BrowserWindow, Menu, ipcMain} = require('electron')
// Module to create native browser window.

const path = require('path')
const url = require('url')
const { saveWorkspace, openWorkspace, openToolset, saveToolset, exportCSV } = require('./storage');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, workspace;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width:1440, height:860})

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'app/analysis.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function () {
  const menu = require('./main_menu').init();
  menu.on('save_workspace', () => saveWorkspace(workspace));
  menu.on('open_workspace', () => openWorkspace(changeWorkspace));
  menu.on('new_workspace', () => resetWorkspace());
  menu.on('save_toolset', () => saveToolset(workspace.signals));
  menu.on('open_toolset', () => openToolset(changeToolset));
  menu.on('export_csv', () => requestExport());

  ipcMain.on('workspace', (event, ws) => { workspace = JSON.parse(ws) })
  ipcMain.on('signalData', (event, data) => { exportCSV(data) })

  createWindow()
})

function changeWorkspace(err, ws) {
  workspace = ws
  mainWindow.webContents.send('workspace', workspace)
}

function changeToolset(err, signals) {
  workspace = workspace || {};
  workspace.signals = signals
  mainWindow.webContents.send('toolset', signals)
}

function requestExport() {
  mainWindow.webContents.send('signalData')
}

function resetWorkspace() {
  mainWindow.webContents.send('reset')
}

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})
