import World from "./gen/world/world.js"
import ChunkGenerator from "./gen/world/chunkGen.js"
import BrainComs from "./brainComs.js"
import { tileScale, defaultChunkSize, defaultWorldSize, getRandomName } from '../client/js/clientConstants.js'
import { blockTypes, getBlockByName } from '../common/blockSystem.js'

const gameModes = {
    creative: 'creative',
    parkour: 'parkour',
    deathMatch: 'deathmatch',
    teamDeathMatch: 'teamDeathMatch',
}

// ToDo: Move this player class to a seperate file
class BrainPlayer {
    constructor(playerID) {
        this.playerID = playerID
        this.playerName = getRandomName()//'Player' // ToDo: use 'getRandomPlayerName()'

        // Game vars
        this.isAdmin = false // ToDo: set as true if this is the first player in the lobby
        this.gameMode = gameModes.creative // this overrides 'gameOptions.gameMode'

        this.respawmPoint = { x: 0, y: 0, z: 0 } // not yet implemented
        this.position = { x: 0, y: 0, z: 0 }
        this.rotation = { x: 0, y: 0, z: 0 }
        this.health = 100 // not yet implemented

        // Vars for validation
        // (Not implemented yet. See 'docs/LagCompensation.md')
        this.positionHistory = {
            //'stamp-1230'
        }
    }
}

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
            gameTickSpeed: 100, // Time in ms between game ticks
            gameUpdateSpeed: 300, // Time in ms between entity updates
            validatePlayerActions: false, // Corrects player movement server-side
            gameMode: gameModes.creative // The brain's default game-mode
        }
        
        this.brainComs = new BrainComs({
            brainGame: this,
            isNetworked: props.isNetworked,
            network: props.isNetworked? props.network : null
        })

        this.generator = new ChunkGenerator()
        this.world = null
        this.players = []
        this.whiteList = [] // list of playerIDs who have admin priv. (IDs in this list don't need to be connected players) (We should also change playerIDs to be unique only per user, not random every time)
        this.testVal = "null"
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
    createNewWorld = (size) => {
        // Create new world object
        this.world = new World({worldSize: size || defaultWorldSize, chunkSize: defaultChunkSize})

        // Generate the world's chunk data
        // ToDo: Move world gen code here to World() class as a method
        const genWorld = this.generator.generateWorld({
            seed: this.world.getWorldSeed(),
            chunkSize: this.world.getChunkSize(),
            worldSize: this.world.getWorldSize()
        })
        this.world.worldChunks = genWorld

        // Send world to connected users
        this.brainComs.sendFullWorld( this.world )
    }

    loadWorld = (jsonWorld) => {
        // Create new world object
        this.world = new World()

        // Load JSON data
        this.world.loadWorldFromJSON(jsonWorld)

        // Send world to connected users
        this.brainComs.sendFullWorld( this.world )
    }

    updateSingleBlock = ( location, id ) => {
        if (this.world) {
            // Validate change
            // ...

            // Make change
            this.world.worldChunks
            [location.chunk.y][location.chunk.x][location.chunk.z]
            [location.block.y][location.block.x][location.block.z] = id

            // Check block below
            // ToDo: replace this with more robust logic
            if (id > 0) {
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
                    console.log(underChunk, underBlock)
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
            this.brainComs.updateSingleBlock( location, id )
        }

    }

    setAdmin = (playerID, newVal) => {
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
    ///////////////////////////////////////////////////////
    // Loops
    ///////////////////////////////////////////////////////
    gameUpdate = () => { /* Here is where faster updates should happen (e.g. entity positions, enemy movement updates) */ }
    movementValidation = () => { /* Here is where we should validate player movements and actions, when needed */ }
    gameTick = () => { /* Here is where all the world updates should happen */ }
}

export default BrainGame
export { gameModes, BrainPlayer }