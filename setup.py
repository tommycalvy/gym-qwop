from setuptools import setup

setup(name="gym_qwop",
      version="0.4",
      url="https://github.com/tommycalvy/gym-qwop",
      author="Thomas L. Calvy",
      license="MIT",
      packages=["gym_maze", "gym_maze.envs"],
      package_data = {
          "gym_maze.envs": ["maze_samples/*.npy"]
      },
      install_requires = ["gym", "numpy"]
)
