/////////////////////////////////////////////////////////
// The constants the are applicable to the client
// i.e. rendering, sizing, graphics, framerate, etc...
/////////////////////////////////////////////////////////

// Debug vars
// ToDo: use these
// ToDo: make these variable so they can be changed in-game
const debug = {
    debgMode: true,
    consoleLogs: true
}

// Consider including chunk scale in here as well
const tileScale = 1
const defaultChunkSize = 8
const defaultWorldSize = 10

const fogDistance = 1000
const renderScale = 1

// Player vars
// ToDo: Modify this to be a random name generator (e.g. [adv][adj][noun])
const playerNames = [
    "Player",
    "Stinker",
    "Wombat",
    "Salamader Sam",
    "Buster",
    "Billy",
    "King Crab",
    "Crazy",
    "Cracked",
    "Gibby",
    "Huh What?",
    "Good Name",
    "Bad Name"
]

export {
    debug,
    tileScale,
    defaultChunkSize,
    defaultWorldSize,
    fogDistance,
    renderScale
}