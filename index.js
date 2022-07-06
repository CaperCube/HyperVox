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
import * as dotenv from 'dotenv'
dotenv.config()
import { dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))

import { BrainPlayer } from './game/public/brain/brainGame.js'
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
const io = new Server(serv, {
    // ToDo: try to leave this at default and adjust the networking logic to send large messages in small chunks
    maxHttpBufferSize: 1e10,
    cors: {
        origin: `*`,
        methods: ["GET", "POST"],
        transports: ['websockets', 'polling'],    
        handelPreFlightRequest: (req, res) => {
            res.writeHead(200, {
                "Access-Control-Allow-Origin": `*`,
                "Access-Control-Allow-Methods": "GET,POST",
            })
        }
      },
      allowEIO3: true,
})

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

    // Create new player
    // gameServer.brain.players.push(socket.ID)
    const myServerPlayer = new BrainPlayer(socket.ID)
    myServerPlayer.gameMode = gameServer.brain.gameOptions.gameMode

    // Add player to brain
    const isFirstPlayer = (gameServer.brain.players.length === 0)
    gameServer.brain.players.push(myServerPlayer)
    if (isFirstPlayer) gameServer.brain.setAdmin(myServerPlayer.playerID, true)

    // Tell the new client what their ID is
    socket.emit(`welcomePacket`, {clientID: socket.ID, playerName: myServerPlayer.playerName})

    // Send the world to this player, if the world exists
    if (gameServer.brain.world) {
        const data = { world: gameServer.brain.world } 
        socket.emit( 'genericClientMessage', { type: 'loadSentWorld', args: data } )
    }

    // Handle all generic messages
    socket.on( 'genericClientMessage', ( data ) => {
        const playerID = socket.ID // This does not support multiple players per client in networked games
        gameServer.brain.brainComs.clientMessages[data.type]( data.args, playerID )
    })

    // Handle players disconnecting
    socket.on( 'disconnect', ( data ) => {
        console.log(`Player ${socket.ID} disconnected`)

        // Remove from player list
        const iDMatchedPlayers = gameServer?.brain?.players?.filter(p => p.playerID === socket.ID)
        if (iDMatchedPlayers?.length > 0) {
            // Remove player
            gameServer.brain.players.splice(gameServer.brain.players.indexOf(iDMatchedPlayers[0]), 1)
        }
        //delete SOCKET_LIST[socket.ID]

        // If no admin exists, assign a new one
        const listOfAdmins = gameServer?.brain?.players?.filter(p => p.isAdmin)
        if (listOfAdmins.length === 0 && gameServer.brain.players.length > 0) gameServer.brain.setAdmin(gameServer.brain.players[0].playerID, true)

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