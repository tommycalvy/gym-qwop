const environment = require('./environment.js')

module.exports = class FlashGame {

  constructor(framesStacked) {
    this.webContents = webContents;
    this.agent = agent;
    this.framesStacked = framesStacked;
    this.frameCount = 0;
  }

  init() {

  }


  send_action(action) {
    for (let i = 0; i < 4; i++) {
      if (action[i] && !this.actionSet[i].down) {
        this.actionSet[i].down = true;
        this.webContents.sendInputEvent({ type: 'keyDown', keyCode: this.actionSet[i].key });
      } else if (!action[i] && this.actionSet[i].down) {
        this.actionSet[i].down = false;
        this.webContents.sendInputEvent({ type: 'keyUp', keyCode: this.actionSet[i].key });
      }
    }
  }

  get action_set() {
    return this.ActionSet;
  }

  init_game() {

  }

  step(inst, action) {
      let frames = []
      let i = 0
      console.log("started painting")
      inst.webContents.startPainting()

      inst.webContents.on('paint', (event, dirty, frame) => {
        console.log('frame')
        win2.webContents.send('frame-update', frame.toDataURL())
        frames.push(frame)
        i++
        if (i % 4 == 0) {
          inst.webContents.stopPainting()
          console.log("stopped painting")
          return
        }
      })
  }

  start_game() {
    let output;
    let frames = [this.framesStacked];
    setTimeout(() => {
        this.webContents.sendInputEvent({type:'mouseDown', x: 80, y: 50, button:'left', clickCount: 1})
    }, 250)
    setTimeout(() => {
        this.webContents.sendInputEvent({type:'mouseUp', x: 80, y: 50, button:'left', clickCount: 1})
        this.webContents.on('paint', (event, dirty, image) => {
          frames[this.frameCount] = image;
          this.frameCount++;
          if (this.frameCount % this.framesStacked == 0) {
            this.webContents.stopPainting(); // Need to check if it actually stops the flash game
            output = this.agent.step(frames);
            send_action(output.action);
            this.webContents.startPainting(); // May need to put this before send_action
            frameCount = 0;
          }
        })
    }, 300)
  }

}
