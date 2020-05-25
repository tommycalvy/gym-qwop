import subprocess
from socket import (socket, socketpair, SOCK_STREAM, AF_UNIX)

class QwopServ:

    def __init__(self, instances=1, frames=4, screen_size=(640, 400),
                crops=(20, 20, 20, 20), enable_Render=true):

        #qwop server configurations
        path = './node_modules/.bin/electron'
        cmd = (path, 'main.js', str(instances), str(frames), str(screen_size[0]), str(screen_size[1]),
                str(crops[0]), str(crops[1]), str(crops[2]), str(crops[3]), str(enable_Render))
        subprocess.run(cmd)
        client = socket(AF_UNIX, SOCK_STREAM)
        client.connect('./tmp/app.qwop')
        # "{\"type\":\"message\",\"data\":\"hello response\"}\f"
        client.send('hello')
