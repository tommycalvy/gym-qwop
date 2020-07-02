const { BrowserWindow } = require('electron')
import * as tf from '@tensorflow/tfjs-node'
const Dexie = require('dexie')

module.exports = class HPReward {

  constructor(ipc, totalEnvs, createGui=false, statesInTraj=25, totTraj=5, framesInState=4, width=81, height=81, reward_lr=0.95) {
    this.totalEnvs = totalEnvs
    this.statesInTraj = statesInTraj
    this.totTraj = totTraj
    this.framesInState = framesInState;
    this.guiWidth = 1200;
    this.guiHeight = 800;
    this.reward_lr = reward_lr
    this.count = 0
    this.trainingCount = 0
    this.reward = this.build_reward()
    this.db = create_db()
    if (createGui) {
      this.gui = create_gui()
      this.data = {"totalEnvs": totalEnvs}
    }
    Dexie.debug = true
    ipc.on('update-model', (even, args) => {
      this.reward = await tf.loadLayersModel('localstorage://updated-reward-model-1')
    })
  }

  build_reward() {
    const model = tf.sequential();
    // Input is 81x81x4
    // 144 weights
    model.add(tf.layers.conv2d({
      inputShape: [this.width, this.height, this.frames],
      kernelSize: 3,
      filters: 16,
      strides: 2,
      padding: 'same',
      activation: 'selu',
      kernelInitializer: 'heNormal'
    }));
    // Output is 41x41x8
    // 144 weights
    model.add(tf.layers.conv2d({
      kernelSize: 3,
      filters: 16,
      strides: 2,
      padding: 'same',
      activation: 'selu',
      kernelInitializer: 'heNormal'
    }));
    // Output is 21x21x8
    // 144 weights
    model.add(tf.layers.conv2d({
      kernelSize: 3,
      filters: 16,
      strides: 2,
      padding: 'same',
      activation: 'selu',
      kernelInitializer: 'heNormal'
    }));
    // Output is 11x11x16
    // 144 weights
    model.add(tf.layers.conv2d({
      kernelSize: 3,
      filters: 32,
      strides: 2,
      padding: 'same',
      activation: 'selu',
      kernelInitializer: 'heNormal'
    }));
    // Output is 6x6x32
    // 288 weights
    model.add(tf.layers.conv2d({
      kernelSize: 3,
      filters: 32,
      strides: 3,
      padding: 'valid',
      activation: 'selu',
      kernelInitializer: 'heNormal'
    }));
    // Output is 2x2x32
    // 288 weights
    model.add(tf.layers.flatten());
    // Output is 128
    model.add(tf.layers.dense({
      units: 64,
      kernelInitializer: 'heNormal',
      activation: 'selu'
    }));
    // Output is 64
    // 8192 weights
    model.add(tf.layers.dense({
      units: 1,
      kernelInitializer: 'heNormal',
      activation: 'tanh'
    }));
    // 1024 weights
    model.summary();

    model.compile({
      optimizer: tf.train.adam(this.reward_lr),
      loss: tf.losses.softmaxCrossEntropy
    });
    return model;
  }

  format_state(frames) {
    let tframe
    let state
    let tframes = [this.framesInState]
    for (let i = 0; i < this.framesInState; i++) {
      tframe = tf.fromPixels(frames[i], 3).toFloat()
      tframe = tframe.mean(2, true)
      tframes[i] = tframe
    }
    state = tf.stack(tframes)
    let lowRes = tf.image.cropAndResize(state, [0.2, 0.2, 1, 0.7], [0], [81, 81])
    lowRes = state.batchNorm([0], [1])
    lowRes = state.squeeze([3])
    let returns = {
      highRes: state,
      lowRes: lowRes
    }
    return returns
  }

  create_db() {
    let schema = {}
    for (let i = 1; i <= this.totalEnvs; i++) {
      schema["env" + i] = "++num,reward"
    }
    schema["trajectories"] = "++num,env,begState,endState,variance,exprew,trained"
    let db = new Dexie("RewardDatabase")
    db.version(1).stores(schema)
    return await db.open()
  }

  record_returns(id, returns) {
    return this.db.transaction('w', this.db.["env" + id], async () => {
      await this.db.["env" + id].add({
        reward: returns.reward,
        state: returns.lowResState,
        frames: returns.frames
      })
    })
  }

  create_trajectories() {
    let tables = []
    for (let i = 0; i < this.totalEnvs; i++) {
      tables.push(this.db.["env" + i])
    }
    tables.push(this.db.["trajectories"])
    return this.db.transaction('rw', tables, async () => {
      for (let j = 0; j < this.totalEnvs; j++) {
        let traj = await this.db.["env" + i]
          .where('num')
          .between(this.trainingCount * this.statesInTraj * this.totalTraj, (this.trainingCount + 1) * this.statesInTraj * this.totalTraj)
          .toArray()
        for (let k = 0; k < this.totalTraj; k++) {
          let sum = 0;
          for (let i = k * this.statesInTraj; i < (k + 1) * this.statesInTraj; i++) {
            sum += traj[i].reward
          }
          let exp = Math.exp(sum)
          let mean = sum / this.statesInTraj
          sum = 0
          for (let i = k * this.statesInTraj; i < k * this.statesInTraj + this.statesInTraj; i++) {
            sum += Math.pow(traj[i].reward - mean, 2)
          }
          let var = sum / (this.statesInTraj - 1)
          await this.db.["trajectories"].add({
            env: j,
            begState: k * this.statesInTraj,
            endState: (k + 1) * this.statesInTraj,
            variance: var,
            exprew: exp
          })
        }
      }
      this.trainingCount++
    })
  }

  get_sorted_trajs() {
    return await this.db.["trajectories"].sortBy('variance').reverse()
  }

  get db() {
    return this.db
  }

  create_gui() {
    let gui = new BrowserWindow({
      width: this.guiWidth,
      height: this.guiHeight,
      webPreferences: {
        nodeIntegration: true,
        plugins: true
      },
      show: false
    })
    gui.loadFile('human_preference.html', {query: {"data": JSON.stringify(this.data)}})

    gui.once('ready-to-show', () => {
      gui.show()
      // create database
    })

    return gui
  }

  get_reward(id, frames) {
    let state = format_state(frames)
    let reward = this.reward.predict(state.lowRes)
    let returns = {
      reward: reward.dataSync(),
      lowResState: state.lowRes,
      highResState: state.highRes.dataSync(),
      frames: frames
    }
    this.count++
    record_returns(id, returns)
    if (this.count % this.statesInTraj * this.totTraj * this.totalEnvs == 0) {
      create_trajectories()
    }
    return returns
  }

  train_model(states, rewards) {
    let trewards = []
    for (let i = 0; i < rewards.length; i++) {
      trewards.push(tf.scalar(rewards[i]))
    }
    this.reward.fit(states, trewards, {
      batchSize = 25,
      epochs = 4,
      shuffle = true
    }).then((h) => {
      console.log("Training loss: " + h.history.loss[0])
    }).then(() => {
      return this.reward.save('localstorage://updated-reward-model-1')
    }).then(() => {
      return ipc.send('update-model')
    })


  }

}
