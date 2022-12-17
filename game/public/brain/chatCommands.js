import { getArrayPos } from "../common/positionUtils.js"
import { randomArray, filterChatMessageCode, clamp } from "../common/dataUtils.js"
import { gameModes } from "./brainGame.js"
import { teams } from "../common/commonConstants.js"

const commandOptions = {
    delimiter: '/', // The character the brain will look for to exicute a chat command
    comment: '~', // The character the brain will look for to ignore the message
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
                            sendMessage(`Sorry ${name}, you need to have admin privileges to do this.`, true)
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
    else if (message.startsWith(commandOptions.comment)) {
        // Say a command was found to avoid printing the message in chat
        commandFound = true
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
        // All
        if (arg === "@a") return brainGame.players
        // One Random
        else if (arg === "@r") return [randomArray(brainGame.players)]
        // All Others
        else if (arg === "@o") return brainGame.players.filter(p => p.playerID !== playerID)
        // All on Team
        else if (arg.startsWith("@t")) {
            const teamStr = arg.replace("@t", "").toLowerCase()
            const myTeam = teams[teamStr]

            if (myTeam) {
                return brainGame.players.filter(p => p.stats.team === myTeam)
            }
        }
        // Self (if applicable)
        else if (arg === "@s") return brainGame.players.filter(p => p.playerID === playerID)

        // Check matches
        else {
            // Check for ID
            const IDmatches = brainGame.players.filter(p => p.playerID === parseFloat(arg))
            if (IDmatches.length > 0) return IDmatches

            // Check for all with name
            else return brainGame.players.filter(p => p.playerName === arg)
        }
    }
    // Else get chat player
    else {
        return brainGame.players.filter(p => p.playerID === playerID)
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
        description: `Changes the name of the target player. Names must be alphanumeric with no spaces. You can also use "@r" as the new name to generate a random name. (Example: "${commandOptions.delimiter}changename [new name] [player (optional)]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (brainGame.gameOptions.chatOptions.allowPlayerNameChange || isAdmin) {
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
                            sendMessage(`No player found. Names must have no spaces.`, true)
                        }
                    }
                    else {
                        sendMessage(`Only admins can change other player's names.`, true)
                    }
                }
            }
            else {
                sendMessage(`Only admins can change player names.`, true)
            }
        }
    },
    adminLogin: {
        commands: ["adminlogin", "al"],
        admin: false,
        description: `Attempt an admin login with a passoword. (Example: "${commandOptions.delimiter}adminlogin [password]")`,
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
                    // Reset attempts
                    myPlayer.passwordAttempts = 0
                    // Set admin
                    myPlayer.isAdmin = true
                    console.log(`${myPlayer.playerName} has logged in as an admin.`)
                    // Send message
                    sendMessage(`${chatEmphasis(myPlayer.playerName)} is now an admin`)
                }
                else {
                    // log attempts
                    myPlayer.passwordAttempts++

                    // If too many attempts, kick them
                    if (myPlayer.passwordAttempts >= brainGame.gameOptions.passwordAttempts) {
                        // Tell the player they've been kicked
                        const msg = `Disconnected: You have exceeded the maximum login attempts.`
                        brainGame.brainComs.genericToClient('disconnectMessage', { message: msg }, [playerID])

                        // Disconnect this player
                        const player = brainGame.brainComs.network.SOCKET_LIST[playerID]
                        player.disconnect()
                    }

                    // Tell them they're wrong!
                    sendMessage(`Wrong password! ${brainGame.gameOptions.passwordAttempts - myPlayer.passwordAttempts} attempts left.`, true)
                }
            }
            else sendMessage(`Player not found`, true)
        }
    },
    teleport: {
        commands: ["teleport", "tp"],
        admin: true,
        description: `Teleports a player to a specified location. (Example: "${commandOptions.delimiter}tp [X] [Y] [Z] [player (optional)]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            let players = []

            //////////////////////////////////////
            // Get position
            let position
            if (args[0] && args[1] && args[2]) {
                position = {
                    x: parseFloat(args[0]),
                    y: parseFloat(args[1]),
                    z: parseFloat(args[2])
                }

                // Get Player(s)
                players = getPlayers(args[3], brainGame, playerID)
            }
            else if (args[0] && args[1]) {
                // Get only one player here, because we need a single position
                const playerPos = getPlayers(args[0], brainGame, playerID)[0]
                if (playerPos) {
                    // Deep copy the player's position
                    position = JSON.parse(JSON.stringify(playerPos.position))

                    // Get Player(s)
                    players = getPlayers(args[1], brainGame, playerID)
                }
                else {
                    // No player found, end function here
                    sendMessage(`Can't find player.`, true)
                    return
                }
            }
            else {
                // Invalid arguments
                sendMessage(`Invalid arguments.`, true)
                return
            }

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
        description: `Kills the targeted player. (Example: "${commandOptions.delimiter}kill [player (optional)]")`,
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
            else sendMessage(`No players found`, true)
        }
    },
    kick: {
        commands: ["kick"],
        admin: true,
        description: `Kicks the desired player from the game. (Example: "${commandOptions.delimiter}kick [player]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            // This command should only work in an online game
            if (brainGame.brainComs.isNetworked) {

                if (args[0]) {
                    //////////////////////////////////////
                    // Get Player(s)
                    let players = getPlayers(args[0], brainGame, playerID)
                    let playerIDs = []
                    let allPlayerNames = ''

                    players.forEach(p => { playerIDs.push(p.playerID) })
                    
                    //////////////////////////////////////
                    // Get player(s) by ID
                    for (let i = 0; i < playerIDs.length; i++) {
                        const player = brainGame.brainComs.network.SOCKET_LIST[playerIDs[i]]
                        if (player) {
                            // Put this name in a list
                            allPlayerNames += players[i]?.playerName + " "
                            
                            // Tell the player they've been kicked
                            const msg = `Disconnected: You've been kicked from the game.`
                            brainGame.brainComs.genericToClient('disconnectMessage', { message: msg }, [playerIDs[i]])

                            // Disconnect this player
                            player.disconnect()
                        }
                    }
                    const pluralHave = (playerIDs.length > 1)? 'have all' : 'has'
                    sendMessage(`${chatEmphasis(allPlayerNames)} ${pluralHave} been kicked from the game.`)
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
        description: `Makes the targeted player an admin. (Example: "${commandOptions.delimiter}admin [player]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            //////////////////////////////////////
            // Get Player(s)
            let players = getPlayers(args[0], brainGame, playerID)

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
            else sendMessage(`No players found`, true)
        }
    },
    removeAdmin: {
        commands: ["removeadmin", "deop"],
        admin: true,
        description: `Removes admin from the targeted player. (Example: "${commandOptions.delimiter}removeadmin [player]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            //////////////////////////////////////
            // Get Player(s)
            let players = getPlayers(args[0], brainGame, playerID)

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
            else sendMessage(`No players found`, true)
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
        description: `Changes your game mode. (Example: "${commandOptions.delimiter}gamemode [game mode] [player (optional)]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {

            //////////////////////////////////////
            // Get Player(s)
            let players = getPlayers(args[1], brainGame, playerID)
            
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
    ping: {
        commands: ["ping"],
        admin: false,
        description: `Puts a ping in the world at a specified location. (Example: "${commandOptions.delimiter}ping [X] [Y] [Z] [ping type (optional)]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (brainGame.gameOptions.chatOptions.allowPings || isAdmin) {
                
                const pingTypes = {default: 'default'} // ToDo: move ping types to 
                let position = null
                let type = pingTypes.default

                if (args[0] && args[1] && args[2]) {
                    // Get position
                    position = {
                        x: parseFloat(args[0]),
                        y: parseFloat(args[1]),
                        z: parseFloat(args[2])
                    }

                    // Get ping type
                    if (args[3]) {
                        const pType = args[3].toLowerCase()
                        if (Object.values(pingTypes).includes(pType)) { type = pType }
                    }
                }
                else {
                    // If no position, ping at the player's pos
                    const players = getPlayers(args[0], brainGame, playerID)

                    // Get ping type
                    if (args[1]) {
                        const pType = args[1].toLowerCase()
                        if (Object.values(pingTypes).includes(pType)) { type = pType }
                    }

                    // Ping all players
                    for (let i = 0; i < players.length; i++) {
                        if (players[i]) {
                            // Get position
                            position = {
                                x: players[i].position?.x || 0,
                                y: (players[i].position?.y || 0) + 3,
                                z: players[i].position?.z || 0
                            }

                            // Ping
                            brainGame.createPing(position, type)
                            sendMessage(`${name} placed a ping pinged at X: ${Math.round(position.x)} | Y: ${Math.round(position.y)} | Z: ${Math.round(position.z)}`)
                        }
                    }
                }

                // Create ping
                if (position) {
                    brainGame.createPing(position, type)
                    sendMessage(`${name} placed a ping pinged at X: ${Math.round(position.x)} | Y: ${Math.round(position.y)} | Z: ${Math.round(position.z)}`)
                }
                else sendMessage(`No location specified.`, true)
            }
            else {
                sendMessage(`You must be an admin to ping.`, true)  
            }
        }
    },
    changeTeam: {
        commands: ["changeteam", "cteam"],
        admin: false,
        description: `Changes the team of the targeted player. (Example: "${commandOptions.delimiter}changeteam [team] [player (optional)]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            //////////////////////////////////////
            // Get Player(s)
            let players = null
            const thisPlayer = brainGame.players.filter(p => p.playerID === playerID)[0]

            //////////////////////////////////////
            // Get Team
            let newTeam = teams["none"]
            
            //////////////////////////////////////
            // If we want a random team
            if (args[0] === "@r") {
                // Set to a random team
                // /cteam @r blue|red|yellow|green

                if (args[1]) {
                    // Get team
                    const teamList = args[1].toLowerCase().split("|")
                    newTeam = randomArray(teamList)

                    // Get players
                    players = getPlayers(args[2], brainGame, playerID)
                }
                else {
                    // You need to specify which teams could be selected
                    sendMessage(`No possible teams specified. Try something like: "${commandOptions.delimiter}changeteam @r blue|red [player]"`, true)
                }
            }
            //////////////////////////////////////
            // Else a pre-defined team
            else {
                // Get team
                newTeam = args[0]

                // Get players
                players = getPlayers(args[1], brainGame, playerID)
            }

            //////////////////////////////////////
            // Set the player's teams
            if (Object.keys(teams).includes(newTeam.toLowerCase())) {
                if (players.length > 0) {
                    for (let i = 0; i < players.length; i++) {
                        if (isAdmin || players[i] === thisPlayer) {
                            // Change this player's team
                            players[i].stats.team = teams[newTeam]
                            sendMessage(`${chatEmphasis(players[i].playerName)}'s team changed to ${chatEmphasis(newTeam)}`, true)
                        }
                        else {
                            sendMessage(`Only admins can change other player's teams.`, true)
                        }
                    }
                }
                else sendMessage(`No players found`, true)
            }
            else {
                sendMessage(`Can't find a matching team named ${newTeam}.`, true)
            }
        }
    },
    setSpawn: {
        commands: ["setspawn"],
        admin: true,
        description: `Set's the designated player's respawn point. (Example: "${commandOptions.delimiter} [X] [Y] [Z] [player (optional)]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            let players = brainGame.players.filter(p => p.playerID === playerID)
            let position = null

            // If coordinates provided
            if (args[0] && args[1] && args[2]) {
                // Get position
                position = {
                    x: parseFloat(args[0]),
                    y: parseFloat(args[1]),
                    z: parseFloat(args[2])
                }

                // Get players
                if (args[3]) {
                    players = getPlayers(args[3], brainGame, playerID)
                }
            }
            // Get position from designated player
            else if (args[0]) {
                // Get players
                const targetPlayer = getPlayers(args[0], brainGame, playerID)[0]

                if (targetPlayer) {
                    // Get position
                    position = targetPlayer.position

                    // Get players
                    if (args[1]) {
                        players = getPlayers(args[1], brainGame, playerID)
                    }
                }
                else {
                    sendMessage(`No player found.`, true)
                    return
                }
            }
            // If coordinates are NOT provided
            else {
                // Get player position
                position = players[0].position
            }

            if (position) {
                for (let i = 0; i < players.length; i++) {
                    // Set spawn
                    brainGame.brainComs.genericToClient('setSpawn', { position: position }, [players[i].playerID])
                    sendMessage(`${chatEmphasis(players[i].playerName)}'s spawn changed to: X ${position.x} | Y ${position.y} | Z ${position.z}`)
                }
            }
        }
    },
    tell: {
        commands: ["tell"],
        admin: true,
        description: `Sends only the targeted player(s) a message. (Example: "${commandOptions.delimiter}tell [player] [message]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            //////////////////////////////////////
            // Get Player(s)
            let players = getPlayers(args[0], brainGame, playerID)
            const newMessage = message.replace(`${commandOptions.delimiter}tell ${args[0]}`, '')

            if (newMessage) {
                if (players.length > 0) {
                    for (let i = 0; i < players.length; i++) {
                        // Tells this player
                        const data = { message: chatEmphasis(newMessage), nameColor: 'white', messageName: 'Server', isServer: true }
                        brainGame.brainComs.genericToClient('receiveChatMessage', data, [players[i].playerID])
                    }
                }
                else sendMessage(`No players found.`, true)
            }
            else sendMessage(`No message to send.`, true)
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
    setServerGameMode: {
        commands: ["servergamemode", "sgm"],
        admin: true,
        description: `Changes the game mode for the server. (Example: ${commandOptions.delimiter}servergamemode [game mode])`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0]) {
                let found = false
                Object.values(gameModes).forEach((gm)=>{
                    if (args[0].toLowerCase() === gm.toLowerCase()) {
                        // Set game mode
                        brainGame.gameOptions.gameMode = gm
                        // Set all player's game modes to server game mode
                        // for (let i = 0; i < brainGame.players.length; i++) brainGame.players[i].gameMode = gm
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
            else {
                // If no value set, just return the current value
                sendMessage(`The server game mode is currently ${chatEmphasis(brainGame.gameOptions.gameMode)}.`, true)
            }
        }
    },
    setTickRate: {
        commands: ["tickrate", "tr"],
        admin: true,
        description: `Sets the server's game update speed (in milliseconds). Default is 30 (Example: ${commandOptions.delimiter}tickrate [time])`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0]) {
                // Set tick rate
                const newRate = parseFloat(args[0])
                brainGame.changeGameLoopSpeed(newRate)
                // Send message
                sendMessage(`Server tick rate set to ${chatEmphasis(newRate)}ms`)
            }
            else {
                // If no value set, just return the current value
                sendMessage(`The server tick rate is currently ${chatEmphasis(brainGame.gameOptions.gameTickSpeed)}.`, true)
            }
        }
    },
    setScoreLimit: {
        commands: ["scorelimit", "setscorelimit"],
        admin: true,
        description: `Changes the game's score limit. Default is 20 (Example: "${commandOptions.delimiter}scorelimit [score]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0]) {
                // Set limit
                const newScore = parseFloat(args[0])
                brainGame.gameOptions.scoreLimit = newScore
                // Send message
                sendMessage(`The score limit has been changed to ${chatEmphasis(newScore)}.`)
            }
            else {
                // If no value set, just return the current value
                sendMessage(`The score limit is currently ${chatEmphasis(brainGame.gameOptions.scoreLimit)}.`, true)
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
    setGravity: {
        commands: ["setgravity", "gravity", "grav"],
        admin: true,
        description: `Changes the gravity of the game. Default is 8.5 (Example: "${commandOptions.delimiter}setgravity [value]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0]) {
                // Set limit
                const newVal = clamp(parseFloat(args[0]), 0, 100)
                brainGame.gameOptions.gravity = newVal

                // Set all connected player's gravity
                brainGame.brainComs.genericToClient("setGravity", {value: newVal})

                // Send message
                sendMessage(`Gravity has been changed to ${chatEmphasis(newVal)}.`)
            }
            else {
                // If no value set, just return the current value
                sendMessage(`Gravity is currently ${chatEmphasis(brainGame.gameOptions.gravity)}.`, true)
            }
        }
    },
    setJumps: {
        commands: ["setjumps", "jumps"],
        admin: true,
        description: `Changes the max number of jumps the player can before before touching the ground. Default is 2 (Example: "${commandOptions.delimiter}setjumps [value]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0]) {
                // Set limit
                const newVal = clamp(parseInt(args[0]), 0, 1000)
                brainGame.gameOptions.jumps = newVal

                // Set all connected player's max jumps
                brainGame.brainComs.genericToClient("setJumpsAllowed", {value: newVal})

                // Send message
                sendMessage(`Max jumps has been changed to ${chatEmphasis(newVal)}.`)
            }
            else {
                // If no value set, just return the current value
                sendMessage(`Max jumps is currently ${chatEmphasis(brainGame.gameOptions.jumps)}.`, true)
            }
        }
    },
    setCommandTime: {
        commands: ["commandtime", "comtime"],
        admin: true,
        description: `Changes the command block execution cooldown time (in milliseconds). Default is 1000 (Example: "${commandOptions.delimiter}commandtime [time]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0]) {
                // Set limit
                const newVal = parseInt(args[0])
                brainGame.gameOptions.commandBlockTriggerTime = newVal
                // Send message
                sendMessage(`The command trigger time has been changed to ${chatEmphasis(newVal)}.`)
            }
            else {
                // If no value set, just return the current value
                sendMessage(`The command trigger time is currently ${chatEmphasis(brainGame.gameOptions.commandBlockTriggerTime)}.`, true)
            }
        }
    },
    setChatCodeFilter: {
        commands: ["chatcodefilter", "codefilter", "ccfilter"],
        admin: true,
        description: `Enables or disables the HTML code filter in player chat messages. Default is false (Example: "${commandOptions.delimiter}codefilter [true/false]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0]) {
                let newVal = false

                // Get new value
                if (args[0].toLowerCase() === 'true') newVal = true
                else if(args[0].toLowerCase() === 'false') newVal = false
                else {
                    sendMessage(`Invalid value. Value must be "true" or "false".`, true)
                    return
                }

                // Set code filter
                brainGame.gameOptions.chatOptions.filterChatHTML = newVal
                // Send message
                sendMessage(`The chat code filter changed to ${chatEmphasis(newVal)}.`)
            }
            else {
                // If no value set, just return the current value
                sendMessage(`The chat code filter is currently ${chatEmphasis(brainGame.gameOptions.chatOptions.filterChatHTML)}.`, true)
            }
        }
    },
    setPlayerNameChange: {
        commands: ["allowchangename", "allowcname"],
        admin: true,
        description: `Enables or disables the ability for players to change their names. Default is true (Example: "${commandOptions.delimiter}allowchangename [true/false]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0]) {
                let newVal = false

                // Get new value
                if (args[0].toLowerCase() === 'true') newVal = true
                else if(args[0].toLowerCase() === 'false') newVal = false
                else {
                    sendMessage(`Invalid value. Value must be "true" or "false".`, true)
                    return
                }

                // Set value
                brainGame.gameOptions.chatOptions.allowPlayerNameChange = newVal
                // Send message
                sendMessage(`Allow player name changes is now ${chatEmphasis(newVal)}.`)
            }
            else {
                // If no value set, just return the current value
                sendMessage(`Allow player name changes is currently ${chatEmphasis(brainGame.gameOptions.chatOptions.allowPlayerNameChange)}.`, true)
            }
        }
    },
    setMaxPlayers: {
        commands: ["maxplayers"],
        admin: true,
        description: `Sets the maximum number of players that can join. Default is 16 (Example: "${commandOptions.delimiter}maxplayers [player count]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0]) {
                // Get new value
                let newVal = parseInt(args[0])
                // Set code filter
                brainGame.gameOptions.maxPlayers = newVal
                // Send message
                sendMessage(`The maximum players changed to ${chatEmphasis(newVal)}.`)
            }
            else {
                // If no value set, just return the current value
                sendMessage(`The maximum players is currently ${chatEmphasis(brainGame.gameOptions.maxPlayers)}.`, true)
            }
        }
    },
    listServerWorlds: {
        commands: ["listworlds", "lw"],
        admin: true,
        description: `Sends a list of all the world names the server has. This will only be visible to you.`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (brainGame.brainComs.isNetworked) {
                // Get world name list
                brainGame.listWorlds((worldList) => {
                    // Send message
                    for (let i = 0; i < worldList.length; i++) {
                        sendMessage(worldList[i], true)
                    }
                })
            }
            else {
                sendMessage(`This command only works in multiplayer.`, true)
            }
        }
    },
    doWorldEvent: {
        commands: ["doworldevent", "doevent", "dwe"],
        admin: true,
        description: `Triggers the designated event (Example: "${commandOptions.delimiter}doworldevent [event name]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0]) {
                // Do world event
                const eventName = brainGame.doWorldEvent(args[0])

                // Send message
                if (eventName) sendMessage(`Event ${chatEmphasis(eventName)}.`)
                else sendMessage(`Cannot find event with name ${chatEmphasis(args[0])}.`, true)
            }
            else {
                sendMessage(`No event specified.`, true)
            }
        }
    },
    setWorldEvent: {
        commands: ["setworldevent", "setevent", "swe"],
        admin: true,
        description: `Sets the designated event's command (Example: "${commandOptions.delimiter}setworldevent [event name] [event command]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0]) {
                // Compile arguments
                const commandUsed = message.trim().split(" ")[0]
                const firstArg = message.trim().split(" ")[1]
                const command = message.replace(`${commandUsed} ${firstArg} `, '')

                // Set world event
                const eventObj = brainGame.editWorldEvent(args[0], command || null)

                // Send message
                if (eventObj) sendMessage(`Event ${chatEmphasis(eventObj.name)} has a value of ${chatEmphasis(filterChatMessageCode(eventObj.command))}.`)
                else sendMessage(`Cannot find event with name ${chatEmphasis(args[0])}.`, true)
            }
            else {
                sendMessage(`No event specified.`, true)
            }
        }
    },
    createWorldEvent: {
        commands: ["createworldevent", "createevent", "cwe"],
        admin: true,
        description: `Creates an event with the designated command (Example: "${commandOptions.delimiter}createworldevent [event name] [event command]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0]) {
                // Compile arguments
                const commandUsed = message.trim().split(" ")[0]
                const firstArg = message.trim().split(" ")[1]
                const command = message.replace(`${commandUsed} ${firstArg} `, '')

                // Create world event
                const eventObj = brainGame.createWorldEvent(args[0], command || null)

                // Send message
                if (eventObj) sendMessage(`Event ${chatEmphasis(eventObj.name)} has a value of ${chatEmphasis(filterChatMessageCode(eventObj.command))}.`)
                else sendMessage(`An event with name ${chatEmphasis(args[0])} already exists.`, true)
            }
            else {
                sendMessage(`No event specified.`, true)
            }
        }
    },
    delayCommand: {
        commands: ["delaycommand", "dcommand", "dcom"],
        admin: true,
        description: `Sets a time (in milliseconds) before a designated command. (Example: "${commandOptions.delimiter}delaycommand [time] [command]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0] && args[1]) {
                // Remove first command & argument
                const commandUsed = message.trim().split(" ")[0]
                const commandStr = message.replace(`${commandUsed} ${args[0]} `, '')
                console.log(commandStr)

                // Set timeout
                setTimeout(()=>{ brainGame.runCommandString(commandStr, playerID) }, parseInt(args[0]))

                // Send message
                // sendMessage(`Command timer started.`, true)
            }
            else {
                sendMessage(`Incorrect arguments.`, true)
            }
        }
    },
    multiCommand: { // ToDo: Remove this and replace the brainCom "checkForCommand()" function with "runCommandString()"
        commands: ["multicommand", "mcommand", "mcom"],
        admin: true,
        description: `Runs a designated command and allows for multiple commands. (Example: "${commandOptions.delimiter}multicommand [command(s)]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0]) {
                // Remove first command
                const commandUsed = message.trim().split(" ")[0]
                const commandStr = message.replace(`${commandUsed} `, '')

                // Run command
                brainGame.runCommandString(commandStr, playerID)
            }
            else {
                sendMessage(`No command given.`, true)
            }
        }
    },
    
    //
    // World commands
    //
    setWorldSpawn: {
        commands: ["setworldspawn", "setwspawn", "sws"],
        admin: true,
        description: `Set's the default spawn point. (Example: "${commandOptions.delimiter} [X] [Y] [Z] [player (optional)]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            let position = null
            // If coordinates provided
            if (args[0] && args[1] && args[2]) {
                // Get position
                position = {
                    x: parseFloat(args[0]),
                    y: parseFloat(args[1]),
                    z: parseFloat(args[2])
                }
            }
            // Get position from designated player
            else if (args[0]) {
                // Get players
                const targetPlayer = getPlayers(args[0], brainGame, playerID)[0]

                if (targetPlayer) {
                    // Get position
                    position = targetPlayer.position
                }
                else {
                    sendMessage(`No player found.`, true)
                    return
                }
            }
            // If coordinates are NOT provided
            else {
                // Get player position
                const player = brainGame.players.filter(p => p.playerID === playerID)[0]
                position = player.position
            }

            if (position) {
                // Set spawn
                const location = getArrayPos(position, brainGame.world._chunkSize, brainGame.world._tileScale)
                brainGame.changeWorldSpawn(location)
                sendMessage(`World spawn changed to: X ${position.x} | Y ${position.y} | Z ${position.z}`)
            }
        }
    },
    saveWorld: {
        commands: ["saveworld"],
        admin: true,
        description: `Saves the current world on the server. (Example: "${commandOptions.delimiter}saveworld [world name]")`,
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
        description: `Generates a new world of custom size and pattern (Example: "${commandOptions.delimiter}genworld [size] [world pattern]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            let newSize = (args[0])? parseFloat(args[0]) : null
            let newPattern = (args[1])? args[1] : null

            // Create new world
            brainGame.createNewWorld( newSize, newPattern )
            // Send message
            sendMessage(`New ${newSize} sized world generated.`)
        }
    },
    loadWorld: {
        commands: ["loadworld"],
        admin: true,
        description: `Loads a world from the server's world folder (Example: "${commandOptions.delimiter}loadworld [world name]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (!brainGame.brainComs.isNetworked) {
                sendMessage(`This feature does not work for singleplayer games.`, true)
                return
            }
            if (args[0]) {
                // Load random world
                if (args[0] === '@r') {
                    brainGame.getRandomWorldName((worldName)=>{ brainGame.loadWorldFromURL( worldName, sendMessage ) })
                }

                // Load world
                else brainGame.loadWorldFromURL( args[0], sendMessage )
            }
            else {
                sendMessage(`You must provide a world name.`, true)
            }
        }
    },
    setBlock: {
        commands: ["setblock", "sblock"],
        admin: true,
        description: `Sets a block in the world to the given ID. (Example: "${commandOptions.delimiter}setblock [X] [Y] [Z] [block ID]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0] != undefined && args[1] != undefined && args[2] != undefined && args[3] != undefined)
            {
                const position = {x: parseInt(args[0]), y: parseInt(args[1]), z: parseInt(args[2])}
                const location = getArrayPos(position, brainGame.world._chunkSize, brainGame.world._tileScale)
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
        description: `Switches a block in the world to on of the two given IDs. (Example: "${commandOptions.delimiter}toggleblock [X] [Y] [Z] [block ID] [block ID]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0] != undefined && args[1] != undefined && args[2] != undefined && args[3] != undefined)
            {
                const position = {x: parseInt(args[0]), y: parseInt(args[1]), z: parseInt(args[2])}
                const location = getArrayPos(position, brainGame.world._chunkSize, brainGame.world._tileScale)
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
    },
    setBlockData: {
        commands: ["setblockdata", "sblockdata", "sbd"],
        admin: true,
        description: `Sets data for a block in the world. (Example: "${commandOptions.delimiter}setblockdata [X] [Y] [Z] ["title" or "command"] [data]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0] && args[1] && args[2] && args[3] && args[4])
            {
                const position = {x: parseInt(args[0]), y: parseInt(args[1]), z: parseInt(args[2])}
                const loc = getArrayPos(position, brainGame.world._chunkSize, brainGame.world._tileScale)
                const blockID = brainGame?.world?.worldChunks?.[loc.chunk.y]?.[loc.chunk.x]?.[loc.chunk.z]?.[loc.block.y]?.[loc.block.x]?.[loc.block.z]

                // ToDo: Move this logic to "brainGame.setBlockMetaData()"
                if (blockID) {
                    const targetBlock = `${blockID}_${position.x}_${position.y}_${position.z}`
                    
                    const dataType = args[3].toLowerCase()
                    const commandUsed = message.trim().split(" ")[0]
                    const dataStr = message.replace(`${commandUsed} ${args[0]} ${args[1]} ${args[2]} ${args[3]} `, '')

                    switch (dataType) {
                        case "title":
                            // Set block data
                            if (brainGame?.world?.blockData?.[targetBlock] !== undefined) {
                                brainGame.world.blockData[targetBlock].title = dataStr
                            }
                            else {
                                brainGame.world.blockData[targetBlock] = {title:'',command:''}
                                brainGame.world.blockData[targetBlock].title = dataStr
                            }
                            // Tell clients about the new block data
                            sendMessage(`Block title set`, true)
                            brainGame.brainComs.genericToClient('updateBlockMetaData', { blockPropName: targetBlock, data: brainGame.world.blockData[targetBlock] })
                            break
                        case "command":
                            // Set block data
                            if (brainGame?.world?.blockData?.[targetBlock] !== undefined) {
                                brainGame.world.blockData[targetBlock].command = dataStr
                            }
                            else {
                                brainGame.world.blockData[targetBlock] = {title:'',command:''}
                                brainGame.world.blockData[targetBlock].command = dataStr
                            }
                            // Tell clients about the new block data
                            sendMessage(`Block command set`, true)
                            brainGame.brainComs.genericToClient('updateBlockMetaData', { blockPropName: targetBlock, data: brainGame.world.blockData[targetBlock] })
                            break
                        default:
                            sendMessage(`Data type must be "title" or "command"`, true)
                            break
                    }
                }
                else {
                    sendMessage(`Invalid coordinate or no block here`, true)
                }
                // brainGame.updateSingleBlock(location, blockID)
                // sendMessage(`Block { X ${position.x} | Y ${position.y} | Z ${position.z} } set to ${blockID}`)
            }
            else {
                sendMessage(`Invalid arguments`, true)
            }
        }
    },
    clearBlockData: {
        commands: ["clearblockdata", "cblockdata", "cbd"],
        admin: true,
        description: `Clears all data for a block in the world. (Example: "${commandOptions.delimiter}clearblockdata [X] [Y] [Z]")`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (args[0] && args[1] && args[2])
            {
                // Get block position
                const position = {x: parseInt(args[0]), y: parseInt(args[1]), z: parseInt(args[2])}
                const posStr = `${position.x}_${position.y}_${position.z}`

                // Remove this data object
                if (brainGame?.world?.blockData) {
                    const keyMatches = Object.keys(brainGame.world.blockData).filter(k => k.includes(posStr))
                    for (let i = 0; i < keyMatches.length; i++) {
                        // Remove
                        delete brainGame.world.blockData[keyMatches[i]]

                        // Update clients
                        sendMessage(`Data removed`, true)
                        brainGame.brainComs.genericToClient('updateBlockMetaData', { blockPropName: keyMatches[i], data: null })
                    }
                }
            }
            else {
                sendMessage(`Invalid arguments`, true)
            }
        }
    },
}

export {
    commandOptions,
    chatCommands,
    checkForCommand,
}