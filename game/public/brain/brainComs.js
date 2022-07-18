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
            offlineConnect: ( data, playerID ) => {
                if (this.messageDebug) console.log('%c Connected to clientComs (brain)', 'background: #142; color: #ced')
                this.clientCom = data.clientCom
            },

            clientJoin: ( data, playerID ) => {
                if (this.messageDebug) console.log( 'Client joined game (brain)', data )
                // ToDo: check blacklist for this player & kick them
                // Store the client's player(s)
                // Send the world to the client
                // Send message to client to spawn them in a location in the world
            },

            // This will happen when the client joins the world
            createNewWorld: ( data, playerID ) => {
                if (this.messageDebug) console.log( '%c Create new world (brain)', 'background: #142; color: #ced' )
                this.brainGame.createNewWorld(data.size)
            },

            loadWorld: ( data, playerID ) => {
                if (this.messageDebug) console.log( '%c Load world (brain)', 'background: #142; color: #ced' )
                
                // ToDo: check if the player is an admin, then load
                // const myBrainPlayer = this.brainGame.players.filter( p => p.playerID === playerID )[0]
                // if (myBrainPlayer?.isAdmin) this.brainGame.loadWorld(data.world)
                this.brainGame.loadWorld(data.world)
                
            },

            updateSingleBlock: ( data, playerID ) => {
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

            movePlayer: ( data, playerID ) => {
                // updatePlayerPosition
                // if (this.messageDebug) console.log( `%c Move player ${playerId} (brain)`, 'background: #142; color: #ced', data )
                //...
                // console.log("update player pos: ", data.position)
                // this.brainGame.updatePlayerPosition(data.position)

                data.playerID = playerID

                // Update the BrainPlayer's position
                // ToDo: validate player movement when online
                const myBrainPlayer = this.brainGame.players.filter( p => p.playerID === playerID )[0]
                if (myBrainPlayer) {
                    myBrainPlayer.position = data.position
                    myBrainPlayer.rotation = data.rotation

                    // Update data packet
                    data.position = myBrainPlayer.position
                    data.rotation = myBrainPlayer.rotation
                }

                if (this.isNetworked) {
                    const recipients = "all"
                    this.network.emit( 'genericClientMessage', { type: 'movePlayer', recipients: recipients, args: data } )
                }
            },

            askWhosConnected: ( data, playerID ) => {
                if (this.messageDebug) console.log( `%c Ask who's connected ${playerID} (brain)`, 'background: #142; color: #ced', data )
                this.sayWhosConnected()
            },

            sendChatMessage: ( data, playerID ) => {
                // Check for chat commands
                const myBrainPlayer = this.brainGame.players.filter( p => p.playerID === playerID )[0]
                if (myBrainPlayer) {
                    // Use the player's name in the message
                    data.messageName = myBrainPlayer.playerName
                    // Check message for commands
                    checkForCommand(data.message, data.messageName, playerID, myBrainPlayer.isAdmin, this.brainGame, (responseMessage) => {
                        // Send message
                        const serverData = { message: responseMessage, messageName: 'Server', isServer: true }
                        if (!this.isNetworked && this.clientCom) { this.clientCom.brainMessages['receiveChatMessage']( serverData ) }
                        else if (this.isNetworked) this.network.emit( 'genericClientMessage', { type: 'receiveChatMessage', recipients: 'all', args: serverData } )
                    })
                }
                else data.messageName = ""

                // Send chat message
                if (!this.isNetworked && this.clientCom) { this.clientCom.brainMessages['receiveChatMessage']( data ) }
                else if (this.isNetworked) {
                    const recipients = "all"
                    this.network.emit( 'genericClientMessage', { type: 'receiveChatMessage', recipients: recipients, args: data } )
                }
            },

            // A player requested to fire a gun
            shootGun: ( data, playerID ) => {
                const myBrainPlayer = this.brainGame.players.filter( p => p.playerID === playerID )[0]
                // Check if player is in deathMatch mode (or if the brainGame is, if offline)
                let allowShot = false
                if ((this.isNetworked && myBrainPlayer?.gameMode === gameModes.deathMatch) || (this.brainGame.gameOptions.gameMode === gameModes.deathMatch)) {
                    allowShot = true
                }

                if (allowShot) {
                    // Tell brain to validate & update this shot
                    // if (this.messageDebug) console.log( '%c Shot validated (brain)', 'background: #142; color: #ced', data )

                    // Validate hit
                    const gunDamage = 5 // ToDo: change this based on "data.item"
                    // ToDo: actually use "checkIfShotHitAnyone()"
                    const hitPlayerID = parseFloat(data.hitPlayerID) //this.brainGame.checkIfShotHitAnyone(data, playerID)                    

                    // Send message of successful shot
                    if (hitPlayerID) {
                        // Update player
                        const hitPlayer = this.brainGame.players.filter(p => parseFloat(p.playerID) === hitPlayerID)[0]
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
                }
            },

            // ToDo: this should be removed from here, because this should not be a client-authored event
            applyObituary: ( data, playerID ) => {
                //{ deadPlayerID: deadPlayerID, killerPlayerID: killerPlayerID }
                const killerPlayer = this.brainGame.players.filter( p => p.playerID === data.killerPlayerID )[0]
                const deadPlayer = this.brainGame.players.filter( p => p.playerID === data.deadPlayerID )[0]

                // Send message
                let serverData
                    if (killerPlayer) serverData = { message: `<b style="color: ${data.killerPlayerColor};">${killerPlayer?.playerName}</b> killed <b style="color: ${data.deadPlayerColor};">${deadPlayer?.playerName}</b>`, messageName: 'Server', isServer: true }
                    else serverData = { message: `<b style="color: ${data.deadPlayerColor};">${deadPlayer?.playerName}</b> died of natural causes`, messageName: 'Server', isServer: true }
                if (!this.isNetworked && this.clientCom) { this.clientCom.brainMessages['receiveChatMessage']( serverData ) }
                else if (this.isNetworked) this.network.emit( 'genericClientMessage', { type: 'receiveChatMessage', recipients: 'all', args: serverData } )
            }
        }
    }

    ////////////////////////////////////////////////////
    // Brain to Client coms
    ////////////////////////////////////////////////////

    // Send the full world to new players
    sendFullWorld( world ) {
        console.log('%c Sending world to player... (brain)', 'background: #124; color: #cde')
        const data = { world: world }
        if (!this.isNetworked && this.clientCom) this.clientCom.brainMessages['loadSentWorld']( data )

        // Network message
        else if (this.network) {
            const recipients = [] // ToDo: only send this to newly connected players
            this.network.emit( 'genericClientMessage', { type: 'loadSentWorld', recipients: recipients, args: data } )
        }
    }

    // Tell connected players to update the chunk containing the updated block
    updateSingleBlock(location, id) {
        console.log('%c Sending single block change to all players... (brain)', 'background: #124; color: #cde')
        const data = { location: location, id: id }
        if (!this.isNetworked && this.clientCom) this.clientCom.brainMessages['updateSingleBlock']( data )

        // Network message
        else if (this.network) {
            const recipients = 'all'
            this.network.emit( 'genericClientMessage', { type: 'updateSingleBlock', recipients: recipients, args: data } )
        }
    }

    updateMultipleBlocks(locations = [], ids = []) {
        // Tell connected players to update the chunks containing the updated blocks
    }

    sayWhosConnected() {
        console.log('%c Sending player list to all players... (brain)', 'background: #124; color: #cde')
        const data = { players: this.brainGame.players }
        if (!this.isNetworked && this.clientCom) this.clientCom.brainMessages['initOtherPlayers']( data )

        // Network message
        else if (this.network) {
            const recipients = 'all'
            this.network.emit( `genericClientMessage`, { type: "initOtherPlayers", args: data } )
        }
    }

    // Other stuff that needs to be communcated to the clients

}

export default BrainComs