const {app, Menu} = require('electron')
const EventEmitter = require('events');
class MenuEmitter extends EventEmitter {}
const menuEmitter = new MenuEmitter();

exports.init = function init() {
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu);
  return menuEmitter;
}

function dispatch(menuItem) {
  menuEmitter.emit(menuItem.role, menuItem);
}

const template = [
  {
    label: 'File',
    submenu: [
      {
        role: 'new_workspace',
        label: 'New Workspace',
        accelerator: 'CommandOrControl+N',
        click: dispatch
      },
      {
        role: 'open_workspace',
        label: 'Open Workspace...',
        accelerator: 'CommandOrControl+O',
        click: dispatch
      },
      {
        role: 'save_workspace',
        label: 'Save Workspace...',
        accelerator: 'CommandOrControl+S',
        click: dispatch
      },
      {
        type: 'separator'
      },
      {
        role: 'save_toolset',
        label: 'Save Toolset...',
        accelerator: 'CommandOrControl+Shift+S',
        click: dispatch
      },
      {
        role: 'open_toolset',
        label: 'Open Toolset...',
        accelerator: 'CommandOrControl+Shift+O',
        click: dispatch
      }
    ]
  }
]

if (process.platform === 'darwin') {
  template.unshift({
    label: app.getName(),
    submenu: [
      {
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        role: 'services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        role: 'hide'
      },
      {
        role: 'hideothers'
      },
      {
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        role: 'quit'
      }
    ]
  })
};
