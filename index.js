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
import { dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))

import GameServer from './game/server/gameServer.js'
import { Server } from 'socket.io'
import express from 'express'
import { createServer } from 'http'
const app = express()
const serv = createServer(app)
// const express = require('express')
// const app = express()
// const serv = require('http').Server(app)
const PORT = process.env.PORT || 3000

// const io = require('socket.io')(serv,{});
const io = new Server(serv,{})//new Socket(3001)

////////////////////////////////////////
// Server setup
////////////////////////////////////////
// the __dirname is the current directory from where the script is running
app.use(express.static(__dirname + '/game/public'))

////////////////////////////////////////
// Multiplayer server setup (Move this eventaully?)
////////////////////////////////////////
const gameServer = new GameServer(io.sockets)

// The list of all socket connections
let SOCKET_LIST = {}
io.sockets.on('connection', (socket) => {
    // Create a client ID for this connection
    socket.ID = Math.random()
    SOCKET_LIST[socket.ID] = socket
    console.log(`Welcome, ${socket.ID}`)

    // Tell the new client what their ID is
    socket.emit(`welcomePacket`, {clientID: socket.ID})
    gameServer.brain.players.push(socket.ID)

    // Send the world to this player, if the world exists
    if (gameServer.brain.world) {
        const data = { world: gameServer.brain.world } 
        socket.emit( 'genericClientMessage', { type: 'loadSentWorld', args: data } )
    }

    // Handle all generic messages
    socket.on( 'genericClientMessage', ( data ) => {
        // console.log("recieved message")
        const playerId = socket.ID // This does not support multiple players per client in networked games
        gameServer.brain.brainComs.clientMessages[data.type]( data.args, playerId )
    })

    // Handle players disconnecting
    socket.on( 'disconnect', ( data ) => {
        console.log(`Player ${socket.ID} disconnected`)

        // Remove from player list
        if (gameServer?.brain?.players?.includes(socket.ID)) gameServer.brain.players.splice(gameServer.brain.players.indexOf(socket.ID))
        //delete SOCKET_LIST[socket.ID]

        // Send message
        io.sockets.emit( `genericClientMessage`, { type: "initOtherPlayers", args: { players: gameServer.brain.players } } )
    })
})

// listen for socket requests
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