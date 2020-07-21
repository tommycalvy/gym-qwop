const { app } = require('electron')
const path = require('path')
const ipc = require('node-ipc')
const QWOP = require('./remote/qwop.js')

app.commandLine.appendSwitch('ppapi-flash-path', app.getPath('pepperFlashSystemPlugin'))

const cmdargs = process.argv.slice(2)
let args = {
  totalEnvs: parseInt(cmdargs[0], 10),
  framesInState: parseInt(cmdargs[1], 10),
  width: parseInt(cmdargs[2], 10),
  height: parseInt(cmdargs[3], 10),
  crops: [
    parseInt(cmdargs[4], 10),
    parseInt(cmdargs[5], 10),
    parseInt(cmdargs[6], 10),
    parseInt(cmdargs[7], 10)
  ],
  enableRender: (cmdargs[8] == true)
}
let qwop = new QWOP(args)
app.whenReady().then(qwop.init_envs())



ipc.config.id = 'qwop';
ipc.serve(function() {
    // The path is '/tmp/app.qwop'
    ipc.server.on('step', function(actions, socket) {
      ipc.log('step env: '.debug, actions);
      let returns = qwop.step_all(actions)
      ipc.server.emit(socket, 'step', JSON.stringify(returns));
    });

    ipc.server.on('reset', function(data, socket) {
      ipc.log('got a message : '.debug, data);
      let obs = qwop.reset()
      ipc.server.emit(socket, 'reset', JSON.stringify(obs));
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
