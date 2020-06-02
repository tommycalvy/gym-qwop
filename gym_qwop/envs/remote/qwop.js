const FlashGame = require('./flash_game.js')

module.exports = class QWOP extends FlashGame {

  constructor(args = {
      totalEnvs: 1,
      framesInState: 4,
      actionSpace: 4,
      width: 640,
      height: 400,
      flashGame: 'qwop.swf',
      reward: null
    }) {

      let actionSet = function() {
        return [
          {
            down: false,
            key: "Q"
          },
          {
            down: false,
            key: "W"
          },
          {
            down: false,
            key: "O"
          },
          {
            down: false,
            key: "P"
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
            webContents.stopPainting()
        }, 400)
      }

    super(actionSet, initFunc, args)
  }
/*
  static action_set() {

  }

  init(webContents) {

  }
  */
}
