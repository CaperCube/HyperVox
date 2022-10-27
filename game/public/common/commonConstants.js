import { randomArray } from './dataUtils.js'

// Game constants
const gameModes = {
    creative: 'creative',
    spectator: 'spectator',
    parkour: 'parkour',
    deathMatch: 'deathmatch',
    teamDeathMatch: 'teamDeathMatch',
}

// Player constants
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
        "Slimy",
        "Blocky",
        "Cubic",
        "Soccer",
        "Meh"
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
        "Gamer",
        "Knight",
        "Dog",
        "Cat",
        "Scope",
        "Tap",
        "Fart",
        "Block",
        "Android",
        "Robot",
        "Snake",
        "NPC",
        "Doctor",
        "Sock"
    ]
}

const getRandomName = () => {
    var phrase = randomArray(playerNames.adjective) + " " + randomArray(playerNames.nouns)
    return formatPlayerName(phrase)
}

// Formatting for player names
const formatPlayerName = (playerName) => {
    // Only allow alphanumeric
    let returnName = playerName.replace(/[^a-z0-9]/gi, "")

    return returnName || "player"
}

export {
    gameModes,
    getRandomName,
    formatPlayerName
}