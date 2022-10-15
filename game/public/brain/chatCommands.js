import { getArrayPos } from "../common/positionUtils.js"
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
                }
                if (commandFound) break
            }
            if (commandFound) break
        }
        if (!commandFound) {
            sendMessage(`"${commandOptions.delimiter}${commandText}" is not a valid command. Type "${commandOptions.delimiter}${chatCommands.help.commands[0]}" for a the list of all commands.`)
        }
    }
    return commandFound
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
                let mes = `${player.playerName}: X: ${player.position.x} | Y: ${player.position.y} | Z: ${player.position.z}`
                sendMessage(mes)
            }
            else {
                sendMessage(`Can't find player.`)
            }
        }
    },
    changeName: {
        commands: ["changename", "cname"],
        admin: false,
        description: `Changes the name of your player.`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            // Change name
            const player = brainGame.players.filter(p => p.playerID === playerID)[0]
            if (player) {
                // ToDo: make this a function in brainGame so we can call it in other ways
                let newName = args[0] || ''
                for (let i = 1; i < args.length; i++) newName += ` ${args[i]}`

                if (newName) {
                    const oldName = player.playerName
                    player.playerName = newName

                    const data = { targetPlayerID: playerID, newName: newName }
                    brainGame.brainComs.changePlayerName(data, 0)

                    let mes = `${oldName} changed their name to ${player.playerName}`
                    sendMessage(mes)
                }
                else {
                    let mes = `That is an invalid name`
                    sendMessage(mes)
                }
            }
            else {
                sendMessage(`Can't find player.`)
            }
        }
    },
    adminLogin: {
        commands: ["adminlogin", "al"],
        admin: false,
        description: `Attempt an admin login with a passoword. (Example: ${commandOptions.delimiter}adminlogin password)`,
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
                    // Send message
                    sendMessage(`${myPlayer.playerName} is now an admin`)
                }
                else sendMessage(`Wrong password`)
            }
            else sendMessage(`Player not found`)
        }
    },

    //
    // Server commands
    //
    listAdmins: {
        commands: ["listadmins"],
        admin: false,
        description: `Lists all current admins.`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            //ToDo: add in whitelisted players who may not be online
            // Get the list of admins
            const adminList = brainGame.players.filter( p => p.isAdmin)
            let adminsString = ''
            for (let i = 0; i < adminList.length; i++) {
                adminsString += `${adminList[i].playerName}`
                if (i === adminList.length-2) adminsString += ', and '
                else if (i < adminList.length-2) adminsString += ', '
            }
            // Send message
            sendMessage(`The current admins are: ${adminsString}`)                                   
        }
    },
    endRace: {
        commands: ["endrace"],
        admin: false,
        description: `Ends the current race for you only.`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            //...
            sendMessage(`Sadly, this does not work yet :(`)
        }
    },
    changeGameMode: {
        commands: ["gamemode", "gm"],
        admin: true,
        description: `Changes your game mode. (Example: ${commandOptions.delimiter}gamemode creative)`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            const myBrainPlayer = brainGame.players.filter( p => p.playerID === playerID )[0]
            if (Object.keys(gameModes).includes(args[0])) {
                // Set game mode
                myBrainPlayer.gameMode = args[0]
                // Send message
                sendMessage(`${myBrainPlayer?.playerName} has set their game mode to ${args[0]}`)
            }
            else {
                // Send message
                sendMessage(`That is not a valid game mode`)
            }
        }
    },
    changeServerGameMode: {
        commands: ["servergamemode", "sgm"],
        admin: true,
        description: `Changes the game mode for the server and all players. (Example: ${commandOptions.delimiter}servergamemode parkour)`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (Object.values(gameModes).includes(args[0])) {
                // Set game mode
                brainGame.gameOptions.gameMode = args[0]
                // Set all player's game modes to server game mode
                for (let i = 0; i < brainGame.players.length; i++) brainGame.players[i].gameMode = args[0]
                // Send message
                sendMessage(`The server game mode has changed to ${args[0]}`)
            }
            else {
                // Send message
                sendMessage(`That is not a valid game mode`)
            }
        }
    },
    makeAdmin: {
        commands: ["admin", "op"],
        admin: true,
        description: `Makes the targeted player an admin. (Example: ${commandOptions.delimiter}admin Blocky Crab)`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            // Get player name from arguments
            let argString = ''
            for (let i = 0; i < args.length; i++) {
                argString += `${args[i]}`
                if (i < args.length-1) argString += ' '
            }

            // Set the admin status of all matching players
            const playersMatchingName = brainGame.players.filter( p => p.playerName === argString )
            if (playersMatchingName.length > 0) {
                for (let i = 0; i < playersMatchingName.length; i++) {
                    // Set admin
                    playersMatchingName[i].isAdmin = true
                    // Send message
                    sendMessage(`${playersMatchingName[i].playerName} is now an admin`)                                   
                }
            }
            else sendMessage(`Player not found`)
        }
    },
    removeAdmin: {
        commands: ["removeadmin", "deop"],
        admin: true,
        description: `Removes admin from the targeted player. (Example: ${commandOptions.delimiter}removeadmin Silly Gamer)`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            // Get player name from arguments
            let argString = ''
            for (let i = 0; i < args.length; i++) {
                argString += `${args[i]}`
                if (i < args.length-1) argString += ' '
            }

            // Set the admin status of all matching players
            const playersMatchingName = brainGame.players.filter( p => p.playerName === argString )
            if (playersMatchingName.length > 0) {
                for (let i = 0; i < playersMatchingName.length; i++) {
                    // Set admin
                    playersMatchingName[i].isAdmin = false
                    // Send message
                    sendMessage( `${playersMatchingName[i].playerName} is no longer an admin.`)                                   
                }
            }
            else sendMessage(`Player not found`)
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
                sendMessage(`Server tick rate set to ${newRate}ms`)
            }
            else {
                // Send message
                sendMessage(`You must type a value. Try something like: "${commandOptions.delimiter}tickrate 30"`)
            }
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
            if (args[0]) {
                // Load world
                brainGame.loadWorldFromURL( args[0], sendMessage )
                // Send message
                // sendMessage(`${message}`)
            }
            else {
                sendMessage(`You must provide a URL.`)
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
                sendMessage(`The score limit has been changed to ${newScore}.`)
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
    
    //
    // World commands
    //
    setWorldSpawn: {
        commands: ["setworldspawn", "setwspawn", "sws"],
        admin: true,
        description: `Set's the player's current location as the world's default spawn point.`,
        action: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            // Get player position
            const player = brainGame.players.filter(p => p.playerID === playerID)[0]
            const position = player.position

            // Set spawn
            const location = getArrayPos(position, brainGame.world._chunkSize)
            brainGame.changeWorldSpawn(location)
            sendMessage(`World spawn changed to: X ${position.x} | Y ${position.y} | Z ${position.z}`)
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
                sendMessage(`Incorrect arguments`)
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
                sendMessage(`Incorrect arguments`)
            }
        }
    }
}

export {
    commandOptions,
    checkForCommand,
}