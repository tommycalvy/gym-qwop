const { app, BrowserWindow } = require('electron')
const path = require('path')

app.commandLine.appendSwitch('ppapi-flash-path', app.getPath('pepperFlashSystemPlugin'))

let remote = null;
function createRemote () {
  instance = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      plugins: true,
      offscreen: true
    },
    show: false
  })
  remote.loadFile('remote/remote.html')
}
app.whenReady().then(createRemote)


/*

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}


async function get_frames(win) {
  init_frame_capture(win)
  for (let i = 0; i < 100; i++) {
    win.webContents.startPainting()
    await sleep(5000)
    win.webContents.stopPainting()
    await sleep(5000)
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
