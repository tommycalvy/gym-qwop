const FlashGame = require('./flash_game.js')

module.exports = class QWOP extends FlashGame {

  constructor({
    totalEnvs: 1,
    framesInState: 4,
    actionSpace: 4,
    width: 640,
    height: 400,
    crops: [20, 20, 20, 20],
    enableRender: true,
    flashGame: 'qwop.swf',
    reward: null
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
      setTimeout(() => {
          webContents.sendInputEvent({type:'mouseDown', x: width / 2, y: height / 2, button:'left', clickCount: 1})
      }, 300)
      setTimeout(() => {
          webContents.sendInputEvent({type:'mouseUp', x: width / 2, y: height / 2, button:'left', clickCount: 1})
      }, 350)
      setTimeout(() => {
          webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Space' })
          webContents.stopPainting()
      }, 400)
    }

    

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
      initFunc
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
