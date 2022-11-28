////////////////////////////////////////////////////
// This is that object through which all
// communcations from the brain will go to
// interface with the clients
//
// Client communications will also come
// through here first to get to the brain
////////////////////////////////////////////////////

import { gameModes } from "./brainGame.js"
import { checkForCommand, commandOptions } from "./chatCommands.js"
import { filterChatMessageCode } from "../common/dataUtils.js"
import { teams } from '../common/commonConstants.js'

class BrainComs {
    constructor(props = {
        brainGame,
        isNetworked: false,
        network
    }) {        
        // The object that will be the source of sent information
        this.brainGame = props.brainGame

        // Determins weather a socket message needs to be sent or not
        // True: connecting to a server, False: singleplayer / local-machine only
        this.isNetworked = props.isNetworked

        // If online, this is the network object we'll communicate through (i.e. socket.io)
        this.network = this.isNetworked? props.network : null

        // If offline, this is the object we communicate to
        this.clientCom// = this.isNetworked? null : props.clientCom

        // Debugging options
        this.messageDebug = true

        ////////////////////////////////////////////////////
        // Incoming messages from a client
        ////////////////////////////////////////////////////
        this.clientMessages = {

            // This is used for offline / non-networked games and should only be needed once per session
            offlineConnect: ( data, playerID = 0 ) => {
                if (this.messageDebug) console.log('%c Connected to clientComs (brain)', 'background: #142; color: #ced')
                this.clientCom = data.clientCom
            },

            clientJoin: ( data, playerID = 0 ) => {
                if (this.messageDebug) console.log( 'Client joined game (brain)', data )
                // ToDo: check blacklist for this player & kick them
                // Store the client's player(s)
                // Send the world to the client
                // Send message to client to spawn them in a location in the world
            },

            // This will happen when the client joins the world
            createNewWorld: ( data, playerID = 0 ) => {
                if (this.messageDebug) console.log( '%c Create new world (brain)', 'background: #142; color: #ced' )
                this.brainGame.createNewWorld(data.size)
            },

            loadWorld: ( data, playerID = 0 ) => {
                if (this.messageDebug) console.log( '%c Load world (brain)', 'background: #142; color: #ced' )
                
                // ToDo: check if the player is an admin, then load
                // (non-admins ahould either leave the game if they try, or prevented from loading new worlds until they leave)
                //
                // const myBrainPlayer = this.brainGame.players.filter( p => p.playerID === playerID )[0]
                // if (myBrainPlayer?.isAdmin) this.brainGame.loadWorld(data.world)
                this.brainGame.loadWorld(data.world)
                
            },

            requestWorldToSave: ( data, playerID = 0 ) => {
                if (this.messageDebug) console.log( '%c Client requested world (brain)', 'background: #142; color: #ced' )

                if (this.brainGame.world) {
                    // Send world
                    this.genericToClient('loadWorldToSave', { world: this.brainGame.world }, [playerID])
                }
            },

            updateSingleBlock: ( data, playerID = 0 ) => {
                let allowChange = false
                const myBrainPlayer = this.brainGame.players.filter( p => p.playerID === playerID )[0]
                // Check if player is in creative mode (or if the brainGame is, if offline)
                if ((this.isNetworked && myBrainPlayer?.gameMode === gameModes.creative) || (this.brainGame.gameOptions.gameMode === gameModes.creative)) {
                    allowChange = true
                }

                if (allowChange) {
                    // Tell brain to validate & update this block
                    if (this.messageDebug) console.log( '%c Update single block (brain)', 'background: #142; color: #ced', data )
                    this.brainGame.updateSingleBlock( data.location, data.id )
                }
                else {
                    // Send the server's actual block back to players
                    if (this.messageDebug) console.log( 'Player is not allowed to place or destroy blocks' )
                    const realBlock = this.brainGame.world.worldChunks
                        [data.location.chunk.y][data.location.chunk.x][data.location.chunk.z]
                        [data.location.block.y][data.location.block.x][data.location.block.z]
                    this.updateSingleBlock( data.location, realBlock )
                }
            },

            movePlayer: ( data, playerID = 0 ) => {
                // updatePlayerPosition
                // if (this.messageDebug) console.log( `%c Move player ${playerId} (brain)`, 'background: #142; color: #ced', data )
                //...
                // console.log("update player pos: ", data.position)
                // this.brainGame.updatePlayerPosition(data.position)

                data.playerID = playerID

                // Update the BrainPlayer's position
                const myBrainPlayer = this.brainGame.players.filter( p => p.playerID === playerID )[0]
                if (myBrainPlayer) {
                    // ToDo: validate player movement when online
                    //...

                    // Position
                    if (!myBrainPlayer.override) {
                        myBrainPlayer.position = data.position
                    }

                    // Rotation
                    myBrainPlayer.rotation = data.rotation
                }

                // The server automatically sends this data to clients with "brainGame.gameTick()"
            },

            askWhosConnected: ( data, playerID = 0 ) => {
                if (this.messageDebug) console.log( `%c Ask who's connected ${playerID} (brain)`, 'background: #142; color: #ced', data )
                this.sayWhosConnected()
            },

            sendChatMessage: ( data, playerID = 0 ) => {
                // Get player
                const myBrainPlayer = this.brainGame.players.filter( p => p.playerID === playerID )[0]
                let commandFound = false

                // Sanitize message
                const noContent = data.message.trim().length === 0
                let messageIsInvalid = noContent
                if (messageIsInvalid) {
                    // Do nothing
                    return
                }
                // Only apply message limit if player is not an admin
                else if (!myBrainPlayer.isAdmin) {
                    const maxLength = this.brainGame.gameOptions.chatOptions.maxChatSize
                    if (data.message.length > maxLength) data.message = data.message.substr(0, maxLength)
                }

                // Check for chat commands
                if (myBrainPlayer) {
                    // Use the player's name in the message
                    data.messageName = myBrainPlayer.playerName
                    data.nameColor = myBrainPlayer.stats.team

                    // Check message for commands
                    commandFound = checkForCommand(data.message, data.messageName, playerID, myBrainPlayer.isAdmin, this.brainGame, (responseMessage, isPrivate) => {
                        // Send message
                        const serverData = { message: responseMessage, messageName: 'Server', isServer: true }
                        this.genericToClient('receiveChatMessage', serverData, isPrivate? [playerID] : 'all')
                    })
                }
                else data.messageName = ""

                // If command not found AND no command delimiter
                if (!commandFound && !data.message.startsWith(commandOptions.delimiter)) {
                    // Check for HTML and/or js code and remove (based on server preferences)
                    if (this.brainGame.gameOptions.chatOptions.filterChatHTML) data.message = filterChatMessageCode(data.message)

                    // Send message
                    this.genericToClient('receiveChatMessage', data)

                    // Send help message if message includes "help"
                    if (data.message.toLowerCase().includes('help')) {
                        this.genericToClient('receiveChatMessage', { message: `Type <span style="color: #ffffff;">/help</span> for the list of chat commands.`, messageName: 'Server', isServer: true })
                    }
                }
            },
            
            startRace: ( data, playerID = 0 ) => {
                const myBrainPlayer = this.brainGame.players.filter( p => p.playerID === playerID )[0]
                if (myBrainPlayer && myBrainPlayer.gameMode === gameModes.parkour) {
                    // Log time for player's start time
                    if (!myBrainPlayer.startTime) {
                        myBrainPlayer.startTime = Date.now()
                    }
                }
            },

            endRace: ( data, playerID = 0 ) => {
                const myBrainPlayer = this.brainGame.players.filter( p => p.playerID === playerID )[0]
                if (myBrainPlayer && myBrainPlayer.gameMode === gameModes.parkour) {
                    if (!!myBrainPlayer.startTime) {
                        // Calculate time elapsed
                        const raceStartTime = myBrainPlayer.startTime
                        const raceEndTime = Date.now()
            
                        const diffTotal = raceEndTime - raceStartTime
                        const diffMin = Math.round(diffTotal / 60000) // minutes
                        const diffSec = Math.round((diffTotal % 60000) / 1000) // seconds
                        const diffMs = Math.round((diffTotal % 60000) % 1000) // ms

                        // Reset score and reset start time
                        myBrainPlayer.stats.score = `${diffMin}:${diffSec}:${diffMs}`
                        myBrainPlayer.startTime = 0

                        // Send message
                        const responseMessage = `<span style="padding: 5px; color: white; border: 2px solid green;"><b style="color: green;">${myBrainPlayer?.playerName}</b> has finished! Time: ${myBrainPlayer.stats.score}</span>`
                        const serverData = { message: responseMessage, messageName: 'Server', isServer: true }
                        this.genericToClient('receiveChatMessage', serverData)
                    }
                }
            },

            runBlockCommand: ( data, playerID = 0 ) => {
                // Limit how often command blocks can be run
                if (this.brainGame.commandBlockCanBeRun) {
                    // disallow further use for a time
                    this.brainGame.commandBlockCanBeRun = false
                    setTimeout(()=>{ this.brainGame.commandBlockCanBeRun = true }, this.brainGame.gameOptions.commandBlockTriggerTime)

                    // Get block reference
                    const targetBlock = `${data.blockID}_${data.blockPos.x}_${data.blockPos.y}_${data.blockPos.z}`

                    // Get command from world file based on blockID's index data
                    let blockCommand = ""
                    if (this.brainGame?.world?.blockData?.[targetBlock] !== undefined) {
                        // Run command
                        blockCommand = this.brainGame.world.blockData[targetBlock].command
                        if (blockCommand) this.brainGame.runCommandString(blockCommand, playerID)
                    }
                }
            },

            // A player requested to fire a gun
            shootGun: ( data, playerID = 0 ) => {
                // ToDo: actually use "checkIfShotHitAnyone()"
                const myBrainPlayer = this.brainGame.players.filter( p => p.playerID === playerID )[0]
                const hitPlayerID = parseFloat(data.hitPlayerID)
                const hitPlayer = this.brainGame.players.filter(p => parseFloat(p.playerID) === hitPlayerID)[0]
                
                // Check if player is in deathMatch mode (or if the brainGame is, if offline)
                let allowShot = false
                if ((this.isNetworked && myBrainPlayer?.gameMode === gameModes.deathMatch) || (this.brainGame.gameOptions.gameMode === gameModes.deathMatch)) {
                    // Check if both players are on different teams OR on no team
                    if (hitPlayer && (myBrainPlayer.stats.team === teams.none || myBrainPlayer.stats.team !== hitPlayer.stats.team)) allowShot = true
                }

                if (allowShot) {
                    // Tell brain to validate & update this shot
                    // if (this.messageDebug) console.log( '%c Shot validated (brain)', 'background: #142; color: #ced', data )

                    // Validate hit
                    let gunDamage = 0 // ToDo: change this so the server looks at the items in the common dir
                    console.log(data)
                    switch (data.item.itemName) {
                        case "Rail Gun":
                            gunDamage = 35
                            break
                        case "SMG":
                            gunDamage = 5
                            break
                        default:
                            gunDamage = 5
                            break
                    }

                    // Send message of successful shot
                    if (hitPlayer) {
                        // hitPlayer.health -= gunDamage
                        // if (hitPlayer.health <= 0) {
                        //     // ToDo: Maybe move this to BrainPlayer class?
                        //     // Respawn & reset hp
                        //     // hitPlayer.position = JSON.parse(JSON.stringify(hitPlayer.respawmPoint)) // This clones the coordinates instead of pointing to them
                        //     hitPlayer.health = 100
                        // }

                        // Send network message to update player
                        data = { hitPlayerID: hitPlayerID, damage: gunDamage, attackerPlayerID: myBrainPlayer.playerID }//, newHelth: hitPlayer.health, newPosition: hitPlayer.position }
                        // data = { message: `Player shot ${hitPlayerID}, damage for ${gunDamage}`, messageName: `Server`, isServer: true }
                        if (!this.isNetworked && this.clientCom) { this.clientCom.brainMessages['updateDamagedPlayer']( data ) }
                        else if (this.isNetworked) {
                            const recipients = "all"
                            this.network.emit( 'genericClientMessage', { type: 'updateDamagedPlayer', recipients: recipients, args: data } )
                        }
                    
                    }
                }
            },

            // ToDo: this should be removed from here, because this should not be a client-authored event
            applyObituary: ( data, playerID = 0 ) => {
                //{ deadPlayerID: deadPlayerID, killerPlayerID: killerPlayerID }
                const killerPlayer = this.brainGame.players.filter( p => p.playerID === data.killerPlayerID )[0]
                const deadPlayer = this.brainGame.players.filter( p => p.playerID === data.deadPlayerID )[0]

                this.brainGame.killPlayer(deadPlayer, killerPlayer)
            }
        }
    }

    ////////////////////////////////////////////////////
    // Brain to Client coms
    ////////////////////////////////////////////////////

    // Use this to send messages to clients, be it a online or offline game
    genericToClient( comType, data, recipients = 'all' ) {
        if (!this.isNetworked && this.clientCom) { this.clientCom.brainMessages[comType]( data ) }
        else if (this.isNetworked) {
            this.network.emit( 'genericClientMessage', { type: comType, recipients: recipients, args: data } )
        }
    }

    // Send the full world to new players
    sendFullWorld( world ) {
        console.log('%c Sending world to player... (brain)', 'background: #124; color: #cde')
        const data = { world: world }

        // Network message
        this.genericToClient('loadSentWorld', data, 'all')
    }

    // Tell connected players to update the chunk containing the updated block
    updateSingleBlock(location, id) {
        // console.log('%c Sending single block change to all players... (brain)', 'background: #124; color: #cde')
        const data = { location: location, id: id }

        // Network message
        this.genericToClient('updateSingleBlock', data)
    }

    updateMultipleBlocks(locations = [], ids = []) {
        // Tell connected players to update the chunks containing the updated blocks
    }

    sayWhosConnected() {
        console.log('%c Sending player list to all players... (brain)', 'background: #124; color: #cde')
        const data = { players: this.brainGame.players }

        // Network message
        this.genericToClient('initOtherPlayers', data)
    }

    // Other stuff that needs to be communcated to the clients
    //...

}

export default BrainComs