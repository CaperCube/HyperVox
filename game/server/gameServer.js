////////////////////////////////////////
//////////////// About /////////////////
// This entry point is the dedicated
// multiplayer server for the game.
////////////////////////////////////////

import BrainGame from "../public/brain/brainGame"
const gameport  = 3001

// Here we will use socket.io

////////////////////////////////////////
// Sudo code for basic network communications
////////////////////////////////////////

// const socket = new Socket()
// const brain = new BrainGame({ isNetworked: true, network: socket})

// Incoming client messages
// socket.on( 'genericClientMessage', ( data ) => {
//     const playerId = socket.connectionID // This does not support multiple players per client in networked games
//     brain.brainComs.clientMessages[data.type]( data.args, playerId )
// })

class GameServer {
    constructor() {
        this.socket = require("socket.io")(gameport)
        this.brain = new BrainGame({ isNetworked: true, network: this.socket})

        // Incoming client messages
        this.socket.on( 'genericClientMessage', ( data ) => {
            const playerId = 0//socket.connectionID // This does not support multiple players per client in networked games
            this.brain.brainComs.clientMessages[data.type]( data.args, playerId )
        })

        console.log('Created a new game server')
    }
}

export default GameServer