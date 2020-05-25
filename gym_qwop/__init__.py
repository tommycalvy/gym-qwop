from gym.envs.registration import register


register(
    id = 'qwop-v0',
    entry_point = 'gym_qwop.envs:QwopEnv',
)
