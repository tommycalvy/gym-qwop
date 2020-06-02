const { BrowserWindow } = require('electron')
const GameController = require('./game_controller.js')

module.exports = class FlashGame extends GameController {

  constructor(...args) {
    let actionSet, initFunc, totalEnvs, framesInState;
    let actionSpace, width, height, flashGame, reward;
    [
      actionSet,
      initFunc,
      {
        totalEnvs,
        framesInState,
        actionSpace,
        width,
        height,
        flashGame,
        reward
      }
    ] = args;
    console.log(args)

    if (reward == null) {
      reward = new HPReward(BrowserWindow)
    }

    class FlashGameEnv {

      constructor(width, height, flashGame, actionSpace, framesInState, reward, totalEnvs, actionSet, initFunc) {
        this.width = width
        this.height = height
        this.flashGame = flashGame
        this.actionSpace = actionSpace
        this.framesInState = framesInState
        this.reward = reward
        this.totalEnvs = totalEnvs
        this.actionSet = actionSet
        this.initFunc = initFunc
        this.data = {"width": width, "height": height, "flashGame": flashGame}
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
        flashPlayer.loadFile('./envs/flash_player_envs/flash_player.html', {query: {"data": JSON.stringify(this.data)}})

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
        renderer.loadFile('./envs/flash_player_envs/renderer.html', {
          query: {
            "data": JSON.stringify({"width": width, "height": width})
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

      step_env(envWebContents, action, actionSet, renderWebContents=null) {
          let state = []
          let i = 0
          let reward = 0
          console.log("started painting")
          send_action(envWebContents, action, actionSet)
          envWebContents.startPainting()
          envWebContents.on('paint', (event, dirty, frame) => {
            console.log('frame')
            if (renderWebContents != null) {
              renderWebContents.send('frame', frame.toDataURL())
            }
            state.push(frame.toBitmap())
            i++
            if (i % this.framesInState == 0) {
              envWebContents.stopPainting()
              console.log("stopped painting")
              reward = this.reward.get_reward(state)
              // TODO: Save reward and state in index db
              // webContents.id, reward, and state
              // Probably not how to return two variables \/ \/
              return state, reward
            }
          })
      }
    }

    let flashGameEnv = new FlashGameEnv(width, height, flashGame, actionSpace, framesInState, reward, totalEnvs, actionSet, initFunc)

    super(flashGameEnv)
  }

}
