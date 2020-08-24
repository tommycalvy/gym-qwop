module.exports = class QWOP {

    static action_set() {
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

    static init_func(webContents, width, height) {
      return new Promise(function(resolve, reject) {
        setTimeout(() => {
            webContents.sendInputEvent({type:'mouseDown', x: width / 2, y: height / 2, button:'left', clickCount: 1})
        }, 3000)
        setTimeout(() => {
            webContents.sendInputEvent({type:'mouseUp', x: width / 2, y: height / 2, button:'left', clickCount: 1})
        }, 3500)
        setTimeout(() => {
            webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Space' })
            console.log('environment initialized')
            resolve()
        }, 4000)
      })
    }

}
