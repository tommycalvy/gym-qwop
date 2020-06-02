module.exports = class GameController {

  constructor(env) {
    this.env = env
    this.totalEnvs = this.env.total_envs()
    this.envs = [totalEnvs]
  }

  create_envs() {
    for (let i = 0; i < this.totalEnvs; i++) {
      this.envs.push({
        actionSet: this.env.action_set(),
        envWebContents: this.env.create_env(),
        renderWebContents: this.env.create_renderer()
      })
    }
  }

  step(id, action) {
    // TODO: check what the format of the action variable is
    return this.env.step_env(this.envs[id].envWebContents, action, this.envs[id].actionSet, this.envs[id].renderWebContents)
  }
}
