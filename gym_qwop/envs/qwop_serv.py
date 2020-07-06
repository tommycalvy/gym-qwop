import subprocess
import json
from socket import (socket, socketpair, SOCK_STREAM, AF_UNIX)


class QwopServ:

    def __init__(self, environments, frames, screen_size, crops, enable_render):

        #qwop server configurations
        path = './node_modules/.bin/electron'
        cmd = (path, 'main.js', str(environments), str(frames), str(screen_size[0]), str(screen_size[1]),
                str(crops[0]), str(crops[1]), str(crops[2]), str(crops[3]), str(enable_render))
        subprocess.run(cmd)
        try:
            self.client = socket(AF_UNIX, SOCK_STREAM)
            self.client.connect('./tmp/app.qwop')
        except socket.error, msg:
            print >>sys.stderr, msg
            sys.exit(1)
        # "{\"type\":\"message\",\"data\":\"hello response\"}\f"
        # self.client.send('hello')

    def step(self, actions):
        data = {
            "type": "step",
            "data": json.dumps(actions)
        }
        self.client.send(data)
        return recv()

    def reset(self):
        data = {
            "type": "reset",
            "data": "reset"
        }
        self.client.send(data)
        return recv()

    def render(self):
        data = {
            "type": "reset",
            "data": "render"
        }
        self.client.send(data)

    def close(self):
        data = {
            "type": "close",
            "data": "close"
        }
        self.client.send(data)

    def recv(self):
        fragments = []
        while True:
            chunk = self.client.recv(10000)
            if not chunk:
                break
            fragments.append(chunk)
        arr = b''.join(fragments)
        data = json.loads(arr)
        return data
