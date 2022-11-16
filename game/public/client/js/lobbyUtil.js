/////////////////////////////////////////////////////
// Lobby
/////////////////////////////////////////////////////

/**
 * Clears the lobby's contents
 * @returns null
*/
export function ClearLobbyContent() {
    const lobbyContent = $("#player-list-content")
    lobbyContent.innerHTML = ""
}

/**
 * Gets the lobby DOM by playerId
 * @param playerId: The id of the player being accessed
 * @returns { name: DOM element, kills: DOM element, deaths: DOM element, score: DOM element }
*/
export function GetLobbyDOMDataByID(playerId) {
    const formattedId = (`${playerId}`).replace(".", "")
    const playerDOM = $(`#lobby_${formattedId}`)

    if (playerDOM) {
        const playerStats = {
            name: playerDOM.querySelector('.player-name'),
            kills: playerDOM.querySelector('.player-k'),
            deaths: playerDOM.querySelector('.player-d'),
            score: playerDOM.querySelector('.player-score')
        }
        
        return playerStats
    }
    else return null
}

/**
 * Creates the lobby DOM for a player
 * @param playerData: The data of the player being created
 * @returns null
*/
export function CreateLobbyPlayerDOM(playerData) {
    const formattedId = (`${playerData.playerID}`).replace(".", "")
    const pDOMId = `lobby_${formattedId}`
    
    const pDOM = document.createElement("span")
    pDOM.className = "player-row"
    pDOM.id = pDOMId

    const pName = document.createElement("span")
    pName.className = "player-name"
    pName.innerHTML = playerData.playerName
    pName.setAttribute("title", "Copy this player's ID")
    pName.onclick = ()=>{ CopyIDFromLobbyElem(pDOM) }
    pDOM.appendChild(pName)

    const pK = document.createElement("span")
    pK.className = "player-k"
    pK.innerHTML = playerData.stats?.kills || 0
    pDOM.appendChild(pK)

    const pD = document.createElement("span")
    pD.className = "player-d"
    pD.innerHTML = playerData.stats?.deaths || 0
    pDOM.appendChild(pD)

    const pScore = document.createElement("span")
    pScore.className = "player-score"
    pScore.innerHTML = playerData.stats?.score || 0
    pDOM.appendChild(pScore)

    $("#player-list-content").appendChild(pDOM)

    console.log("Created player lobby DOM")
}

/**
 * Creates the players shown in the lobby (this is intended to be used when players join / leave a game)
 * @param playerData: The array of all connected players and their data
 * @returns null
*/
export function CreateLobbyPlayerList(playerData) {
    // Clear the current lobby contents
    ClearLobbyContent()

    // Loop through playerData and create a DOM element for each
    for (let i = 0; i < playerData.length; i++) {
        if (playerData[i]) CreateLobbyPlayerDOM(playerData[i])
    }
}

/**
 * Updates the data show in the lobby for the connected players
 * @param playerData: The array of all connected players and their data
 * @returns null
*/
export function UpdateLobbyPlayerData(playerData) {
    // Loop through playerData and update their content
    for (let i = 0; i < playerData.length; i++) {
        const pData = playerData[i]
        if (pData) {
            const playerDOM = GetLobbyDOMDataByID(pData.playerID)
            if (playerDOM) {
                playerDOM.name.innerHTML = pData.playerName
                playerDOM.kills.innerHTML = pData.stats.kills
                playerDOM.deaths.innerHTML = pData.stats.deaths
                playerDOM.score.innerHTML = pData.stats.score
            }
            else {
                CreateLobbyPlayerDOM(pData)
            }
        }
    }
}

export function CopyIDFromLobbyElem(el) {
    // Get ID from string
    const elemName = el.getAttribute('id')
    const filterText = `lobby_`
    let playerIDStr = elemName.replace(filterText, "")

    // Put period back in
    playerIDStr = playerIDStr.slice(0, 1) + "." + playerIDStr.slice(1)

    // Convert back to a number
    const playerID = parseFloat(playerIDStr)
    console.log(playerID)

    // Put in clipboard
    navigator.clipboard.writeText(playerID)
    return playerID
}