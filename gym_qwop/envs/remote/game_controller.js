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
        let webCon = this.envs[i].envWebContents
        webCon.reload()
        this.env.initFunc(webCon)
        let ob = this.env.step_env(webCon, action, this.envs[i].actionSet, true)
        obs.push(ob)
      }
    } else {
      for (let i = 0; i < envs.length; i++) {
        let webCon = this.envs[envs[i]].envWebContents
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
          envWebContents: this.env.create_env(),
          renderWebContents: this.env.create_renderer()
        })
      } else {
        this.envs.push({
          actionSet: this.env.action_set(),
          envWebContents: this.env.create_env(),
          renderWebContents: null
        })
      }
    }
  }

  step(id, action) {
    // TODO: check what the format of the action variable is
    let args = [
      this.envs[id].envWebContents,
      action,
      this.envs[id].actionSet,
      this.envs[id].renderWebContents
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
        if (this.envs[i].renderWebContents != null) {
          this.envs[i].renderWebContents = this.env.create_renderer()
        }
      }
    } else {
      for (let i = 0; i < envs.length; i++) {
        if (this.envs[envs[i]].renderWebContents != null) {
          this.envs[envs[i]].renderWebContents = this.env.create_renderer()
        }
      }
    }
  }

}
