const { BrowserWindow } = require('electron')

module.exports = class GameController {

  constructor(env, ipc) {
    this.env = env
    this.totalEnvs = this.env.total_envs()
    this.envs = [this.totalEnvs]
    this.ipc = ipc
    //this.remote = create_remote()
  }

  create_remote() {
      let remote = new BrowserWindow({
        webPreferences: {
          nodeIntegration: true,
          plugins: true,
          offscreen: true
        },
        show: false
      })
      flashPlayer.loadFile('./remote/remote.html')
      return remote
  }

  reset(envs=null) {
    let action = [false, false, false, false]
    let obs = []
    if (envs == null) {
      for (let i = 0; i < this.totalEnvs; i++) {
        let webCon = this.envs[i].envWin.webContents
        webCon.reload()
        this.env.initFunc(webCon)
        let ob = this.env.step_env(webCon, action, this.envs[i].actionSet, true)
        obs.push(ob)
      }
    } else {
      for (let i = 0; i < envs.length; i++) {
        let webCon = this.envs[envs[i]].envWin.webContents
        webCon.reload()
        this.env.initFunc(webCon)
        let ob = this.env.step_env(webCon, action, this.envs[envs[i]].actionSet, true)
        obs.push(ob)
      }
    }
    return obs
  }

  create_envs() {
    for (let i = 0; i < this.totalEnvs; i++) {
      if (this.env.enableRender) {
        this.envs.push({
          actionSet: this.env.action_set(),
          envWin: this.env.create_env(),
          renderWin: this.env.create_renderer()
        })
      } else {
        this.envs.push({
          actionSet: this.env.action_set(),
          envWin: this.env.create_env(),
          renderWin: null
        })
      }
    }
  }

  step(id, action) {
    let args = [
      this.envs[id].envWin.webContents,
      action,
      this.envs[id].actionSet,
      this.envs[id].renderWin.webContents
    ]
    return this.env.step_env(args)
  }

  step_all(actions) {
    let returns = []
    let obsrew
    for (let i = 0; i < this.totalEnvs; i++) {
      obsrew = step(i, actions[i])
      returns.push(obsrew)
    }
    return returns
  }

  render(envs=null) {
    if (envs == null) {
      for (let i = 0; i < this.totalEnvs; i++) {
        if (this.envs[i].renderWin != null) {
          this.envs[i].renderWin = this.env.create_renderer()
        }
      }
    } else {
      for (let i = 0; i < envs.length; i++) {
        if (this.envs[envs[i]].renderWin != null) {
          this.envs[envs[i]].renderWin = this.env.create_renderer()
        }
      }
    }
  }

  close() {
    // save reward model maybe
    for (let i = 0; i < this.totalEnvs; i++) {
      this.envs[i].envWin.close()
      if (this.envs[i].renderWin != null) {
        this.envs[i].renderWin.close()
      }
    }
  }

}
