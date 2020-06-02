const ipc = require('electron').ipcRenderer;
// Import Dexie
const Dexie = require('dexie');
// Force debug mode to get async stacks from exceptions.
Dexie.debug = true; // In production, set to false to increase performance a little.



// TODO: This should be for the flash_game.js -> FlashGame class
let db = new Dexie("RewardDatabase");
db.version(1).stores({
  rewards: "++num,id,value",
  trajectories: "++num,*states,variance,"
});

ipc.on('data', (event, reward) => {
  await db.rewards.add(reward);
})

ipc.on('prepare', (event) => {

})
