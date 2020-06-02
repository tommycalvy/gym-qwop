import * as tf from '@tensorflow/tfjs-node'

module.exports = class HPReward {

  constructor(BrowserWindow, statesInTraj=25, totTraj=80, framesInState=4, width=81, height=81, reward_lr=0.95) {
    this.statesInTraj = statesInTraj
    this.totTraj = totTraj
    this.framesInState = framesInState;
    this.guiWidth = 1200;
    this.guiHeight = 800;
    this.reward_lr = reward_lr;
    this.count = 0;

    this.reward = this.build_reward();
    this.gui = create_gui(BrowserWindow);
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
    let tframe;
    let state;
    let tframes = [this.framesInState];
    for (let i = 0; i < this.framesInState; i++) {
      tframe = tf.fromPixels(frames[i], 3).toFloat();
      tframe = tframe.mean(2, true);
      tframes[i] = tframe;
    }
    state = tf.stack(tframes);
    state = tf.image.cropAndResize(state, [0.2, 0.2, 1, 0.7], [0], [81, 81]);
    state = state.batchNorm([0], [1]);
    state = state.squeeze([3]);
    return state;
  }

  create_gui(BrowserWindow) {
    let gui = new BrowserWindow({
      width: this.guiWidth,
      height: this.guiHeight,
      webPreferences: {
        nodeIntegration: true,
        plugins: true
      },
      show: false
    })
    gui.loadFile('human_preference.html');

    return gui;
  }

  get_reward(frames) {
    let state = format_state(frames);
    let value = this.reward.predict(state);
    let reward = {
      id: this.gui.webContents.id,
      value: value.dataSync(),
      state: state,
      frames: frames
    };
    this.count++;
    this.gui.webContents.send('data', reward);
    if (this.count % this.statesInTraj * this.totTraj == 0) {
      this.gui.webContents.send('prepare');
    }
    return reward;
  }

  predictRewardsAndVariance(states) {
    let num = states.length;
    let rewards = reward.predict(states, {batchSize: num});
    rewards = rewards.dataSync();
    //let rewardVar = math.variance(rewards);
    let rewardSum = math.exp(math.sum(rewards));
    // also calculate eponentially cumulative rewards (equation in paper)
    return [rewards, rewardSum];
  }

  generateClip(agentid, start, end) {
    let frames = (end - start) * data[agentid][0][4].length;
    let clip = [frames];
    for (let j = start; j <= end; j++) {
      for (let k = 0; k < data[agentid][j][4].length; k++) {
        clip.push(data[agentid][j][4][k].toBitmap();
      }
    }
    return clip
  }

  formatStates(agentid, start, end) {
    let frames = end - start;
    let states = [frames];
    for (let j = start; j <= end; j++) {
      states.push(data[agentid][j][1]);
    }
    return states
  }


}
