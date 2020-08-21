const { BrowserWindow } = require('electron')
const tf = require('@tensorflow/tfjs-node')
const Dexie = require('dexie')

module.exports = class HPReward {

  constructor(ipcRenderer, totalAgents, remoteId, statesInTraj=25, totTraj=5) {
    super(-1);
    this.ipcRenderer = ipcRenderer;
    this.totalAgents = totalAgents;
    this.remoteId = remoteId;
    this.statesInTraj = statesInTraj;
    this.totTraj = totTraj;
    this.count = 0;
    this.trainingCount = 0;
    this.db = this.create_db();
    this.model = this.build_model();
    Dexie.debug = true;
    console.log('HPReward');
  }

  build_model() {
    const model = tf.sequential();
    // Input is 81x81x4
    // 144 weights
    model.add(tf.layers.conv2d({
      inputShape: [this.width, this.height, this.framesInState],
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

  create_db() {
    console.log('creating db')
    let schema = {}
    for (let i = 1; i <= this.totalEnvs; i++) {
      schema["agent" + i] = "++num,reward"
    }
    schema["trajectories"] = "++num,agent,begState,endState,variance,exprew,trained"
    let db = new Dexie("RewardDatabase")
    db.version(1).stores(schema)
    console.log('created db')
    return db.open()
  }

  count_states() {
    $this = this;
    return new Promise((resolve, reject) => {
      let promises = [];
      for (let i = 0; i < $this.totalAgents; i++) {
        let promise = new Promise((resolve, reject) => {
          resolve(this.db["agent" + i].count())
        })
        promises.push(promise)
      }
      Promises.all(promises).then(counts => {
        resolve(counts.reduce((x, y) => x + y))
      })
    })
  }

  create_trajectories() {
    console.log('Inside create_trajectories')
    let tables = []
    for (let i = 0; i < this.totalAgents; i++) {
      tables.push(this.db["agent" + i])
    }
    tables.push(this.db["trajectories"])
    return this.db.transaction('rw', tables, async () => {
      for (let j = 0; j < this.totalAgents; j++) {
        let traj = await this.db["agent" + i]
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

  count_trajectories() {
    return this.db["trajectories"].count()
  }

  get_sorted_trajs() {
    return this.db["trajectories"].sortBy('variance').reverse()
  }

  get_states(traj) {
    return this.db["env" + traj.agent]
      .where('num')
      .between(traj.begState, traj.endState)
      .toArray()
  }

  delete_traj(traj) {
    this.db.transaction('rw', this.db["agent" + traj.agent], this.db["trajectories"], () => {
      this.db["agent" + traj.agent]
        .query('num')
        .between(traj.begState, traj.endState)
        .delete()
      this.db["trajectory"]
        .query('num')
        .anyOf(traj.num)
        .delete()
    }).then(() => {
      console.log('Deleted Trajectories')
    }).catch(err => {
      console.log(err.stack)
    })
  }

  train_model(states, rewards) {
    return new Promise(function(resolve, reject) {
      let trewards = []
      for (let i = 0; i < rewards.length; i++) {
        trewards.push(tf.scalar(rewards[i]))
      }
      this.model.fit(states, trewards, {
        batchSize: 25,
        epochs: 4,
        shuffle: true
      }).then((h) => {
        console.log("Training loss: " + h.history.loss[0])
      }).then(() => {
        return this.model.save('localstorage://updated-reward-model-1')
      }).then(() => {
        return this.ipcRenderer.sendTo(this.remoteId, 'update-model')
      }).then(() => {
        resolve()
      })
    })
  }

}
