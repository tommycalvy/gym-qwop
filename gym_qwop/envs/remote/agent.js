const { ipcRenderer, remote, process } = require('electron');
const FlashGame = require('./flash_game.js');
const Qwop = require('./qwop.js');
const AgentReward = require('./reward/agent_reward.js');
const querystring = require('querystring');
console.log('agent')
let query = querystring.parse(global.location.search);
let data = JSON.parse(query['?data']);

let reward = new AgentReward(data.id); // needs fixing
let flashGame = new FlashGame(remote, ipcRenderer, Qwop, reward, process);

console.log(process)

ipcRenderer.on('update-model', () => {
  this.reward.model = tf.loadLayersModel('localstorage://updated-reward-model-1')
})

ipcRenderer.on('init', (event) => {
  flashGame.init().then(status => {
    console.log('status: ' + status)
    //process.getHeapStatistics()
    ipcRenderer.sendTo(data.remoteId, 'init', status);
  })
})

ipcRenderer.on('reset', (event) => {
  flashGame.reset().then(obs => {
    //console.log(obs)
    //process.getHeapStatistics()
    ipcRenderer.sendTo(data.remoteId, 'obs' + data.id, obs);
  })
})

ipcRenderer.on('step', (event, action) => {
  flashGame.step(action).then(obs => {
    ipcRenderer.sendTo(data.remoteId, 'obs' + data.id, obs);
  })
})

ipcRenderer.on('render', () => {
  flashGame.render()
})

ipcRenderer.on('close', () => {
  flashGame.close()
})
