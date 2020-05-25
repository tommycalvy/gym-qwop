import gym
from gym import error, spaces, utils
from gym.utils import seeding


class FooEnv(gym.Env):
  metadata = {'render.modes': ['human']}

  ACTION = ["Q", "W", "O", "P"]

  def __init__(self):
    ...
  def step(self, action):
    ...
  def reset(self):
    ...
  def render(self, mode='human'):
    ...
  def close(self):
    ...
