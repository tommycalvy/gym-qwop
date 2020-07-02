const ipc = require('electron').ipcRenderer
const querystring = require('querystring');


let query = querystring.parse(global.location.search);
let data = JSON.parse(query['?data']);
let renderer = document.getElementById('renderer');
let html = '<img id="frame" src="" width="' + data.width '" height="' + data.height + '"/>';
renderer.insertAdjacentHTML('beforeend', html);


const vid = document.getElementById("frame")
ipc.on('frame', (event, frame) => {
  console.log('received frame')
  vid.src = frame
})
