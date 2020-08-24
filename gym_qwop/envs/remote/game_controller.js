
module.exports = class GameController {

  constructor(remote, ipcRenderer, remoteId, guiWidth=1200, guiHeight=800) {
    this.totalAgents = remote.getGlobal('args').totalAgents;
    this.remoteId = remote.getCurrentWebContents().id;
    this.BrowserWindow = remote.BrowserWindow
    this.ipcRenderer = ipcRenderer;
    this.guiWidth = guiWidth;
    this.guiHeight = guiHeight;
    this.reward = null;
    this.agents = null;
    //this.ipc = ipc
    //this.remote = create_remote()

  }

  create_agent(id) {
    let $this = this
    let data = {
      id: id,
      remoteId: this.remoteId
    }
    return new Promise((resolve, reject) => {
      console.log('inside create_agent')
      let agent = new $this.BrowserWindow({
        width: $this.width,
        height: $this.height,
        webPreferences: {
          nodeIntegration: true,
          plugins: true,
          offscreen: true,

        },
        show: false
      });
      agent.loadFile('./remote/agent.html', {
        query: {
          "data": JSON.stringify(data)
        }
      });
      agent.once('ready-to-show', () => {
        agent.show()
        agent.openDevTools()
        console.log('agent is ready-to-show')
        resolve(agent)
      });
    })
  }

  create_agents() {
    let $this = this
    return new Promise((resolve, reject) => {
      let agentsp = [];
      for (let i = 0; i < this.totalAgents; i++) {
        let promise = new Promise((resolve, reject) => {
          resolve(this.create_agent(i));
        })
        agentsp.push(promise);
      }
      Promise.all(agentsp).then(agents => {
        console.log('all agents are ready')
        resolve(agents)
      })
    })
  }

  init_agents() {
    let $this = this
    return new Promise((resolve, reject) => {
      let promises = [];
      for (let i = 0; i < this.totalAgents; i++) {
        let promise = new Promise((resolve, reject) => {
          $this.agents[i].webContents.send('init');
          console.log('init sent')
          $this.ipcRenderer.once('init', (event, status) => {
            console.log('status recieved')
            resolve(status)
          })
        })
        promises.push(promise);
      }
      Promise.all(promises).then(statuses => {
        console.log('agents initialized')
        resolve(statuses)
      })
    })
  }

  create_reward() {
    let $this = this
    let data = {
      remoteId: this.remoteId
    }
    return new Promise((resolve, reject) => {
      console.log('inside create_reward')
      let reward = new $this.BrowserWindow({
        width: $this.guiWidth,
        height: $this.guiHeight,
        webPreferences: {
          nodeIntegration: true,
          plugins: true
        },
        show: false
      })
      reward.loadFile('./remote/reward/human_preference.html', {
        query: {
          "data": JSON.stringify(data)
        }
      });
      reward.once('ready-to-show', () => {
        reward.show();
        reward.openDevTools();
        resolve(reward);
      })
    })
  }

  init() {
    let $this = this
    return new Promise((resolve, reject) => {
      console.log('inside init')
      $this.create_reward().then(reward => {
        $this.reward = reward;
        return $this.create_agents();
      }).then(agents => {
        $this.agents = agents
        return $this.init_agents()
      }).then(statuses => {
        resolve(statuses)
      })
    })
  }



  reset(agents=null) {
    let $this = this
    return new Promise((resolve, reject) => {
      let promises = []
      if (agents == null) {
        for (let i = 0; i < $this.totalAgents; i++) {
          let promise = new Promise((resolve, reject) => {
            $this.agents[i].webContents.send('reset')
            $this.ipcRenderer.once('obs' + i, (event, obs) => {
              resolve(obs)
            })
          })
          promises.push(promise);
        }
      } else {
        for (let i = 0; i < agents.length; i++) {
          let promise = new Promise((resolve, reject) => {
            $this.agents[agents[i]].webContents.send('reset')
            $this.ipcRenderer.once('obs' + agents[i], (event, obs) => {
              resolve(obs)
            })
          })
          promises.push(promise);
        }
      }
      Promise.all(promises).then(obs => {
        resolve(obs)
      })
    })
  }

  step(actions, agents=null) {
    let $this = this
    return new Promise((resolve, reject) => {
      let promises = []
      if (agents == null) {
        for (let i = 0; i < $this.totalAgents; i++) {
          let promise = new Promise((resolve, reject) => {
            $this.agents[i].webContents.send('step', actions[i])
            $this.ipcRenderer.once('obs' + i, (event, obs) => {
              resolve(obs)
            })
          })
          promises.push(promise);
        }
      } else {
        for (let i = 0; i < agents.length; i++) {
          let promise = new Promise((resolve, reject) => {
            $this.agents[agents[i]].webContents.send('step', actions[i])
            $this.ipcRenderer.once('obs' + agents[i], (event, obs) => {
              resolve(obs)
            })
          })
          promises.push(promise);
        }
      }
      Promise.all(promises).then(obs => {
        resolve(obs)
      })
    })
  }

  update_model() {
    for (let i = 0; i < this.totalAgents; i++) {
      this.agents[i].webContents.send('update-model')
    }
  }

  render(agents=null) {
    if (agents == null) {
      for (let i = 0; i < this.totalAgents; i++) {
        this.agents[i].webContents.send('render')
      }
    } else {
      for (let i = 0; i < agents.length; i++) {
        this.agents[agents[i]].webContents.send('render')
      }
    }
  }

  close() {
    for (let i = 0; i < this.totalAgents; i++) {
      if (this.agents[i] != null) {
        this.agents[i].webContents.send('close')
      }
    }
    this.reward.close()
  }

  /*

  resetA(envs=null) {
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

  resetB(envs=null) {
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
              return env.step_envB(webCon, action, actionSet, renderCon, true)
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
              return env.step_envB(webCon, action, actionSet, renderCon, true)
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
    console.log('Inside step')
    console.log(action)
    return new Promise((resolve, reject) => {
      let observation
      let webCon = this.envs[id].envWin.webContents
      let actionSet = this.envs[id].actionSet
      let renderCon = this.envs[id].renderWin.webContents
      this.env.step_envB(webCon, action, actionSet, renderCon).then(obs => {
        observation = obs.tensor.dataSync()
        return this.env.reward.get_reward(id, obs)
      }).then(reward => {
        resolve({observation: observation, reward: reward})
      })
    })
  }

  step_all(actions) {
    console.log('inside step_all')
    console.log(actions)
    let env = this.env
    return new Promise((resolve, reject) => {
      let promises = []
      for (let i = 0; i < env.totalEnvs; i++) {
        let promise = new Promise((resolve, reject) => {
          console.log(i)
          console.log(actions[i])
          this.step(i, actions[i]).then(obsrew => resolve(obsrew))
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

  */

}
