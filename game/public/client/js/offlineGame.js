import ClientGame from "./clientGame.js"

const canvas = $('#main-canvas')

// `isNetworked: false` automatically creates a `new BrainGame()` inside the ClientGame object
const clientGame = new ClientGame({ isNetworked: false, canvas: canvas })

// Start game scene
// clientGame.startNewGameScene()
clientGame.clientComs.createNewWorld()



// [ ] Use `this._clientGame` instead of `this.clientGame` because it should not be messed with otside the class

/*
// In server for incoming client messages
socket.on( 'genericClientMessage', ( data ) => {
    const playerId = socket.connectionID // This does not support multiple players per client in networked games
    brainComs.clientMessages[data.type]( data.args, playerId )
})
*/