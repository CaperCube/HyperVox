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

import GameServer from './game/server/gameServer.js'
import { Server } from 'socket.io'
import express from 'express'
import { createServer } from 'http'
const app = express()
const serv = createServer(app)
const PORT = process.env.PORT || 3000
const adminPassword = process.env.ADMINPASS || "admin"

const io = new Server(serv, {
    // maxHttpBufferSize: 1e10, // This is how to change the client message size limit
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
const gameServer = new GameServer(io.sockets, adminPassword)

// The list of all socket connections
io.sockets.SOCKET_LIST = {}
io.sockets.on('connection', (socket) => {
    ////////////////////////////////////////
    // Connection limit
    ////////////////////////////////////////
    if (gameServer.brain.players.length >= gameServer.brain.gameOptions.maxPlayers) {
        const message = `Connection refused: This game is full. (${gameServer.brain.gameOptions.maxPlayers} max)`
        socket.emit( `genericClientMessage`, { type: "disconnectMessage", recipients: 'all', args: { message: message } } )
        // socket.emit('kickedPlayer', { reason: `Connection refused, this game is full. (${gameServer.brain.gameOptions.maxPlayers} players maximum)` })
        socket.disconnect()
        console.log('Disconnected new player becuase game is full.')
        return
    }

    ////////////////////////////////////////
    // Create a client ID for this connection
    ////////////////////////////////////////
    socket.ID = Math.random()
    io.sockets.SOCKET_LIST[socket.ID] = socket
    console.log(`Welcome, ${socket.ID}`)

    ////////////////////////////////////////
    // Create new player
    ////////////////////////////////////////
    const myServerPlayer = gameServer.brain.addNewPlayer(socket.ID, socket)

    ////////////////////////////////////////
    // Message Handlers
    ////////////////////////////////////////
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
        const playerName = iDMatchedPlayers[0]?.playerName || "Player"
        if (iDMatchedPlayers?.length > 0) {
            // Remove player
            gameServer.brain.players.splice(gameServer.brain.players.indexOf(iDMatchedPlayers[0]), 1)
        }
        //delete io.sockets.SOCKET_LIST[socket.ID]

        // If no admin exists, assign a new one
        if (gameServer.brain.gameOptions.adminAlwaysExists) {
            const listOfAdmins = gameServer?.brain?.players?.filter(p => p.isAdmin)
            if (listOfAdmins.length === 0 && gameServer.brain.players.length > 0) gameServer.brain.setAdmin(gameServer.brain.players[0].playerID, true)
        }

        // Send message
        io.sockets.emit( `genericClientMessage`, { type: "receiveChatMessage", recipients: 'all', args: { message: `${playerName} has left the game.`, messageName: "Server", nameColor: "#888888", isServer: true } } )
        io.sockets.emit( `genericClientMessage`, { type: "initOtherPlayers", recipients: 'all', args: { players: gameServer.brain.players } } )
    })
})

///////////////////////////////////////
// Server Data API
///////////////////////////////////////
// Handel request
app.get('/info', (req, res) => {
    // Get gameServer data
    const connectedPlayers = gameServer.brain.players.length || 0
    const maxPlayers = gameServer.brain.gameOptions.maxPlayers || 16

    // Return info object
    res.status(200).send({
        players: [connectedPlayers, maxPlayers],
        server: {
            name: process.env.SVNAME || 'CaperCore Server',
            description: process.env.SVDESC || 'CaperCore Server',
            isModded: process.env.SVMODDED || false
        }
    })
})

///////////////////////////////////////
// listen for requests
///////////////////////////////////////
serv.listen(PORT, () => {
    console.log(`Now listening for connections on port ${PORT}`)
})

///////////////////////////////////////
// Server started
///////////////////////////////////////
console.log('\x1b[32m%s\x1b[0m', `Server has started!`)
console.log('\x1b[34m%s\x1b[0m',`Link to game: http://localhost:${PORT}/index.html`)
console.log('\x1b[34m%s\x1b[0m',`Link to editor: http://localhost:${PORT}/tools/worldTool/index.html`)