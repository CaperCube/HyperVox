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
const tileScale = 1 // Do not change this
const defaultChunkSize = 8
const defaultWorldSize = 10

const fogDistance = 1000
const renderScale = 1

// Local storage keys
const lsKeys = { 
    clientSettings: 'clientSettings',
}

export {
    debug,
    tileScale,
    defaultChunkSize,
    defaultWorldSize,
    fogDistance,
    renderScale,
    lsKeys
}