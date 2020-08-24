const tf = require('@tensorflow/tfjs-node')
const Dexie = require('dexie')

module.exports = class AgentReward {

  constructor(id, reward_lr=0.95, width=81, height=81, framesInState=4) {
    this.id = id;
    this.reward_lr = reward_lr;
    this.width = width;
    this.height = height;
    this.framesInState = framesInState;
    this.model = this.build_model();
    this.db = this.open_db();
    Dexie.debug = true;
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

  format_frame(frame) {
    return new Promise((resolve, reject) => {
      new Promise((resolve, reject) => {
        resolve(tf.node.decodePng(frame))
      }).then(tframe => {
        //console.log(tframe)
        //console.log(tframe.dataSync())
        return tframe.mean(2, true)
      }).then(tframe => {
        //console.log(tframe)
        //console.log(tframe.dataSync())
        return tf.image.resizeBilinear(tframe, [81, 81])
      }).then(tframe => {
        //console.log(tframe)
        //console.log(tframe.dataSync())
        return tframe.div(255).mul(2).sub(1)
      }).then(tframe => {
        //console.log(tframe)
        //console.log(tframe.dataSync())
        resolve(tframe)
      })
    })
  }

  stack_tensor(tensor) {
    return new Promise((resolve, reject) => {
      let obs = {
        sync: null,
        tensor: null
      }
      new Promise((resolve, reject) => {
        resolve(tf.stack(tensor, 3));
      }).then(tframes => {
        //console.log(tframes);
        //console.log(tframes.dataSync());
        return tframes.squeeze(2)
      }).then(tframes => {
        obs.tensor = tframes;
        return tframes.dataSync();
      }).then(tframes => {
        obs.sync = tframes
        //console.log(tframes);
        resolve(obs);
      })
    })
  }

  open_db() {
    return new Dexie('RewardDatabase').open()
  }

  record_obs(obs) {
    console.log('Inside record_returns')
    return this.db.transaction('w', this.db["agent" + this.id], async () => {
      await this.db["agent" + this.id].add({
        reward: obs.reward,
        tensor: obs.tensor,
        png: obs.png
      })
    }).then(() => {
      console.log('Recorded Returns')
    }).catch(err => {
      console.error(err.stack)
    })
  }

  get_reward(obsSync, tensor, png) {
    let $this = this
    return new Promise((resolve, reject) => {
      new Promise((resolve, reject) => {
        return $this.model.predict(tensor).dataSync()
      }).then(reward => {
        $this.record_returns({reward: reward, tensor: obsSync, png: png})
        resolve(reward)
      })
    })
  }

}
