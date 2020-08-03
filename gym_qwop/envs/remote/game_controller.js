const { BrowserWindow } = require('electron')

module.exports = class GameController {

  constructor(env) {
    this.env = env
    console.log('Total Environments: ' + this.env.totalEnvs)
    this.envs = []
    //this.ipc = ipc
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
    let env = this.env
    let envList = this.envs
    return new Promise(function(resolve, reject) {
      let action = [false, false, false, false]
      let promises = []
      if (envs == null) {
        for (let i = 0; i < env.totalEnvs; i++) {
          let promise = new Promise((resolve, reject) => {
            let webCon = envList[i].envWin.webContents
            webCon.reload()
            env.initFunc(webCon).then(() => {
              let actionSet = envList[i].actionSet
              let renderCon = envList[i].renderWin.webContents
              return env.step_env(webCon, action, actionSet, renderCon, true)
            }).then(obs => {
              console.log(obs)
              return obs.tensor.dataSync()
            }).then(obs => {
              resolve(obs)
            })
          })
          promises.push(promise)
        }
      } else {
        for (let i = 0; i < envs.length; i++) {
          let promise = new Promise((resolve, reject) => {
            let webCon = envList[envs[i]].envWin.webContents
            webCon.reload()
            env.initFunc(webCon).then(() => {
              let actionSet = envList[envs[i]].actionSet
              let renderCon = envList[envs[i]].renderWin.webContents
              return env.step_env(webCon, action, actionSet, renderCon, true)
            }).then(obs => {
              return obs.tensor.dataSync()
            }).then(obs => {
              resolve(obs)
            })
          })
          promises.push(promise)
        }
      }
      Promise.all(promises).then(obs => {
        console.log('reset function ending')
        console.log(obs)
        resolve(obs)
      })
    })
  }

  init_envs() {
    this.envs = this.env.init_envs()
  }

  step(id, action) {
    let observation
    let args = [
      this.envs[id].envWin.webContents,
      action,
      this.envs[id].actionSet,
      this.envs[id].renderWin.webContents
    ]
    this.env.step_env(args).then(obs => {
      observation = obs.tensor.dataSync()
      return this.env.get_reward(id, obs)
    }).then(reward => {
      return {observation: observation, reward: reward}
    })
  }

  step_all(actions) {
    let env = this.env
    return new Promise((resolve, reject) => {
      let promises = []
      for (let i = 0; i < env.totalEnvs; i++) {
        let promise = new Promise((resolve, reject) => {
          let obsrew = step(i, actions[i])
          resolve(obsrew)
        })
        promises.push(promise)
      }
      Promise.all(promises).then(obsrews => resolve(obsrews))
    })
  }

  render(envs=null) {
    if (envs == null) {
      for (let i = 0; i < this.env.totalEnvs; i++) {
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
    for (let i = 0; i < this.env.totalEnvs; i++) {
      if (this.envs[i].envWin != null) {
        this.envs[i].envWin.close()
        if (this.envs[i].renderWin != null) {
          this.envs[i].renderWin.close()
        }
      }
    }
  }

}
