import { gameModes } from "./brainGame.js"

const commandOptions = {
    delimiter: '/', // The character the server will look for to exicute a chat command
}

const checkForCommand = (message, name, playerID, isAdmin, brainGame, sendMessage = () => {}) => {
    if (message.startsWith(commandOptions.delimiter)) {
        // Delete the delimiter
        const args = message.slice(commandOptions.delimiter.length).trim().split(" ")
        // Convert commands to lowercase (makes the commands case-insensitive) (this also removes the command from the arguments)
        const commandText = args.shift().toLowerCase()

        // Check commands
        let commandFound = false
        for (const [key, value] of Object.entries(chatCommands)) {
            for (var i = 0; i < chatCommands[key].commands.length; i++) {
                // if command is found, exicute it
                if (commandText === chatCommands[key].commands[i] && !commandFound) {
                    commandFound = true
                    // If admin is required
                    if (chatCommands[key].admin) {
                        if (isAdmin) chatCommands[key].function(message, name, playerID, isAdmin, brainGame, args, sendMessage)
                        else {
                            // Tell them they need better priv to do this
                            sendMessage(`Sorry ${name}, you need to have admin privileges to do this.`)
                        }
                    }
                    // If admin is not required
                    else chatCommands[key].function(message, name, playerID, isAdmin, brainGame, args, sendMessage)
                }
                if (commandFound) break
            }
            if (commandFound) break
        }
        if (!commandFound) {
            sendMessage(`"${commandOptions.delimiter}${commandText}" is not a valid command. Type "${commandOptions.delimiter}${chatCommands.help.commands[0]}" for a the list of all commands.`)
        }
    }
}

const chatCommands = {
    //
    // Info commands
    //
    help: {
        commands: ["help"],
        admin: false,
        description: `Displays the available chat commands.`,
        function: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            // List all commands
            var mes = []
            let mCount = 0
            mes[mCount] = `Chat commands:`
            let maxLeng = 400
            let content = ''
            // Gather all commands
            for (const [key, value] of Object.entries(chatCommands)) {
                // Only display admin commands if the user is an admin
                const requireAdminPassed = (chatCommands[key].admin && isAdmin)
                const adminNotNeeded = !chatCommands[key].admin
                if (requireAdminPassed || adminNotNeeded) {
                    // Create message
                    const adminDescription = chatCommands[key].admin? '(ADMIN ONLY) ' : ''
                    content = `<br>${commandOptions.delimiter}${chatCommands[key].commands[0]} ${adminDescription}- ${chatCommands[key].description}`

                    // Split message into multiple messages
                    if ((mes[mCount].length + content.length) >= maxLeng) {
                        mCount++
                        mes[mCount] = `${mes[mCount]? mes[mCount] : ''}${content}`
                    }
                    else mes[mCount] = `${mes[mCount]? mes[mCount] : ''}${content}`
                }
            }
            // Send the message in parts
            for (var i = 0; i < mes.length; i++) {
                sendMessage(mes[i])
            }
        }
    },
    about: {
        commands: ["about"],
        admin: false,
        description: `Displays information about the current world.`,
        function: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            // Show info about world
            let mes = `This command should probably display information stored in the world file, but I haven't done that yet. oops! '\\_("/)_/${'`'}<br>Type "${commandOptions.delimiter}help" to see the list of commands.`
            sendMessage(mes)
        }
    },

    //
    // Server commands
    //
    listAdmins: {
        commands: ["listadmins"],
        admin: false,
        description: `Lists all current admins.`,
        function: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
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
        function: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            //...
            sendMessage(`Sadly, this does not work yet :(`)
        }
    },
    changeGameMode: {
        commands: ["gamemode", "gm"],
        admin: true,
        description: `Changes your game mode. (Example: ${commandOptions.delimiter}gamemode creative)`,
        function: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
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
        function: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
            if (Object.keys(gameModes).includes(args[0])) {
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
        function: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
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
        function: function(message, name, playerID, isAdmin, brainGame, args, sendMessage = () => {}) {
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
}

export {
    commandOptions,
    checkForCommand,
}