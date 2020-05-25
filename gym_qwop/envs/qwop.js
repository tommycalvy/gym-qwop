const FlashGame = require('./flash_game.js')

module.exports = class QWOP extends FlashGame {

  constructor(webContents, frames_in_state, width, height) {
    this.webContents = webContents

  }

  static flash_player() {
    return 'qwop.swf'
  }

  static action_set() {
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

  init(webContents) {
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

}
