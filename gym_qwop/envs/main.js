const { app, ipcMain, BrowserWindow } = require('electron')
const path = require('path')
const ipc = require('node-ipc')
const QWOP = require('./remote/qwop.js')

app.commandLine.appendSwitch('ppapi-flash-path', app.getPath('pepperFlashSystemPlugin'))

const cmdargs = process.argv.slice(2)
global.args = {
  totalAgents: parseInt(cmdargs[0], 10),
  framesInState: parseInt(cmdargs[1], 10),
  width: parseInt(cmdargs[2], 10),
  height: parseInt(cmdargs[3], 10),
  crops: {
    x: parseInt(cmdargs[4], 10),
    y: parseInt(cmdargs[5], 10),
    width: parseInt(cmdargs[6], 10),
    height: parseInt(cmdargs[7], 10)
  },
  enableRender: (cmdargs[8] == 'True'),
  flashGame: cmdargs[9]
}

function createRemote() {
  const remote = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      plugins: true
    },
    show: true
  })
  remote.loadFile('./remote/remote.html')
  remote.openDevTools()
  return remote
}


app.whenReady().then(createRemote)

/*
//ipc.config.silent=true;
let serverAddress = '/tmp/app.qwop'
ipc.serve(serverAddress, function() {
    // The path is '/tmp/app.qwop'
    ipc.server.on('step', function(actions, socket) {
      ipc.log('step env: '.debug, actions);
      qwop.step_all(JSON.parse(actions)).then(obs => {
        ipc.server.emit(socket, 'step', obs);
      })
    });

    ipc.server.on('reset', function(data, socket) {
      ipc.log('got a message : '.debug, data);
      qwop.reset().then(obs => {
        console.log('Sending Observations after reset')
        ipc.server.emit(socket, 'reset', obs);
      })
    });

    ipc.server.on('render', function(data, socket) {
      ipc.log('got a message : '.debug, data);
      qwop.render()
    });

    ipc.server.on('close', function(data, socket) {
      ipc.log('got a message : '.debug, data);
      qwop.close()
      app.quit()
    });

    ipc.server.on('socket.disconnected', function(socket, destroyedSocketID) {
	     ipc.log('client ' + destroyedSocketID + ' has disconnected!');
		});

});

ipc.server.start();

*/
