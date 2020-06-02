const { app, BrowserWindow } = require('electron').remote
const ipc = require('node-ipc')

app.commandLine.appendSwitch('ppapi-flash-path', app.getPath('pepperFlashSystemPlugin'))


let qwop = new QWOP()
app.whenReady().then(qwop.create_envs())





ipc.config.id = 'qwop'
ipc.serve(function() {
    // The path is '/tmp/app.qwop'
    ipc.server.on('step', function(data, socket) {
      ipc.log('got a message : '.debug, data)
      ipc.server.emit(socket, 'step', data+' world!')
    })

    ipc.server.on('reset', function(data, socket) {
      ipc.log('got a message : '.debug, data)
      ipc.server.emit(socket, 'step', data+' world!')
    })

    ipc.server.on('render', function(data, socket) {
      ipc.log('got a message : '.debug, data)
      ipc.server.emit(socket, 'step', data+' world!')
    });

    ipc.server.on('socket.disconnected', function(socket, destroyedSocketID) {
	     ipc.log('client ' + destroyedSocketID + ' has disconnected!')
		})

})

ipc.server.start()
