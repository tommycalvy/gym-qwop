const { ipcMain } = require('electron')
const FlashGame = require('./flash_game.js')
const HPReward = require('./reward/hp_reward.js')

module.exports = class QWOP extends FlashGame {

  constructor({
    totalEnvs = 1,
    framesInState = 4,
    actionSpace = 4,
    width = 640,
    height = 400,
    crops = {x: 20, y: 20, width: 600, height: 360},
    enableRender = true,
    flashGame = 'qwop.swf'
  } = {}) {

    let actionSet = function() {
      return [
        {
          down: false,
          key: 'Q'
        },
        {
          down: false,
          key: 'W'
        },
        {
          down: false,
          key: 'O'
        },
        {
          down: false,
          key: 'P'
        }
      ]
    }

    let initFunc = function(webContents) {
      return new Promise(function(resolve, reject) {
        setTimeout(() => {
            webContents.sendInputEvent({type:'mouseDown', x: width / 2, y: height / 2, button:'left', clickCount: 1})
        }, 300)
        setTimeout(() => {
            webContents.sendInputEvent({type:'mouseUp', x: width / 2, y: height / 2, button:'left', clickCount: 1})
        }, 350)
        setTimeout(() => {
            webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Space' })
            webContents.stopPainting()
            resolve()
        }, 600)
      })
    }

    let reward = new HPReward(ipcMain, totalEnvs)

    let args = [
      totalEnvs,
      framesInState,
      actionSpace,
      width,
      height,
      crops,
      enableRender,
      flashGame,
      reward,
      actionSet,
      initFunc,
      ipcMain
    ];

    super(args)
  }
/*
  static action_set() {

  }

  init(webContents) {

  }
  */
}
