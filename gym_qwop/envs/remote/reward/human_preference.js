const ipc = require('electron').ipcRenderer
const HPReward = require('./hp_reward.js')

let query = querystring.parse(global.location.search);
let data = JSON.parse(query['?data']);
let reward = new HPReward(ipc, data.totalEnvs)
const vid1 = document.getElementById('vid1');
const vid2 = document.getElementById('vid2');
const ctxvid1 = vid1.getContext('2d');
const ctxvid2 = vid2.getContext('2d');
var playVid
var trajs
var traj1
var traj2
var traj1States = []
var traj2States = []
var states = []
var rewards = []
var count = 0
let trainingSize = 500

let trajNum = document.getElementById('traj-num')

window.setInterval(function() {
  let trajCount = await reward.db.["trajectories"].count()
  trajNum.innerHTML = "Trajectories Available: " + trajCount
}, 1000)

function startTraining() {
  trajs = reward.get_sorted_trajs()
  presentClips()
}

function presentClips() {
  traj1 = trajs[0]
  traj2 = trajs[1]
  traj1States = await reward.db.["env" + traj1.env]
    .where('num')
    .between(traj1.begState, traj1.endState)
    .toArray()
  traj2States = await reward.db.["env" + traj2.env]
    .where('num')
    .between(traj2.begState, traj2.agentidState)
    .toArray()
  let j = 0
  let k = 0
  playVid = window.setInterval(function() {
    ctxvid1.drawImage(traj1States[j].frames[k], 0, 0)
    ctxvid2.drawImage(traj2States[j].frames[k], 0, 0)
    j++
    k++
    if (j % 25 == 0) {
      j = 0
    }
    if (k % 4 == 0) {
      k = 0
    }
  }, 20)
}

function recordPreference(pref) {
  window.clearInterval(playVid)
  if (pref != null) {
    let dif1 = pref - traj1.exprew
    let dif2 = 1 - pref - traj2.exprew
    let adjusted
    let i
    for (i = 0; i < traj1.endState - traj1.begState; i++) {
      states.push(traj1States[i].state)
      adjusted = traj1States[i].reward + dif1 / (traj1.endState - traj1.begState)
      rewards.push(adjusted)
    }
    for (i = 0; i < traj2.endState - traj2.begState; i++) {
      states.push(traj2States[i].state)
      adjusted = traj2States[i].reward + dif2 / (traj2.endState - traj2.begState)
      rewards.push(adjusted)
    }
    count++
  }
  trajs.shift()
  trajs.shift()
  presentClips()
  if (count % 500) {
    reward.train_model(states, rewards).then(() => {
      states = []
      rewards = []
    })
  }

  reward.db.transaction('rw' reward.db.["env" + traj1.env], reward.db.["env" + traj2.env], reward.db.["trajectories"], () => {
    reward.db.["env" + traj1.env]
      .query('num')
      .between(traj1.begState, traj1.endState)
      .delete()
    reward.db.["env" + traj2.env]
      .query('num')
      .between(traj2.begState, traj2.endState)
      .delete()
    reward.db.["trajectory"]
      .query('num')
      .anyOf(traj1.num, traj2.num)
      .delete()
  })

}
