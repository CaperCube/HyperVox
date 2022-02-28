import World from "./gen/world/world.js"
import { tileScale, defaultWorldSize } from '../client/js/clientConstants.js'

// This will be in charge of managing the flow of the game, be it singleplayer or multiplayer
class Game {
    constructor() {    
        ///////////////////////////////////////////////////////
        // Public vars
        ///////////////////////////////////////////////////////
        this.GameOptions = {
            gameTickSpeed: 10000, // Time in ms between game ticks
            gameUpdateSpeed: 1/30000, // Time in ms between entity updates
            validatePlayerActions: false // Corrects player movement server-side
        }

        ///////////////////////////////////////////////////////
        // Private vars
        ///////////////////////////////////////////////////////
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
        this.world = new World({worldSize: defaultWorldSize})
        const genWorld = generateSimpleWorld({
            seed: this.world.getWorldSeed(),
            chunkSize: this.world.getChunkSize(),
            worldSize: this.world.getWorldSize(),
            genMesh: false
        })
        this.world.worldChunks = genWorld.worldChunks
    }

    ///////////////////////////////////////////////////////
    // Loops
    ///////////////////////////////////////////////////////
    gameUpdate = () => { /* Here is where faster updates should happen (e.g. entity positions, enemy movement updates) */ }
    movementValidation = () => { /* Here is where we should validate player movements and actions, when needed */ }
    gameTick = () => { /* Here is where all the world updates should happen */ }
}

export default Game