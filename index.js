////////////////////////////////////////
//////////////// About /////////////////
// This entry point is just meant to
// serve the client game to connecting
// users.
//
// This is NOT the multiplayer
// server for the game.
//
// The game's multiplayer server
// entry point is:
// `./game/server/gameServer.js`
////////////////////////////////////////



////////////////////////////////////////
// Packages ('import' requires node v13.2.0+ and `"type": "module"` to be in "package.json")
////////////////////////////////////////
// import GameServer from './game/server/gameServer.js'

const express = require('express')
const app = express()
const serv = require('http').Server(app)
const PORT = process.env.PORT || 3000
//const io = require('socket.io')(serv,{})

////////////////////////////////////////
// Server setup
////////////////////////////////////////
// the __dirname is the current directory from where the script is running
app.use(express.static(__dirname + '/game/public'))

////////////////////////////////////////
// Multiplayer server setup (Move this eventaully?)
////////////////////////////////////////

// const gameServer = new GameServer(io)

// listen for requests
serv.listen(PORT, () => {
    console.log(`Server listening for connections on port ${PORT}`)
})

///////////////////////////////////////
// Server started
///////////////////////////////////////
console.log(
    `Web server has started!`,
    `This is NOT the game server`,
    `Link to game: http://localhost:${PORT}/index.html`
)