const { BrowserWindow, ipcMain} = require('electron')
const GameController = require('./game_controller.js')
const HPReward = require('./reward/hp_reward.js')

module.exports = class FlashGame extends GameController {

  constructor(...args) {

    console.log(args)

    class FlashGameEnv {

      constructor(...args) {
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
          this.initFunc
        ] = args;

        this.data = {
          "width": this.width,
          "height": this.height,
          "flashGame": this.flashGame
        }

        if (this.reward == null) {
          this.reward = new HPReward(ipcMain, this.totalEnvs, true)
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
        flashPlayer.loadFile('./flash_player_envs/flash_player.html', {
          query: {
            "data": JSON.stringify(this.data)
          }
        })

        win.once('ready-to-show', () => {
          this.initFunc(flashPlayer)
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
        renderer.loadFile('./flash_player_envs/renderer.html', {
          query: {
            "data": JSON.stringify({"width": width, "height": height})
          }
        })
        return renderer
      }

      total_envs() {
        return this.totalEnvs
      }

      action_set() {
        return this.actionSet()
      }

      send_action(envWebContents, action, actionSet) {
        for (let i = 0; i < this.actionSpace; i++) {
          if (action[i] && !actionSet[i].down) {
            actionSet[i].down = true
            envWebContents.sendInputEvent({ type: 'keyDown', keyCode: actionSet[i].key })
          } else if (!action[i] && actionSet[i].down) {
            actionSet[i].down = false
            envWebContents.sendInputEvent({ type: 'keyUp', keyCode: actionSet[i].key })
          }
        }
      }

      step_env(envWebContents, action, actionSet, renderWebContents=null, reset=false) {
          let state = []
          let i = 0
          let observation = {}
          let returns
          console.log("started painting")
          send_action(envWebContents, action, actionSet)
          envWebContents.startPainting()
          envWebContents.on('paint', (event, this.crops, frame) => {
            console.log('frame')
            if (renderWebContents != null && !renderWebContents.isDestroyed()) {
              renderWebContents.send('frame', frame.toDataURL())
            }
            state.push(frame.toBitmap())
            i++
            if (i % this.framesInState == 0) {
              envWebContents.stopPainting()
              console.log("stopped painting")
              if (reset) {
                returns = this.reward.format_state(state)
                return returns.highRes
              } else {
                returns = this.reward.get_reward(id, state)
                observation['reward'] = returns.reward
                observation['state'] = returns.highResState
                return observation
              }
            }
          })
      }
    }

    let flashGameEnv = new FlashGameEnv(args)

    super(flashGameEnv, ipcMain)
  }

}
