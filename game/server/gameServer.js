////////////////////////////////////////
//////////////// About /////////////////
// This entry point is the dedicated
// multiplayer server for the game.
////////////////////////////////////////

import BrainGame from "../public/brain/brainGame.js"
import { Server } from "socket.io"

class GameServer {
    constructor(httpServer, adminPassword = "admin") {
        // Create socket listener for server
        const io = new Server(httpServer, {
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

        this.socket = io.sockets
        this.brain = new BrainGame({ isNetworked: true, network: this.socket, adminPassword: adminPassword})

        // Init Sockets message listeners
        this.InitMessageListeners()

        console.log('Created a new game server')
    }

    InitMessageListeners() {
        this.socket.SOCKET_LIST = {}
        this.socket.on('connection', (socket) => {
            ////////////////////////////////////////
            // Connection limit
            ////////////////////////////////////////
            if (this.brain.players.length >= this.brain.gameOptions.maxPlayers) {
                const message = `Connection refused: This game is full. (${this.brain.gameOptions.maxPlayers} max)`
                socket.emit( `genericClientMessage`, { type: "disconnectMessage", recipients: 'all', args: { message: message } } )
                // socket.emit('kickedPlayer', { reason: `Connection refused, this game is full. (${this.brain.gameOptions.maxPlayers} players maximum)` })
                socket.disconnect()
                console.log('Disconnected new player becuase game is full.')
                return
            }

            ////////////////////////////////////////
            // Create a client ID for this connection
            ////////////////////////////////////////
            socket.ID = Math.random()
            this.socket.SOCKET_LIST[socket.ID] = socket
            console.log(`Welcome, ${socket.ID}`)

            ////////////////////////////////////////
            // Create new player
            ////////////////////////////////////////
            const myServerPlayer = this.brain.addNewPlayer(socket.ID, socket)

            ////////////////////////////////////////
            // Message Handlers
            ////////////////////////////////////////
            // Handle all generic messages
            socket.on( 'genericClientMessage', ( data ) => {
                const playerID = socket.ID // This does not support multiple players per client in networked games
                this.brain.brainComs.clientMessages[data.type]( data.args, playerID )
            })

            // Handle players disconnecting
            socket.on( 'disconnect', ( data ) => {
                console.log(`Player ${socket.ID} disconnected`)

                // Remove from player list
                const iDMatchedPlayers = this?.brain?.players?.filter(p => p.playerID === socket.ID)
                const playerName = iDMatchedPlayers[0]?.playerName || "Player"
                if (iDMatchedPlayers?.length > 0) {
                    // Remove player
                    this.brain.players.splice(this.brain.players.indexOf(iDMatchedPlayers[0]), 1)
                }
                //delete this.socket.SOCKET_LIST[socket.ID]

                // If no admin exists, assign a new one
                if (this.brain.gameOptions.adminAlwaysExists) {
                    const listOfAdmins = this?.brain?.players?.filter(p => p.isAdmin)
                    if (listOfAdmins.length === 0 && this.brain.players.length > 0) this.brain.setAdmin(this.brain.players[0].playerID, true)
                }

                // Send message
                this.socket.emit( `genericClientMessage`, { type: "receiveChatMessage", recipients: 'all', args: { message: `${playerName} has left the game.`, messageName: "Server", nameColor: "#888888", isServer: true } } )
                this.socket.emit( `genericClientMessage`, { type: "initOtherPlayers", recipients: 'all', args: { players: this.brain.players } } )
            })
        })
    }
}

export default GameServer