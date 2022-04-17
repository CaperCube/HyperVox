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
const playerNames = {
    adjective: [
        "King",
        "Crazed",
        "Cracked",
        "Good",
        "Kind",
        "Evil",
        "Bad",
        "Wrong",
        "Hollow",
        "Slimy"
    ],
    nouns: [
        "Player",
        "Stinker",
        "Wombat",
        "Salamader",
        "Buster",
        "Billy",
        "Crab",
        "Gibby",
        "Name",
        "Skater",
        "Gamer",
        "Knight"
    ]
}

const getRandomName = () => {
    var phrase = randomArray(playerNames.adjective) + " " + randomArray(playerNames.nouns)
    return phrase
}

function randomIndex(ar) {
    const min = 0
    const max = Math.floor(ar.length - 1)
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomArray(arr) {
    return arr[randomIndex(arr)]
}

export {
    debug,
    tileScale,
    defaultChunkSize,
    defaultWorldSize,
    fogDistance,
    renderScale,
    getRandomName
}