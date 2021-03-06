import gym
import numpy as np
from gym import error, spaces, utils
from gym.utils import seeding
from gym_qwop.envs.qwop_serv import QwopServ

class QwopEnv(gym.Env):

  def __init__(self, environments=1, frames=4, screen_size=(640, 400),
              crops=(20, 20, 600, 360), enable_render=False):

    self.observation_space = spaces.Box(
        low=-1,
        high=1,
        shape=(81, 81, frames),
        dtype=np.float32
    )
    self.action_space = spaces.MultiDiscrete([2, 2, 2, 2])
    self.qwop_serv = QwopServ(
        environments,
        frames,
        screen_size,
        crops,
        enable_render
    )

  def step(self, actions):
    returns = self.qwop_serv.step(actions)
    obs = []
    rewards = []
    dones = []
    info = {}
    for x in returns:
        obs.append(x.state)
        rewards.append(x.reward)
        dones.append(False)
    return obs, reward, dones, info

  def reset(self):
    obs = self.qwop_serv.reset()
    return obs

  def render(self, mode='human'):
    self.qwop_serv.render()

  def close(self):
    self.qwop_serv.close()
