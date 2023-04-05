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
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
const app = express()
const serv = createServer(app)
const PORT = process.env.PORT || 3000
const adminPassword = process.env.ADMINPASS || "admin"

////////////////////////////////////////
// Server setup
////////////////////////////////////////
// the __dirname is the current directory from where the script is running
app.use(express.static(__dirname + '/game/public'))

////////////////////////////////////////
// Multiplayer server setup
////////////////////////////////////////
const gameServer = new GameServer(serv, adminPassword)

///////////////////////////////////////
// Server Data API
///////////////////////////////////////
// Handel requests
const allowedAPIOrigin = '*' // You can change this to only allow certian sites to access to the server info
app.get('/info', cors({origin: allowedAPIOrigin}), (req, res) => {
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