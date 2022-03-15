import World from "./gen/world/world.js"
import ChunkGenerator from "./gen/world/chunkGen.js"
import BrainComs from "./brainComs.js"
import { tileScale, defaultChunkSize, defaultWorldSize } from '../client/js/clientConstants.js'

// This will be in charge of managing the flow of the game, be it singleplayer or multiplayer
class BrainGame {
    constructor(props = {
        isNetworked: false,
        network: null
    }) {    
        ///////////////////////////////////////////////////////
        // Game vars
        ///////////////////////////////////////////////////////
        this.GameOptions = {
            gameTickSpeed: 10000, // Time in ms between game ticks
            gameUpdateSpeed: 1/30000, // Time in ms between entity updates
            validatePlayerActions: false // Corrects player movement server-side
        }
        
        this.brainComs = new BrainComs({
            brainGame: this,
            isNetworked: props.isNetworked,
            network: props.isNetworked? props.network : null
        })

        this.generator = new ChunkGenerator()
        this.world = null
        this.players = []
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
    createNewWorld = () => {
        // Create new world object
        this.world = new World({worldSize: defaultWorldSize, chunkSize: defaultChunkSize})

        // Generate the world's chunk data
        const genWorld = this.generator.generateWorld({
            seed: this.world.getWorldSeed(),
            chunkSize: this.world.getChunkSize(),
            worldSize: this.world.getWorldSize()
        })
        this.world.worldChunks = genWorld
    }

    ///////////////////////////////////////////////////////
    // Loops
    ///////////////////////////////////////////////////////
    gameUpdate = () => { /* Here is where faster updates should happen (e.g. entity positions, enemy movement updates) */ }
    movementValidation = () => { /* Here is where we should validate player movements and actions, when needed */ }
    gameTick = () => { /* Here is where all the world updates should happen */ }
}

export default BrainGame