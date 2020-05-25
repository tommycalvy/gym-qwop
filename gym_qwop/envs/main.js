const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const ipc = require('node-ipc')

app.commandLine.appendSwitch('ppapi-flash-path', app.getPath('pepperFlashSystemPlugin'))

var instance
var renderer
let width = 640
let height = 400
let action_space = 4


function createInstance () {
  // Create the browser window.
  instance = new BrowserWindow({
    width: width,
    height: height,
    webPreferences: {
      nodeIntegration: true,
      plugins: true,
      offscreen: true
    },
    show: false
  })

  // and load the index.html of the app.
  instance.loadFile('index.html')

  instance.once('ready-to-show', () => {
      console.log("start instance")
      get_frames(instance)
  })
}

function createRenderer () {

  renderer = new BrowserWindow({
    width: width,
    height: height,
    webPreferences: {
      nodeIntegration: true,
      plugins: true,
    }
  })

  // and load the index.html of the app.
  win2.loadFile('render.html')
}


app.whenReady().then(createInstance)
app.whenReady().then(createRenderer)

function init_frame_capture(inst) {
    setTimeout(() => {
        inst.webContents.sendInputEvent({type:'mouseDown', x: width / 2, y: height / 2, button:'left', clickCount: 1})
    }, 300)
    setTimeout(() => {
        inst.webContents.sendInputEvent({type:'mouseUp', x: width / 2, y: height / 2, button:'left', clickCount: 1})
    }, 350)
    setTimeout(() => {
      inst.webContents.stopPainting()
      console.log("win1 is initialized. Stoped Painting111111")
    }, 400)
}

send_action(inst, action) {
    for (let i = 0; i < action_space; i++) {
      if (action[i] && !action_set[i].down) {
        action_set[i].down = true;
        this.webContents.sendInputEvent({ type: 'keyDown', keyCode: this.actionSet[i].key });
      } else if (!action[i] && this.actionSet[i].down) {
        this.actionSet[i].down = false;
        this.webContents.sendInputEvent({ type: 'keyUp', keyCode: this.actionSet[i].key });
      }
    }
}



/*
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function get_frames(win) {
  init_frame_capture(win)
  for (let i = 0; i < 100; i++) {
    await sleep(5000)
    step(win)
  }
}
*/

/*
ipc.config.id = 'qwop';
ipc.serve(function() {
    // The path is '/tmp/app.qwop'
    ipc.server.on('step', function(data, socket) {
      ipc.log('got a message : '.debug, data);
      ipc.server.emit(socket, 'step', data+' world!');
    });

    ipc.server.on('reset', function(data, socket) {
      ipc.log('got a message : '.debug, data);
      ipc.server.emit(socket, 'step', data+' world!');
    });

    ipc.server.on('render', function(data, socket) {
      ipc.log('got a message : '.debug, data);
      ipc.server.emit(socket, 'step', data+' world!');
    });

    ipc.server.on('socket.disconnected', function(socket, destroyedSocketID) {
	     ipc.log('client ' + destroyedSocketID + ' has disconnected!');
		});

});

ipc.server.start();
*/
