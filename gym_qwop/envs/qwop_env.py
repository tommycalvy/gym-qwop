import gym
from gym import error, spaces, utils
from gym.utils import seeding

# Constants
NUM_ACTIONS = 43
NUM_LEVELS = 9
CONFIG = 0
SCENARIO = 1
MAP = 2
DIFFICULTY = 3
ACTIONS = 4
MIN_SCORE = 5
TARGET_SCORE = 6

class FooEnv(gym.Env):
  metadata = {'render.modes': ['human']}

  ACTION = ["Q", "W", "O", "P"]

  def __init__(self):

    self.screen_height = 400
    self.screen_width = 640
    self.observation_space = spaces.Box(
        low=0, high=255, shape=(self.screen_height, self.screen_width, 3)
    )

  def step(self, actions):
    ...
  def reset(self):
    ...
  def render(self, mode='human'):
    ...
  def close(self):
    ...
