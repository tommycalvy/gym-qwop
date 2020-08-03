const { BrowserWindow } = require('electron')
const GameController = require('./game_controller.js')

module.exports = class FlashGame extends GameController {

  constructor(...args) {

    //console.log(args)

    class FlashGameEnv {

      constructor(...args) {
        //console.log(args);
        [
          [
            [
              this.totalEnvs,
              this.framesInState,
              this.actionSpace,
              this.width,
              this.height,
              this.crops,
              this.enableRender,
              this.flashGame,
              this.reward,
              this.actionSet,
              this.initFunc,
              this.ipcMain
            ]
          ]
        ] = args;

        this.data = {
          "width": this.width,
          "height": this.height,
          "flashGame": this.flashGame
        }

      }

      create_env() {
        let flashPlayer = new BrowserWindow({
          width: this.width,
          height: this.height,
          webPreferences: {
            nodeIntegration: true,
            plugins: true,
            offscreen: true
          },
          show: false
        })
        flashPlayer.loadFile('./remote/flash_player_env/flash_player.html', {
          query: {
            "data": JSON.stringify(this.data)
          }
        })

        flashPlayer.once('ready-to-show', () => {
          this.initFunc(flashPlayer.webContents)
        })
        return flashPlayer
      }

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

      get total_envs() {
        return this.totalEnvs
      }

      action_set() {
        return this.actionSet()
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

      send_action(envWebContents, action, actionSet) {
        console.log('Inside send_action')
        let actionSpace = this.actionSpace
        return new Promise((resolve, reject) => {
          for (let i = 0; i < actionSpace; i++) {
            if (action[i] && !actionSet[i].down) {
              actionSet[i].down = true
              envWebContents.sendInputEvent({ type: 'keyDown', keyCode: actionSet[i].key })
            } else if (!action[i] && actionSet[i].down) {
              actionSet[i].down = false
              envWebContents.sendInputEvent({ type: 'keyUp', keyCode: actionSet[i].key })
            }
          }
          resolve()
        })
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
              //Maybe you need to remove the listener somehow
              envWebContents.stopPainting()
              console.log('stopped painting')
              Promise.all(state).then(state => resolve(state))
            }
          })
        })
      }

      step_env(envWebContents, action, actionSet, renderWebContents=null, reset=false) {
        console.log('Inside step_env')
        const $this = this
        console.log('this fucked up')
        return new Promise((resolve, reject) => {
          let png
          console.log('Inside promise of step_env')
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

    }

    let flashGameEnv = new FlashGameEnv(args)
    //console.log(flashGameEnv)
    super(flashGameEnv)
  }

}
