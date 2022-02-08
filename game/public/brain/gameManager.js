// This will be in charge of managing the flow of the game, be it singleplayer or multiplayer
const GameManager = () => {
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
    let world = {}
    let players = []
    let testVal = "null"

    ///////////////////////////////////////////////////////
    // Getters & Setters
    ///////////////////////////////////////////////////////
    this.getTestVal = () => { return testVal }
    this.setTestVal = ( newVal ) => { testVal = newVal }

    this.getWorld = () => { return world }
    this.generateWorld = (seed) => { worldGenNormal(world) }

    ///////////////////////////////////////////////////////
    // Loops
    ///////////////////////////////////////////////////////
    const gameUpdate = () => { /Here is where faster updates should happen (e.g. entity positions, enemy movement updates)/ }
    const movementValidation = () => { /Here is where we should validate player movements and actions, when needed/ }
    const gameTick = () => { /Here is where all the world updates should happen/ }
}

export default GameManager