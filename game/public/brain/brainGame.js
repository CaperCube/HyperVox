import World from "./gen/world/world.js"
import ChunkGenerator from "./gen/world/chunkGen.js"
import BrainComs from "./brainComs.js"
import { tileScale, defaultChunkSize, defaultWorldSize } from '../client/js/clientConstants.js'
import { blockTypes, getBlockByName } from '../common/blockSystem.js'
import { getPropByString } from "../common/dataUtils.js"
import { getGlobalPos } from "../common/positionUtils.js"
import BrainPlayer from "./entities/brainPlayer.js"
import { gameModes } from '../common/commonConstants.js'
import { checkForCommand } from "./chatCommands.js"

// This will be in charge of managing the flow of the game, be it singleplayer or multiplayer
class BrainGame {
    constructor(props = {
        isNetworked: false,
        network: null
    }) {    
        ///////////////////////////////////////////////////////
        // Game vars
        ///////////////////////////////////////////////////////
        this.gameOptions = {
            adminAlwaysExists: false,
            gameTickSpeed: 30, // Time in ms between game ticks
            // gameUpdateSpeed: 300, // Time in ms between entity updates
            validatePlayerActions: false, // Corrects player movement server-side
            gameMode: gameModes.creative, // The brain's default game-mode
            chatOptions: {
                maxChatSize: 40, // The maximum allowed characters in a chat message
            },
            // ToDo: Make game rules their own object, we don't want to clutter gameOptions with rules
            scoreLimit: 20, // The max player score before a winner is decalred and the game is reset
            worldPath: './game/public/worlds/',
        }
        
        this.brainComs = new BrainComs({
            brainGame: this,
            isNetworked: props.isNetworked,
            network: props.isNetworked? props.network : null
        })

        this.generator = new ChunkGenerator()
        this.world = null
        this.intervalCommands = []
        this.players = []
        this.whiteList = [] // list of playerIDs who have admin priv. (IDs in this list don't need to be connected players) (We should also change playerIDs to be unique only per user, not random every time)
        this.testVal = "null"
        this.adminPassword = "admin" // Set to null for no login // ToDo: This should get stored elsewhere or loaded in

        // Brain computation vars
        this.gameTickInterval = null
    }

    ///////////////////////////////////////////////////////
    // Getters & Setters
    ///////////////////////////////////////////////////////
    //this.getTestVal = () => { return testVal }
    //this.setTestVal = ( newVal ) => { testVal = newVal }

    //this.getWorld = () => { return world }
    //this.generateWorld = (seed) => { worldGenNormal(world) }

    ///////////////////////////////////////////////////////
    // Methods
    ///////////////////////////////////////////////////////
    createNewWorld = ( size, pattern = 'basic' ) => {
        // Create new world object
        this.world = new World({worldSize: size || defaultWorldSize, chunkSize: defaultChunkSize})

        // Generate the world's chunk data
        // ToDo: Move world gen code here to World() class as a method
        const genWorld = this.generator.generateWorld({
            seed: this.world.getWorldSeed(),
            chunkSize: this.world.getChunkSize(),
            worldSize: this.world.getWorldSize(),
            pattern: pattern,
        })
        this.world.worldChunks = genWorld

        // Send world to connected users
        this.brainComs.sendFullWorld( this.world )

        // Start server brain loop
        this.startGameLoop()
    }

    loadWorld = ( jsonWorld ) => {
        // Create new world object
        this.world = new World()

        // Load JSON data
        this.world.loadWorldFromJSON(jsonWorld)

        // Send world to connected users
        this.brainComs.sendFullWorld( this.world )

        // Start server brain loop
        this.startGameLoop()
    }

    saveWorld = (callback, wName) => {
        // Create a name for the file
        let worldName = wName || 'server_world'

        // Check if networked game
        if (this.brainComs.isNetworked) {
            // Stringify the world
            const worldData = JSON.stringify(this.world)

            // Save file
            saveFile(this.gameOptions.worldPath, worldName, worldData, ()=>{ callback(worldName) })
        }
        else {
            // Tell client to save world
            this.brainComs.genericToClient('saveClientWorld', {worldName: worldName})
            callback(null)
        }
    }

    // ToDo: refactor this to pull from server files
    loadWorldFromURL = ( worldName, msgCallback ) => {
        let startedLoading = false

        // Send request to load json
        getJSON(worldName,
            (err, data) => {
            if (err !== null) {
                msgCallback(`URL request failed:  ${err}`)
            } else {
                if (!startedLoading) {
                    if (data) {
                        startedLoading = true
                        this.loadWorld( JSON.parse(data) )
                    }
                }
            }
        })
    }

    updateSingleBlock = ( location, id ) => {
        if (this.world) {
            const locationExists = (!!this.world.worldChunks?.[location.chunk.y]?.[location.chunk.x]?.[location.chunk.z]?.[location.block.y]?.[location.block.x])
            if (locationExists) {
                // Make sure the block ID is valid
                const newID = parseInt(id, 10)

                // Validate change
                // ...

                // Make change
                this.world.worldChunks
                [location.chunk.y][location.chunk.x][location.chunk.z]
                [location.block.y][location.block.x][location.block.z] = newID

                // Check neighboring blocks
                // ToDo: replace this with more robust logic
                if (newID > 0) {
                    let underBlock = location.block.y-1
                    let underChunk = location.chunk.y

                    if (underBlock < 0) { 
                        underChunk--
                        underBlock = this.world.worldChunks[0][0][0].length-1
                    }

                    if (underChunk >= 0) {
                        let thisBlock = this.world.worldChunks
                        [underChunk][location.chunk.x][location.chunk.z]
                        [underBlock][location.block.x][location.block.z]
                        // console.log(underChunk, underBlock)
                        if (thisBlock === blockTypes.indexOf(getBlockByName('grass'))) {
                            const dirtID = blockTypes.indexOf(getBlockByName('dirt'))
                            const underLocation = {
                                chunk: { x: location.chunk.x, y: underChunk, z: location.chunk.z },
                                block: { x: location.block.x, y: underBlock, z: location.block.z }
                            }
                            thisBlock = dirtID
                            this.brainComs.updateSingleBlock( underLocation, dirtID )
                        }
                    }
                }

                // Update players with change (if validated)
                this.brainComs.updateSingleBlock( location, newID )
            }
        }

    }

    setAdmin = ( playerID, newVal ) => {
        const myPlayer = this.players.filter(p => p.playerID === playerID)?.[0]
        if (myPlayer) {
            myPlayer.isAdmin = true
            // myPlayer.playerName += ' (admin)'
            // ToDo: tell all clients to change this player's name
        }
        else {
            console.log('This player does not exist')
            // This player does not exist
            // ToDo: send a chat message saying this player does not exist
        }
    }

    setBlockMetaData = ( location, data ) => {
        if (this.world) {
            // Check if this spot in the world exists
            const locationExists = (!!this.world.worldChunks?.[location.chunk.y]?.[location.chunk.x]?.[location.chunk.z]?.[location.block.y]?.[location.block.x])
            if (locationExists) {
                // Get block and prop name
                const blockPosition = getGlobalPos(location, this.world._chunkSize)
                const blockPropName = `${blockPosition.x}_${blockPosition.y}_${blockPosition.z}`

                // If the blockData object doesn't exist, create it
                // ToDo: We want to make sure this property exsists when the world is loaded, not here
                if (!this.world.blockData) this.world.blockData = {}

                // Set data
                this.world.blockData[blockPropName] = data

                // Tell others about this change
                this.brainComs.genericToClient('updateBlockMetaData', {blockPropName: blockPropName, data: data})
            }
        }
    }

    runCommandString = ( command ) => {
        // Run multiple commands
        // https://regexr.com/
        let commandList = command?.split(/(;)/) // /(;+? )/

        commandList?.forEach(cmd => {
            // Remove (semicolons) or (spaces at the beginning of the string)
            const formattedCommand = cmd.replace(/(;|^ )/, "")
            
            // Run command
            if (formattedCommand.length > 0) {
                let commandFound = false
                commandFound = checkForCommand(formattedCommand, "Server", 0, true, this, (responseMessage, isPrivate) => {
                    // commandFound = true
                    // Send message
                    const serverData = { message: responseMessage, messageName: 'Server', isServer: true }
                    this.brainComs.genericToClient('receiveChatMessage', serverData, 'all')
                })
                if (!commandFound) {
                    let data = {
                        message: formattedCommand,
                        messageName: "Server"
                    }
                    this.brainComs.genericToClient('receiveChatMessage', data)
                }
            }
        })
    }

    changeWorldSpawn = ( location ) => {
        // Set world spawn
        this.world.worldSpawn = location

        // Tell others about this change
        this.brainComs.genericToClient('updateWorldSpawn', {location: location})
    }

    resetScores = () => {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i]) this.players[i].ResetStats()
        }
    }

    // ToDo: this should check the player's position using a time stamp
    // Note: This function should only be used for "hitscan" guns, projectiles should move like entities
    checkIfShotHitAnyone = ( data, authorID ) => { 
        // data = { origin: { location, rotation }, item }
        // authorID = the ID of the player that shot the gun
        
        // Check if player has ammo in inv
        // Loop though all voxles intersected
            // Check if this voxel is colidable & if point colides with the block's collider (if non-standard)
            // Return hit player if hit
            // Return false if loop ends with no hit

        // Loop though this.players (ignore author)
        // Check if player intersects with the ray (up to max length)
            // Return this.players[i].playerID if hit & break loop
            // Return null if no hit
        return null
    }
    ///////////////////////////////////////////////////////
    // Loops
    ///////////////////////////////////////////////////////
    startGameLoop = () => {
        // Stop loop if it's there already
        if (this.gameTickInterval) {
            this.stopGameLoop()
        }

        // Reset player data
        //...

        // Create intervals
        if (this.world.intervalCommands) {
            Object.values(this.world.intervalCommands).forEach( interval => {
                // Create interval
                this.intervalCommands.push( setInterval( () => { 
                    // Run commands
                    this.runCommandString(interval.command)
                }, interval.time ) )
            })
        }

        // Start loop
        this.gameTickInterval = setInterval(()=>{ this.gameTick() }, this.gameOptions.gameTickSpeed)
    }

    changeGameLoopSpeed = (newSpeed) => {
        // Change speed
        this.gameOptions.gameTickSpeed = newSpeed

        // Reset loop if already running
        if (this.gameTickInterval) {
            clearInterval(this.gameTickInterval)
            // Restart loop
            this.gameTickInterval = setInterval(()=>{ this.gameTick() }, this.gameOptions.gameTickSpeed)
        }
    }

    stopGameLoop = () => {
        // Stop loop
        clearInterval(this.gameTickInterval)
        this.gameTickInterval = null

        // Clear all interval commands
        this.intervalCommands.forEach( interval => { clearInterval(interval) } )
        this.intervalCommands = []
    }

    // Here is where faster updates should happen (e.g. entity positions, enemy movement updates)
    gameUpdate = () => {
        //...
    }

    // Here is where we should validate player movements and actions, when needed
    actionValidation = () => {
        //...
    }

    // Here is where all the world updates should happen
    gameTick = () => {
        ///////////////////////////////////////////////////////
        // send all player's positions
        ///////////////////////////////////////////////////////
        let data = {}
        data.players = []

        // Get all player's data
        for (let i = 0; i < this.players.length; i++)
        {
            const myBrainPlayer = this.players[i]

            if (myBrainPlayer) {
                // Update data packet
                const myData = {
                    playerID: myBrainPlayer.playerID,
                    position: myBrainPlayer.position,
                    rotation: myBrainPlayer.rotation,
                    health: myBrainPlayer.health,
                    stats: myBrainPlayer.stats
                }

                // Put into data object
                data.players.push(myData)

                // ToDo: compile the updates and send them as a single message
                // this.brainComs.genericToClient('movePlayer', data)
            }
        }

        ///////////////////////////////////////////////////////
        // Send update
        ///////////////////////////////////////////////////////

        this.brainComs.genericToClient('updateAllPlayers', data)
        // or 'gameUpdateTick'
    }
}

// ToDo: refactor this to allow different world sources (or to get from server)
const getJSON = function(worldName, callback) {
    if (typeof(XMLHttpRequest) == "undefined") {
        import('http').then((pkg) => {
            const httpPkg = pkg.default

            // Request options
            var options = {
                hostname: 'localhost',
                port: '3000',
                path: `/worlds/${worldName}.json`,
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }

            // Create request
            let req = httpPkg.request(options, function(res) {
                res.setEncoding('utf8')
                let data = ''
                res.on('data', (chunk) => {
                    // Get data chunks
                    data += chunk
                })
                res.on('end', () => {
                    // Finished!
                    callback(null, data)
                })
            })
            req.on('error', (e) => {
                // Failed request
                callback(e.message, null)
            })
            req.end()
        })
    } else {
        let xhr = new XMLHttpRequest()
        xhr.open('GET', url, true)
        xhr.responseType = 'json'
        xhr.onload = function() {
            let status = xhr.status
        if (status === 200) {
            callback(null, xhr.response)
        } else {
            callback(status, xhr.response)
        }
        }
        xhr.send()
    }
}

const saveFile = function(path, fileName, fileData, callback) {
    // If using a server, import fs
    import('fs').then((pkg) => {
        const fs = pkg.default

        fs.writeFile(`./${path}${fileName}.json`, fileData, function (err) {
            if (err) {
                return console.log(err)
            }
            console.log('World saved!')

            // Do callback
            callback()
        })
    })
}

export default BrainGame
export { gameModes, BrainPlayer }