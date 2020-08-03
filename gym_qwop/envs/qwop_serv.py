import subprocess
import json
import time
from socket import (socket, error, socketpair, SOCK_STREAM, AF_UNIX)


class QwopServ:

    def __init__(self, environments, frames, screen_size, crops, enable_render):

        #qwop server configurations
        self.delimiter = '\f'
        electron_path = '/Users/TommyCalvy/Desktop/Apps/gym-qwop/gym_qwop/envs/node_modules/.bin/electron'
        mainjs_path = '/Users/TommyCalvy/Desktop/Apps/gym-qwop/gym_qwop/envs/main.js'
        cmd = (
            electron_path, mainjs_path, str(environments), str(frames),
            str(screen_size[0]), str(screen_size[1]), str(crops[0]),
            str(crops[1]), str(crops[2]), str(crops[3]), str(enable_render)
        )
        subprocess.Popen(cmd)

        time.sleep(5)

        print('Starting...')
        server_address = '/tmp/app.qwop'

        try:
            self.client = socket(AF_UNIX, SOCK_STREAM)
        except error as e:
            print("Failed To Create A Scoket")
            print("Reason : ", str(e))
        print("Socket Created Successfully")

        try:
            self.client.connect(server_address)
            print("Socket connected to electron server")
        except error as e:
            print('Failed To Connect To Electron Server')
            print("Reason : ", str(e))
        # "{\"type\":\"message\",\"data\":\"hello response\"}\f"
        # self.client.send('hello')

    def step(self, actions):
        print('!step')
        data = {
            "type": "step",
            "data": json.dumps(actions)
        }
        self.client.sendall(self.format(data))
        return self.recv()

    def reset(self):
        print('!reset')
        data = {
            "type": "reset",
            "data": "reset"
        }
        self.client.sendall(self.format(data))
        return self.recv()

    def render(self):
        print('!render')
        data = {
            "type": "render",
            "data": "render"
        }
        self.client.sendall(self.format(data))

    def close(self):
        print('!close')
        data = {
            "type": "close",
            "data": "close"
        }
        self.client.sendall(self.format(data))

    def format(self, data):
        message = json.dumps(data) + self.delimiter
        return message.encode()

    def recv(self):
        print('Receiving Data')
        fragments = []
        while True:
            chunk = self.client.recv(10000)
            if not chunk:
                break
            fragments.append(chunk)
        arr = b''.join(fragments)
        data = json.loads(arr)
        return data
