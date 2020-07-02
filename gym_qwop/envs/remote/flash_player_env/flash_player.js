const querystring = require('querystring');

let query = querystring.parse(global.location.search);
let data = JSON.parse(query['?data']);
let flashPlayer = document.getElementById('flash-player');
let html = '<object type="application/x-shockwave-flash" data="' + data.flashGame +
          '" width="' + data.width + 'px" height="' + data.height + 'px"></object>';
flashPlayer.insertAdjacentHTML('beforeend', html);
