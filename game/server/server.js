////////////////////////////////////////
//////////////// About /////////////////
// This entry point is the dedicated
// multiplayer server for the game.
////////////////////////////////////////

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