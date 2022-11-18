import World from "./gen/world/world.js"
import ChunkGenerator from "./gen/world/chunkGen.js"
import BrainComs from "./brainComs.js"
import { randomArray } from '../common/dataUtils.js'
import { tileScale, defaultChunkSize, defaultWorldSize, gameModes, formatPlayerName, getRandomName } from '../common/commonConstants.js'
import { blockTypes, getBlockByName } from '../common/blockSystem.js'
import { getGlobalPos } from "../common/positionUtils.js"
import BrainPlayer from "./entities/brainPlayer.js"
import { checkForCommand } from "./chatCommands.js"

// This will be in charge of managing the flow of the game, be it singleplayer or multiplayer
class BrainGame {
    constructor(props = {
        isNetworked: false,
        network: null,
        adminPassword: "admin",
    }) {    
        ///////////////////////////////////////////////////////
        // Game vars
        ///////////////////////////////////////////////////////
        this.gameOptions = {
            maxPlayers: 16, // A networked game will refuse new connections if this.players.length is >= this value
            adminAlwaysExists: false, // If true, the the brain will always try to have at least one admin in a game
            worldPath: './game/public/worlds/', // The folder in which the brain looks for world files
            gameTickSpeed: 30, // Time in ms between game ticks
            // gameUpdateSpeed: 300, // Time in ms between entity updates
            validatePlayerActions: false, // Corrects player movement server-side
            gameMode: gameModes.creative, // The brain's default game-mode
            chatOptions: {
                maxChatSize: 40, // The maximum allowed characters in a chat message
                filterChatHTML: true, // If true, player chat messages will be filtered to not allow executable HTML
                allowPlayerNameChange: true // If true, this allow's non-admins to change their own names
            },
            // ToDo: Make game rules their own object, we don't want to clutter gameOptions with rules
            scoreLimit: 20, // The max player score before a winner is decalred and the game is reset
            commandBlockTriggerTime: 1000 // Time in ms between valid command block triggers
        }
        
        this.brainComs = new BrainComs({
            brainGame: this,
            isNetworked: props.isNetworked,
            network: props.isNetworked? props.network : null
        })

        this.generator = new ChunkGenerator()
        this.world = null
        this.intervalCommands = []
        this.commandBlockCanBeRun = true
        this.players = []
        this.whiteList = [] // list of playerIDs who have admin priv. (IDs in this list don't need to be connected players) (We should also change playerIDs to be unique only per user, not random every time)
        this.testVal = "null"
        this.adminPassword = props.adminPassword // Set to null for no login // ToDo: This should get stored elsewhere or loaded in

        // Brain computation vars
        this.gameTickInterval = null
    }

    ///////////////////////////////////////////////////////
    // Methods
    ///////////////////////////////////////////////////////
    addNewPlayer = (newPlayerID, socket = null) => {
        // Create BrainPlayer
        const myBrainPlayer = new BrainPlayer(newPlayerID)
        const isFirstPlayer = (this.players.length === 0)

        // Push to brain player array
        this.players.push(myBrainPlayer)

        // Set gameMode
        myBrainPlayer.gameMode = this.gameOptions.gameMode
        // Assign admin if relevent
        if (!this.brainComs.isNetworked) {
            this.setAdmin(myBrainPlayer.playerID, true)
        }
        else {
            if (this.gameOptions.adminAlwaysExists) {
                if (isFirstPlayer) this.setAdmin(myBrainPlayer.playerID, true)
            }
        }

        // Send welcome packet
        const welcomData = {clientID: newPlayerID, playerName: myBrainPlayer.playerName}
        if (this.brainComs.isNetworked) {
            socket.emit( 'genericClientMessage', { type: 'welcomePacket', recipients: 'all', args: welcomData } )
        }
        else {
            this.brainComs.genericToClient('welcomePacket', welcomData)
        }

        // Generate a new world
        if (!this.world) {
            // Generate a world of random size and pattern
            this.createNewWorld()
        }
        // Send the world, if the world exists
        else {
            const data = { world: this.world }
            if (this.brainComs.isNetworked) {
                socket.emit( 'genericClientMessage', { type: 'loadSentWorld', recipients: 'all', args: data } )
            }
            else {
                this.brainComs.genericToClient('loadSentWorld', data)
            }
        }

        // Return player
        return myBrainPlayer
    }

    createNewWorld = ( size, pattern ) => {
        // If no arguments, generate random props
        if (!size) {
            size = Math.floor((Math.random() * defaultWorldSize) + 1)
        }

        if (!pattern) {
            const patterns = Object.keys(this.generator.noisePatterns)
            pattern = randomArray(patterns)
        }

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
        let worldName = wName || 'new_world'

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

    loadWorldFromURL = ( worldName, msgCallback ) => {
        let startedLoading = false

        // Send request to load json
        this.getJSON(worldName,
            (err, data) => {
            if (err !== null) {
                msgCallback(`URL request failed:  ${err}`)
            } else {
                if (!startedLoading) {
                    if (data) {
                        // console.log(data)
                        startedLoading = true
                        this.loadWorld( JSON.parse(data) )
                    }
                }
            }
        })
    }

    // Used by "loadWorldFromURL"
    getJSON = (worldName, callback) => {
        const worldPath = this.gameOptions.worldPath
        if (typeof(FileSystem) == "undefined") {
            const path = `${worldPath}${worldName}.json`
    
            import('fs').then((pkg) => {
                const fs = pkg.default
    
                // Try to get file
                fs.readFile(path, {encoding: 'utf-8'}, (err,data)=> {
                    if (!err) {
                        callback(null, data)
                    }
                    else {
                        callback(`Cannot find file "${path}"`)
                    }
                })
            })
        }
    }

    listWorlds = (callback = ()=>{}) => {
        const worldPath = this.gameOptions.worldPath
        // Load fs
        if (typeof(FileSystem) == "undefined") {
            import('fs').then((pkg) => {
                const fs = pkg.default

                const jsonsInDir = fs.readdirSync(worldPath)
                callback(jsonsInDir)
                return jsonsInDir
            })
        }
    }

    getRandomWorldName = (callback = ()=>{}) => {
        // Get list
        let worlds = []
        this.listWorlds((fileNames) => { 
            worlds = fileNames
            console.log(worlds)

            // Trim off the file extension
            if (worlds.length > 0) {
                let formattedWorlds = []
                for (let i = 0; i < worlds.length; i++) {
                    formattedWorlds[i] = worlds[i].replace(/\.[^\/.]+$/, '')
                }
                // worlds.forEach(w => { w.replace(/\.[^\/.]+$/, '') })
            
                // Return
                const rndWorld = randomArray(formattedWorlds)
                console.log(rndWorld)
                callback( rndWorld )
            }
            else callback('')
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
            console.log(`${myPlayer.playerName} is now an admin.`)
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

    sendChatMessage = ( message, recipients = "all") => {
        const data = { message: message, messageName: 'Server', isServer: true }
        this.brainComs.genericToClient('receiveChatMessage', data, recipients)
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
                    this.sendChatMessage(responseMessage)
                })
                if (!commandFound) {
                    this.sendChatMessage(formattedCommand)
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

    killPlayer = (deadPlayer, killerPlayer = null) => {
        let serverData = {}
        let playerWon = false

        // ToDo: Move these colors to a constans file?
        const deadPlayerColor = '#ff0000'
        const killerPlayerColor = '#00ff00'

        // Apply score
        if (deadPlayer) deadPlayer.stats.deaths++
        else return // No player has died, so stop here
        if (killerPlayer) {
            killerPlayer.stats.kills++

            // Check score limit
            if (this.gameOptions.gameMode === gameModes.deathMatch &&
                killerPlayer.stats.kills >= this.gameOptions.scoreLimit) {
                // Decalre winner
                playerWon = true

                // Set server game more to spectator
                this.gameOptions.gameMode = gameModes.spectator
                for (let i = 0; i < this.players.length; i++) this.players[i].gameMode = this.gameOptions.gameMode

            }
        }

        // Create message
        // If a player won the game
        if (playerWon) serverData = {
            message: `
            <span class="msg-title">
                <span style="color: ${killerPlayerColor}; font-size: 10vh;">
                    ${killerPlayer?.playerName}
                </span>
                has won!
            </span>
            <br>Game mode changed to ${this.gameOptions.gameMode}.`,
            messageName: 'Server',
            isServer: true
        }
        // If a player is killed by another player
        else if (killerPlayer) serverData = {
            message: `<b style="color: ${killerPlayerColor};">${killerPlayer?.playerName}</b> killed <b style="color: ${deadPlayerColor};">${deadPlayer?.playerName}</b>`,
            messageName: 'Server',
            isServer: true
        }
        // If they player died on their own
        else serverData = {
            message: `<b style="color: ${deadPlayerColor};">${deadPlayer?.playerName}</b> died from nature.`,
            messageName: 'Server',
            isServer: true
        }

        // Send message
        this.brainComs.genericToClient('receiveChatMessage', serverData)

        // Respawn player
        this.brainComs.genericToClient('respawn', {}, [deadPlayer.playerID])
    }

    ///////////////////////////////////////////////////////
    // Player Methods
    ///////////////////////////////////////////////////////
    changePlayerName = (player, newName, isQuiet = false) => {
        // Format player name
        if (newName === "@r") newName = getRandomName()
        newName = formatPlayerName(newName)

        if (newName) {
            // Store old name
            const oldName = player.playerName
            
            // Set new name on server
            player.playerName = newName

            // Update client players
            const data = { targetPlayerID: player.playerID, newName: newName }
            this.brainComs.genericToClient('playerNameChange', data)
            this.brainComs.sayWhosConnected()

            // Send message
            this.sendChatMessage(`<span style="color: white;">${oldName}</span>'s has been renamed to <span style="color: white;">${player.playerName}</span>`)
        }
        else {
            // If name is invalid, tell the authoring player
            this.sendChatMessage(`That is an invalid name`, [player.playerID])
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
                    override: myBrainPlayer.override,
                    position: myBrainPlayer.position,
                    rotation: myBrainPlayer.rotation,
                    health: myBrainPlayer.health,
                    stats: myBrainPlayer.stats
                }

                // Put into data object
                data.players.push(myData)

                // If this tick, the player was in override, turn it off
                if (myBrainPlayer.override) myBrainPlayer.override = false

                // ToDo: compile all updates and send them as a single message
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