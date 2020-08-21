const { remote, ipcRenderer } = require('electron')
const ipc = require('node-ipc')
const GameController = require('./game_controller.js')
console.log('hello')
//app.commandLine.appendSwitch('ppapi-flash-path', app.getPath('pepperFlashSystemPlugin'))

let games = new GameController(remote, ipcRenderer)

ipcRenderer.on('update-model', () => {
  games.update_model()
})


let serverAddress = '/tmp/app.qwop';
ipc.serve(serverAddress, function() {

    ipc.server.on('init', (data, socket) => {
      ipc.log('got a message : '.debug, data)
      games.init().then(statuses => {
        console.log('init resolved')
        console.log(statuses)
        ipc.server.emit(socket, 'init', statuses);
      })
    })

    ipc.server.on('step', (actions, socket) => {
      ipc.log('got a message : '.debug, data)
      games.step(JSON.parse(actions)).then(obs => {
        ipc.server.emit(socket, 'step', obs);
      })
    })

    ipc.server.on('reset', (data, socket) => {
      ipc.log('got a message : '.debug, data)
      games.reset().then(obs => {
        ipc.server.emit(socket, 'reset', obs);
      })
    })

    ipc.server.on('render', (data, socket) => {
      ipc.log('got a message : '.debug, data);
      games.render();
    });

    ipc.server.on('close', (data, socket) => {
      ipc.log('got a message : '.debug, data);
      games.close();
      remote.quit();
    });

    ipc.server.on('socket.disconnected', function(socket, destroyedSocketID) {
	     ipc.log('client ' + destroyedSocketID + ' has disconnected!')
		})

})

ipc.server.start()
