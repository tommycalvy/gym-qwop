const ipc = require('electron').ipcRenderer


const vid = document.getElementById("frame")
console.log("hello???????")
ipc.on('frame-update', (event, frame) => {
  console.log('received frame')
  vid.src = frame
})
