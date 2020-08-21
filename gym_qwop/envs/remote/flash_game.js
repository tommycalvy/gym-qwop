const EventEmitter = require('events');

module.exports = class FlashGame {

  constructor(remote, ipcRenderer, qwop, reward) {
    //console.log(args);
    this.args = remote.getGlobal('args');
    this.totalAgents = this.args.totalAgents;
    this.framesInState = this.args.framesInState;
    this.actionSpace = this.args.actionSpace;
    this.width = this.args.width;
    this.height = this.args.height;
    this.crops = this.args.crops;
    this.enableRender = this.args.enableRender;
    this.flashGame = this.args.flashGame;
    this.BrowserWindow = remote.BrowserWindow;
    this.ipcRenderer = ipcRenderer;
    this.init_func = qwop.init_func;
    this.action_set = qwop.action_set;
    this.reward = reward;

    this.data = {
      "width": this.width,
      "height": this.height,
      "flashGame": this.flashGame
    };
    this.png = [];
    this.tensor = [];

    this.actionSet = qwop.action_set();
    this.observing = false;
    this.frameSkip = 4;
    this.count = 0;
    this.emitter = new EventEmitter();
  }

  create_env() {
    let $this = this
    return new Promise((resolve, reject) => {
      let flashGame = new $this.BrowserWindow({
        width: $this.width,
        height: $this.height,
        webPreferences: {
          nodeIntegration: true,
          plugins: true,
          offscreen: true
        },
        show: false
      });
      flashGame.loadFile('./remote/flash_player_env/flash_player.html', {
        query: {
          "data": JSON.stringify($this.data)
        }
      });
      flashGame.once('ready-to-show', () => {
        console.log('environment ready-to-show')
        resolve(flashGame)
      });
    })
  }

  create_renderer() {
    let $this = this
    return new Promise((resolve, reject) => {
      let renderer = new $this.BrowserWindow({
        width: $this.width,
        height: $this.height,
        webPreferences: {
          nodeIntegration: true,
          plugins: true
        },
        show: false
      });
      renderer.loadFile('./remote/flash_player_env/renderer.html', {
        query: {
          "data": JSON.stringify($this.data)
        }
      });
      renderer.once('ready-to-show', () => {
        console.log('renderer ready-to-show')
        renderer.show()
        resolve(renderer)
      });
    })
  }

  painting() {
    console.log('inside painting')
    this.webCon.on('paint', (event, dirty, frame) => {
      console.log('frame')
      if (this.enableRender) {
        this.ipcRenderer.sendTo(this.renderer.webContents.id, 'frame', frame.toDataURL())
      }
      if (this.observing && this.count % this.frameSkip) {
        new Promise((resolve, reject) => {
          resolve(frame.crop(this.crops).toPNG())
        }).then(png => {
          this.png.push(png)
          return this.reward.format_frame(png)
        }).then(tframe => {
          this.tensor.push(tframe)
        }).then(() => {
          if (this.count == this.framesInState) {
            this.emitter.emit('observed')
          }
        })
      }
      this.count++
    })
  }

  init() {
    let $this = this
    return new Promise((resolve, reject) => {
      console.log('inside init')
      this.create_env().then(env => {
        this.env = env
        this.webCon = this.env.webContents
        console.log('environment created')
        if (this.enableRender) {
          this.create_renderer().then(renderer => {
            console.log('renderer created')
            this.renderer = renderer
            this.painting()
          })
        } else {
          this.painting()
        }
        resolve('ready')
      })
    })
  }

  send_action(action) {
    console.log('Inside send_action')
    console.log(action)
    let $this = this
    return new Promise((resolve, reject) => {
      for (let i = 0; i < $this.actionSpace; i++) {
        if (action[i] == 1 && !$this.actionSet[i].down) {
          $this.actionSet[i].down = true
          $this.webCon.sendInputEvent({ type: 'keyDown', keyCode: $this.actionSet[i].key })
        } else if (action[i] == 0 && $this.actionSet[i].down) {
          $this.actionSet[i].down = false
          $this.webCon.sendInputEvent({ type: 'keyUp', keyCode: $this.actionSet[i].key })
        }
      }
      resolve()
    })
  }

  reset() {
    let $this = this
    return new Promise((resolve, reject) => {
      $this.png = []
      $this.tensor = []
      let action = [0, 0, 0, 0]
      $this.webCon.reload()
      $this.init_func($this.webCon, $this.width, $this.height).then(() => {
        return $this.send_action(action)
      }).then(() => {
        $this.count = 0
        $this.observing = true
        $this.emitter.on('observed', () => {
          $this.observing = false
          resolve($this.reward.stack_frames($this.tensor.slice(0, $this.framesInState)))
        })
      })
    })
  }

  step(action) {
    let $this = this
    return new Promise((resolve, reject) => {
      $this.png = []
      $this.tensor = []
      let observation
      $this.send_action(action).then(() => {
        $this.count = 0
        $this.observing = true
        $this.emitter.on('observed', () => {
          $this.observing = false
          let tensor = $this.tensor.slice(0, $this.framesInState)
          $this.reward.stack_tensor(tensor).then(obs => {
            observation = obs
            return $this.reward.get_reward(obs)
          }).then(reward => {
            resolve({observation: observation, reward: reward})
          })
        })
      })
    })
  }

  render() {
    this.enableRender = true
    this.env.show()
  }

  close() {
    this.env.close()
  }

  /*
  create_renderer(width=this.width, height=this.height) {
    let renderer = new BrowserWindow({
      width: width,
      height: height,
      useContentSize: true,
      webPreferences: {
        nodeIntegration: true,
        plugins: true,
      },
      show: true
    })
    renderer.loadFile('./remote/flash_player_env/render.html', {
      query: {
        "data": JSON.stringify({"width": width, "height": height})
      }
    })
    return renderer
  }

  init_envs() {
    console.log('Creating Environments')
    let envs = []
    for (let i = 0; i < this.totalEnvs; i++) {
      if (this.enableRender) {
        envs.push({
          actionSet: this.action_set(),
          envWin: this.create_env(),
          renderWin: this.create_renderer()
        })
      } else {
        envs.push({
          actionSet: this.action_set(),
          envWin: this.create_env(),
          renderWin: null
        })
      }
    }
    this.reward.create_gui()
    return envs
  }




  next_state(envWebContents, framesInState, renderWebContents=null) {
    console.log('Inside next_state')
    let crops = this.crops
    return new Promise((resolve, reject) => {
      let state = []
      let i = 0
      envWebContents.startPainting()
      console.log('started painting')
      envWebContents.on('paint', (event, dirty, frame) => {
        console.log('frame')
        if (renderWebContents != null) {
          renderWebContents.send('frame', frame.toDataURL())
        }
        let promise = new Promise((resolve, reject) => {
          let png = frame.crop(crops).toPNG()
          resolve(png)
        })
        state.push(promise)
        i++
        if (i >= framesInState) {
          envWebContents.removeAllListeners('paint')
          envWebContents.stopPainting()
          console.log('stopped painting')
          Promise.all(state).then(state => resolve(state))
        }
      })
    })
  }

  step_envB(envWebContents, action, actionSet, renderWebContents=null, reset=false) {
    const $this = this
    return new Promise((resolve, reject) => {
      let png
      this.send_action(envWebContents, action, actionSet).then(() => {
        return this.next_state(envWebContents, this.framesInState, renderWebContents)
      }).then(state => {
        console.log('state!!')
        console.log(state)
        png = state
        return this.reward.format_state(state)
      }).then(tensor => {
        let obs = {
          png: png,
          tensor: tensor
        }
        resolve(obs)
      })
    })
  }



  step_envA(id, envWebContents, action, actionSet) {
    return new Promise((resolve, reject) => {
      send_action(envWebContents, action, actionSet).then(() => {
        this.ipcMain.once('state', (event, args) => {

        })
      })
    })
  }

  */

}
