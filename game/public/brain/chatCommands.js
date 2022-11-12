import { getArrayPos } from "../common/positionUtils.js"
import { randomArray } from "../common/dataUtils.js"
import { gameModes } from "./brainGame.js"

const commandOptions = {
    delimiter: '/', // The character the server will look for to exicute a chat command
    maxLength: 2000, // The maximum allowed characters in a single server message
}

const checkForCommand = (message, name, playerID, isAdmin, brainGame, sendMessage = () => {}) => {
    let commandFound = false
    
    if (message.startsWith(commandOptions.delimiter)) {
        // Delete the delimiter
        const args = message.slice(commandOptions.delimiter.length).trim().split(" ")
        // Convert commands to lowercase (makes the commands case-insensitive) (this also removes the command from the arguments)
        const commandText = args.shift().toLowerCase()

        // Check commands
        for (const [key, value] of Object.entries(chatCommands)) {
            for (var i = 0; i < chatCommands[key].commands.length; i++) {
                // if command is found, exicute it
                if (commandText === chatCommands[key].commands[i] && !commandFound) {
                    commandFound = true
                    // If admin is required
                    if (chatCommands[key].admin) {
                        if (isAdmin) chatCommands[key].action(message, name, playerID, isAdmin, brainGame, args, sendMessage)
                        else {
                            // Tell them they need better priv to do this
                            sendMessage(`Sorry ${name}, you need to have admin privileges to do this.`)
                        }
                    }
                    // If admin is not required
                    else chatCommands[key].action(message, name, playerID, isAdmin, brainGame, args, sendMessage)

                    // Stop the loop here
                    return commandFound
                }
                if (commandFound) break
            }
            if (commandFound) break
        }
        if (!commandFound) {
            sendMessage(`"${commandOptions.delimiter}${commandText}" is not a valid command. Type "${commandOptions.delimiter}${chatCommands.help.commands[0]}" for a the list of all commands.`, true)
        }
    }
    return commandFound
}

const chatEmphasis = (text) => {
    return `<span style="color: white;">${text}</span>`
}

const getPlayers = (arg, brainGame, playerID = null) => {
    let players = []

    // Check for "@a" or "@r"
    if (arg) {
        // If all players targeted
        if (arg === "@a") players = brainGame.players
        else if (arg === "@r") players[0] = randomArray(brainGame.players)

        // Check for name
        else players = brainGame.players.filter(p => p.playerName === arg)
    }
    // Else get chat player
    else {
        players[0] = brainGame.players.filter(p => p.playerID === playerID)[0]
    }

    return players
}

const chatCommands = {
    //
    // Info commands
    //
    help: {
        commands: ["help"],
        admin: false,
        description: `Displays the available chat commands.`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            // List all commands
            var mes = []
            let mCount = 0
            mes[mCount] = `Chat commands:`
            let content = ''
            // Gather all commands
            for (const [key, value] of Object.entries(chatCommands)) {
                // Only display admin commands if the user is an admin
                const requireAdminPassed = (chatCommands[key].admin && isAdmin)
                const adminNotNeeded = !chatCommands[key].admin
                if (requireAdminPassed || adminNotNeeded) {
                    // Create message
                    const adminDescription = chatCommands[key].admin? `<span style="color: #aa1133;">(ADMIN ONLY)</span> ` : ''
                    content = `<br>${commandOptions.delimiter}<span style="color: #ffffff;">${chatCommands[key].commands[0]}</span> ${adminDescription}- ${chatCommands[key].description}`

                    // Split message into multiple messages
                    if ((mes[mCount].length + content.length) >= commandOptions.maxLength) {
                        mCount++
                        mes[mCount] = `${mes[mCount]? mes[mCount] : ''}${content}`
                    }
                    else mes[mCount] = `${mes[mCount]? mes[mCount] : ''}${content}`
                }
            }
            // Send the message in parts
            for (var i = 0; i < mes.length; i++) {
                sendMessage(mes[i], true)
            }
        }
    },
    about: {
        commands: ["about"],
        admin: false,
        description: `Displays information about the current world.`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            // Show info about world
            let mes = `This command should probably display information stored in the world file, but I haven't done that yet. oops! '\\_("/)_/${'`'}<br>Type "${commandOptions.delimiter}help" to see the list of commands.`
            sendMessage(mes, true)
        }
    },

    //
    // Player commands
    //
    myPosition: {
        commands: ["myposition", "mypos", "mpos"],
        admin: false,
        description: `Displays your position in the game's chat.`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            // Show position
            const player = brainGame.players.filter(p => p.playerID === playerID)[0]
            if (player) {
                let mes = `${chatEmphasis(player.playerName)}: X: ${player.position.x} | Y: ${player.position.y} | Z: ${player.position.z}`
                sendMessage(mes)
            }
            else {
                sendMessage(`Can't find player.`, true)
            }
        }
    },
    changeName: {
        commands: ["changename", "cname"],
        admin: false,
        description: `Changes the name of the target player. Names must be alphanumeric with no spaces. (Example: ${commandOptions.delimiter}changename <new name> <player name (optional)>)`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            //////////////////////////////////////
            // Get Player(s)
            let players = getPlayers(args[1], brainGame, playerID)
            const thisPlayer = brainGame.players.filter(p => p.playerID === playerID)[0]

            for (let i = 0; i < players.length; i++) {
                if (isAdmin || players[i] === thisPlayer) {
                    // Change name
                    if (players[i]) {
                        // Tell brain to change the name
                        brainGame.changePlayerName(players[i], args[0])
                    }
                    else {
                        sendMessage(`No player found. Name must have no spaces.`, true)
                    }
                }
                else {
                    sendMessage(`Only admins can change other player's names.`, true)
                }
            }
        }
    },
    adminLogin: {
        commands: ["adminlogin", "al"],
        admin: false,
        description: `Attempt an admin login with a passoword. (Example: ${commandOptions.delimiter}adminlogin <password>)`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            // Set the admin status of all matching players
            const myPlayer = brainGame.players.filter( p => p.playerID === playerID )?.[0]
            if (myPlayer) {
                // Get password from args
                let argString = ''
                for (let i = 0; i < args.length; i++) {
                    argString += `${args[i]}`
                    if (i < args.length-1) argString += ' '
                }

                // Check password
                if (brainGame.adminPassword && argString === brainGame.adminPassword) {
                    // Set admin
                    myPlayer.isAdmin = true
                    console.log(`${myPlayer.playerName} has logged in as an admin.`)
                    // Send message
                    sendMessage(`${chatEmphasis(myPlayer.playerName)} is now an admin`)
                }
                else sendMessage(`Wrong password`, true)
            }
            else sendMessage(`Player not found`, true)
        }
    },
    teleport: {
        commands: ["teleport", "tp"],
        admin: true,
        description: `Teleports a player to a specified location. (Example: ${commandOptions.delimiter}tp <X> <Y> <Z> <player name (optional)>)`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            //////////////////////////////////////
            // Get position
            let position
            if (args[0] && args[1] && args[2]) {
                position = {
                    x: parseFloat(args[0]),
                    y: parseFloat(args[1]),
                    z: parseFloat(args[2])
                }
            }
            else {
                // Invalid arguments
                sendMessage(`Invalid arguments.`, true)
                return
            }
            
            //////////////////////////////////////
            // Get Player(s)
            let players = getPlayers(args[3], brainGame, playerID)

            //////////////////////////////////////
            // Move this player if they exist
            for (let i = 0; i < players.length; i++) {
                if (players[i]) {
                    // Set position & override
                    players[i].override = true
                    players[i].position = position

                    // Send message
                    sendMessage(`${chatEmphasis(players[i].playerName)} teleported to X: ${position.x} | Y: ${position.y} | Z: ${position.z}`)
                }
                else {
                    sendMessage(`Can't find player.`, true)
                }
            }
        }
    },
    kill: {
        commands: ["kill"],
        admin: true,
        description: `Kills the targeted player. (Example: ${commandOptions.delimiter}kill <player name (optional)>)`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            //////////////////////////////////////
            // Get Player(s)
            let players = getPlayers(args[0], brainGame, playerID)

            if (players.length > 0) {
                for (let i = 0; i < players.length; i++) {
                    // Kill this player
                    brainGame.killPlayer(players[i])
                }
            }
            else sendMessage(`No player not found`, true)
        }
    },
    kick: {
        commands: ["kick"],
        admin: true,
        description: `Kicks the desired player from the game. (Example: ${commandOptions.delimiter}kick <player name>`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            // This command should only work in an online game
            if (brainGame.brainComs.isNetworked) {

                if (args[0]) {
                    //////////////////////////////////////
                    // Get Player(s)
                    let players = getPlayers(args[0], brainGame)
                    
                    //////////////////////////////////////
                    // Get player(s) by ID
                    for (let i = 0; i < players.length; i++) {
                        const player = brainGame.brainComs.network.SOCKET_LIST[players[i]?.playerID]
                        const playerName = players[i]?.playerName || '???'
                        if (player) {
                            // Disconnect this player
                            player.disconnect()
                            sendMessage(`${chatEmphasis(playerName)} has been kicked from the game.`, true)
                        }
                        else {
                            sendMessage(`Can't find player named ${args[0]}.`, true)
                        }
                    }
                }
                else {
                    sendMessage(`You can't kick nobody.`, true)
                }
            }
        }
    },
    makeAdmin: {
        commands: ["admin", "op"],
        admin: true,
        description: `Makes the targeted player an admin. (Example: ${commandOptions.delimiter}admin <player name>)`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            //////////////////////////////////////
            // Get Player(s)
            let players = getPlayers(args[0], brainGame)

            if (players.length > 0) {
                for (let i = 0; i < players.length; i++) {
                    if (!players[i].isAdmin) {
                        // Set admin
                        players[i].isAdmin = true
                        // Send message
                        sendMessage(`${chatEmphasis(players[i].playerName)} is now an admin`)
                    }
                    else {
                        sendMessage(`${chatEmphasis(players[i].playerName)} is already an admin`, true)
                    }                              
                }
            }
            else sendMessage(`No player not found`, true)
        }
    },
    removeAdmin: {
        commands: ["removeadmin", "deop"],
        admin: true,
        description: `Removes admin from the targeted player. (Example: ${commandOptions.delimiter}removeadmin <player name>)`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            //////////////////////////////////////
            // Get Player(s)
            let players = getPlayers(args[0], brainGame)

            if (players.length > 0) {
                for (let i = 0; i < players.length; i++) {
                    if (players[i].isAdmin) {
                        // Set admin
                        players[i].isAdmin = false
                        // Send message
                        sendMessage(`${chatEmphasis(players[i].playerName)} is no longer admin`)
                    }
                    else {
                        sendMessage(`${chatEmphasis(players[i].playerName)} is already a commoner`, true)
                    }                              
                }
            }
            else sendMessage(`No player not found`, true)
        }
    },
    listAdmins: {
        commands: ["listadmins"],
        admin: false,
        description: `Lists all current admins.`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            // ToDo: add in whitelisted players who may not be online
            // Get the list of admins
            const adminList = brainGame.players.filter( p => p.isAdmin)
            let adminsString = ''
            for (let i = 0; i < adminList.length; i++) {
                adminsString += `${chatEmphasis(adminList[i].playerName)}`
                if (i === adminList.length-2) adminsString += ', and '
                else if (i < adminList.length-2) adminsString += ', '
            }
            // Send message
            sendMessage(`The current admins are: ${adminsString}`, true)                                   
        }
    },
    changeGameMode: {
        commands: ["gamemode", "gm"],
        admin: true,
        description: `Changes your game mode. (Example: ${commandOptions.delimiter}gamemode <game mode> <player name (optional)>)`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {

            //////////////////////////////////////
            // Get Player(s)
            let players = getPlayers(args[1], brainGame, playerID)
            // const myBrainPlayer = brainGame.players.filter( p => p.playerID === playerID )[0]
            
            //////////////////////////////////////
            // Change game mode for all matching players
            for (let i = 0; i < players.length; i++) {
                // If this player exists...
                if (players[i]) {
                    let found = false
                    Object.values(gameModes).forEach((gm)=>{
                        if (args[0].toLowerCase() === gm.toLowerCase()) {
                            // Set game mode
                            players[i].gameMode = gm
                            // Send message
                            sendMessage(`${chatEmphasis(players[i]?.playerName)}'s game mode has changed to ${chatEmphasis(gm)}`)
                            // end function here
                            found = true
                            return
                        }
                    })

                    // No matching game modes found
                    if (!found) sendMessage(`That is not a valid game mode`, true)
                }
            }
        }
    },

    //
    // Server commands
    //
    endRace: {
        commands: ["endrace"],
        admin: false,
        description: `Ends the current race for you only.`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            //...
            sendMessage(`Sadly, this does not work yet :(`, true)
        }
    },
    changeServerGameMode: {
        commands: ["servergamemode", "sgm"],
        admin: true,
        description: `Changes the game mode for the server and all players. (Example: ${commandOptions.delimiter}servergamemode <game mode>)`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            let found = false
            Object.values(gameModes).forEach((gm)=>{
                if (args[0].toLowerCase() === gm.toLowerCase()) {
                    // Set game mode
                    brainGame.gameOptions.gameMode = gm
                    // Set all player's game modes to server game mode
                    for (let i = 0; i < brainGame.players.length; i++) brainGame.players[i].gameMode = gm
                    // Send message
                    sendMessage(`The server game mode has changed to ${chatEmphasis(gm)}`)

                    // end function here
                    found = true
                    return
                }
            })

            // No matching game modes found
            if (!found) sendMessage(`That is not a valid game mode`, true)
        }
    },
    changeTickRate: {
        commands: ["tickrate", "tr"],
        admin: true,
        description: `Sets the server's game update speed. (Example: ${commandOptions.delimiter}tickrate 30)`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0]) {
                // Set tick rate
                const newRate = parseFloat(args[0])
                brainGame.changeGameLoopSpeed(newRate)
                // Send message
                sendMessage(`Server tick rate set to ${chatEmphasis(newRate)}ms`)
            }
            else {
                // Send message
                sendMessage(`You must type a value. Try something like: "${commandOptions.delimiter}tickrate 30"`, true)
            }
        }
    },
    setScoreLimit: {
        commands: ["scorelimit", "setscorelimit"],
        admin: true,
        description: `Changes the game's score limit (Example: "${commandOptions.delimiter}scorelimit 20")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0]) {
                // Set limit
                const newScore = parseFloat(args[0])
                brainGame.gameOptions.scoreLimit = newScore
                // Send message
                sendMessage(`The score limit has been changed to ${chatEmphasis(newScore)}.`)
            }
        }
    },
    resetScores: {
        commands: ["resetscores", "clearscores"],
        admin: true,
        description: `Resets all connected player's stats to 0 (Example: "${commandOptions.delimiter}resetScores")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            // Reset scores
            brainGame.resetScores()
            // Send message
            sendMessage(`All player scores have been reset.`)
        }
    },
    setCommandTime: {
        commands: ["commandtime", "comtime"],
        admin: true,
        description: `Changes the command block execution cooldown time (in milliseconds). (Example: "${commandOptions.delimiter}commandtime 1000")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0]) {
                // Set limit
                const newVal = parseInt(args[0])
                brainGame.gameOptions.commandBlockTriggerTime = newVal
                // Send message
                sendMessage(`The command trigger time has been changed to ${chatEmphasis(newVal)}.`)
            }
        }
    },
    
    //
    // World commands
    //
    setWorldSpawn: {
        commands: ["setworldspawn", "setwspawn", "sws"],
        admin: true,
        description: `Set's the player's current location as the world's default spawn point.`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            // If coordinates provided
            if (args[0] && args[1] && args[2]) {
                // Get position
                const position = {
                    x: parseFloat(args[0]),
                    y: parseFloat(args[1]),
                    z: parseFloat(args[2])
                }
                const location = getArrayPos(position, brainGame.world._chunkSize)
                brainGame.changeWorldSpawn(location)
                sendMessage(`World spawn changed to: X ${position.x} | Y ${position.y} | Z ${position.z}`)
            }
            // If coordinates are NOT provided
            else {
                // Get player position
                const player = brainGame.players.filter(p => p.playerID === playerID)[0]
                const position = player.position

                // Set spawn
                const location = getArrayPos(position, brainGame.world._chunkSize)
                brainGame.changeWorldSpawn(location)
                sendMessage(`World spawn changed to: X ${position.x} | Y ${position.y} | Z ${position.z}`)
            }
        }
    },
    saveWorld: {
        commands: ["saveworld"],
        admin: true,
        description: `Saves the current world on the server. (Example: "${commandOptions.delimiter}saveworld <world name>")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            // Get world name
            let newName = args[0] || ''
            for (let i = 1; i < args.length; i++) newName += ` ${args[i]}`

            // Save
            brainGame.saveWorld((worldName) => {                
                if (worldName) {
                    // Save world on server
                    sendMessage(`World "${worldName}" saved!`)
                }
                else {
                    // Else, the game is saving on the client
                    sendMessage(`Saving on client`)
                }
            }, newName)
        }
    },
    generateNewWorld: {
        commands: ["genworld"],
        admin: true,
        description: `Generates a new world of custom size and pattern (Example: "${commandOptions.delimiter}genworld 8 lavaPlanet")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0]) {
                // Set generator props
                const newSize = (args[0])? parseFloat(args[0]) : 4
                const newPattern = (args[1])? args[1] : 'basic'
                // Create new world
                brainGame.createNewWorld( newSize, newPattern )
                // Send message
                sendMessage(`New ${newSize} sized world generated.`)
            }
        }
    },
    loadWorldUrl: {
        commands: ["loadworld"],
        admin: true,
        description: `Loads a world from a URL (Example: "${commandOptions.delimiter}loadworld www.capercore.com/world.json")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (!brainGame.brainComs.isNetworked) {
                sendMessage(`This feature is disabled for singleplayer games until we fix it.`, true)
                return
            }
            if (args[0]) {
                // Load world
                brainGame.loadWorldFromURL( args[0], sendMessage )
                // Send message
                // sendMessage(`${message}`)
            }
            else {
                sendMessage(`You must provide a world name.`, true)
            }
        }
    },
    setBlock: {
        commands: ["setblock", "sblock"],
        admin: true,
        description: `Sets a block in the world to the given ID. (Example: "/setblock X Y Z ID")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0] != undefined && args[1] != undefined && args[2] != undefined && args[3] != undefined)
            {
                const position = {x: parseInt(args[0]), y: parseInt(args[1]), z: parseInt(args[2])}
                const location = getArrayPos(position, brainGame.world._chunkSize)
                const blockID = parseInt(args[3])
                brainGame.updateSingleBlock(location, blockID)
                // sendMessage(`Block { X ${position.x} | Y ${position.y} | Z ${position.z} } set to ${blockID}`)
            }
            else {
                sendMessage(`Invalid arguments`, true)
            }
        }
    },
    toggleBlock: {
        commands: ["toggleblock", "tblock"],
        admin: true,
        description: `Switches a block in the world to on of the two given IDs. (Example: "/toggleblock X Y Z ID1 ID2")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0] != undefined && args[1] != undefined && args[2] != undefined && args[3] != undefined)
            {
                const position = {x: parseInt(args[0]), y: parseInt(args[1]), z: parseInt(args[2])}
                const location = getArrayPos(position, brainGame.world._chunkSize)
                const blockID1 = parseInt(args[3])
                const blockID2 = parseInt(args[4] || 0)

                // Check if this block is on of the ID's already
                const blockHereId = parseInt(brainGame.world.worldChunks?.[location.chunk.y]?.[location.chunk.x]?.[location.chunk.z]?.[location.block.y]?.[location.block.x]?.[location.block.z] || 0)
                if (blockHereId === blockID1) brainGame.updateSingleBlock(location, blockID2)
                else if (blockHereId === blockID2) brainGame.updateSingleBlock(location, blockID1)
                else brainGame.updateSingleBlock(location, blockID1)

                // brainGame.updateSingleBlock(location, blockID1)
                // sendMessage(`Block { X ${position.x} | Y ${position.y} | Z ${position.z} } set to ${blockID1} or ${blockID2}`)
            }
            else {
                sendMessage(`Invalid arguments`, true)
            }
        }
    }
}

export {
    commandOptions,
    chatCommands,
    checkForCommand,
}