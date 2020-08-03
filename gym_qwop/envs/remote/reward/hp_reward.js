const { BrowserWindow } = require('electron')
const tf = require('@tensorflow/tfjs-node')
const Dexie = require('dexie')

module.exports = class HPReward {

  constructor(ipc, totalEnvs, statesInTraj=25, totTraj=5, framesInState=4, width=81, height=81, reward_lr=0.95) {
    this.totalEnvs = totalEnvs
    this.statesInTraj = statesInTraj
    this.totTraj = totTraj
    this.framesInState = framesInState;
    this.inputWidth = width;
    this.inputHeight = height;
    this.guiWidth = 1200;
    this.guiHeight = 800;
    this.reward_lr = reward_lr
    this.count = 0
    this.trainingCount = 0
    this.reward = this.build_reward()
    this.db = this.create_db()
    this.data = {"totalEnvs": totalEnvs}
    Dexie.debug = true
    ipc.on('update-model', (even, args) => {
      this.reward = tf.loadLayersModel('localstorage://updated-reward-model-1')
    })
    console.log('HPReward')
  }

  build_reward() {
    const model = tf.sequential();
    // Input is 81x81x4
    // 144 weights
    model.add(tf.layers.conv2d({
      inputShape: [this.inputWidth, this.inputHeight, this.framesInState],
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
    //model.summary();

    model.compile({
      optimizer: tf.train.adam(this.reward_lr),
      loss: tf.losses.softmaxCrossEntropy
    });
    return model;
  }

  format_state(frames) {
    console.log('Inside format_state')
    let framesInState = this.framesInState
    return new Promise((resolve, reject) => {
      let tframes = []
      for (let i = 0; i < framesInState; i++) {
        let promise = new Promise((resolve, reject) => {
          let tframe = tf.node.decodePng(frames[i], 3)
          //console.log(tframe)
          tframe = tframe.mean(2, true)
          //console.log(tframe)
          resolve(tframe)
        })
        tframes.push(promise)
      }
      Promise.all(tframes).then(state => {
        return tf.stack(state)
      }).then(state => {
        console.log(state)
        return tf.image.resizeBilinear(state, [81, 81])
      }).then(state => {
        console.log(state)
        return state.squeeze([3])
      }).then(state => {
        console.log(state)
        resolve(state)
      })
    })
  }

  create_db() {
    console.log('creating db')
    let schema = {}
    for (let i = 1; i <= this.totalEnvs; i++) {
      schema["env" + i] = "++num,reward"
    }
    schema["trajectories"] = "++num,env,begState,endState,variance,exprew,trained"
    let db = new Dexie("RewardDatabase")
    db.version(1).stores(schema)
    console.log('created db')
    return db.open()
  }

  record_returns(id, returns) {
    console.log('Inside record_returns')
    return this.db.transaction('w', this.db["env" + id], async () => {
      await this.db["env" + id].add({
        reward: returns.reward,
        tensor: returns.tensor,
        png: returns.png
      })
    }).then(() => {
      console.log('Recorded Returns')
    }).catch(err => {
      console.error(err.stack)
    })
  }

  create_trajectories() {
    console.log('Inside create_trajectories')
    let tables = []
    for (let i = 0; i < this.totalEnvs; i++) {
      tables.push(this.db["env" + i])
    }
    tables.push(this.db["trajectories"])
    return this.db.transaction('rw', tables, async () => {
      for (let j = 0; j < this.totalEnvs; j++) {
        let traj = await this.db["env" + i]
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
          let variance = sum / (this.statesInTraj - 1)
          await this.db["trajectories"].add({
            env: j,
            begState: k * this.statesInTraj,
            endState: (k + 1) * this.statesInTraj,
            variance: variance,
            exprew: exp
          })
        }
      }
      this.trainingCount++
    }).then(() => {
      console.log('Created Trajectories')
    }).catch(err => {
      console.log(err.stack)
    })
  }

  get_sorted_trajs() {
    return this.db["trajectories"].sortBy('variance').reverse()
  }

  get hpdb() {
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
    gui.loadFile('./remote/reward/human_preference.html', {query: {"data": JSON.stringify(this.data)}})

    gui.once('ready-to-show', () => {
      gui.show()
      // create database
    })

    return gui
  }

  get_reward(id, obs) {
    this.count++
    let $this = this
    return new Promise((resolve, reject) => {
      let reward = $this.reward.predict(obs.tensor).dataSync()
      let returns = {
        reward: reward,
        tensor: obs.tensor.dataSync(),
        png: obs.png
      }
      $this.record_returns(id, returns)
      if ($this.count % $this.statesInTraj * $this.totTraj * $this.totalEnvs == 0) {
        $this.create_trajectories()
      }
      resolve(reward)
    })
  }

  train_model(states, rewards) {
    return new Promise(function(resolve, reject) {
      let trewards = []
      for (let i = 0; i < rewards.length; i++) {
        trewards.push(tf.scalar(rewards[i]))
      }
      this.reward.fit(states, trewards, {
        batchSize: 25,
        epochs: 4,
        shuffle: true
      }).then((h) => {
        console.log("Training loss: " + h.history.loss[0])
      }).then(() => {
        return this.reward.save('localstorage://updated-reward-model-1')
      }).then(() => {
        return ipc.send('update-model')
      }).then(() => {
        resolve()
      })
    })
  }

}