////////////////////////////////////////////////////
// This is that object through which all
// communcations from the brain will go to
// interface with the clients
//
// Client communications will also come
// through here first to get to the brain
////////////////////////////////////////////////////

import { gameModes } from "./brainGame.js"

class BrainComs {
    constructor(props = {
        brainGame,
        isNetworked: false,
        network
    }) {
        // The connected players who have authority of the game
        this.admins = [null]
        
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
            offlineConnect: ( data, playerId ) => {
                if (this.messageDebug) console.log('%c Connected to clientComs (brain)', 'background: #142; color: #ced')
                this.clientCom = data.clientCom
            },

            clientJoin: ( data, playerId ) => {
                if (this.messageDebug) console.log( 'Client joined game (brain)', data )
                // ToDo: check blacklist for this player & kick them
                // Store the client's player(s)
                // Send the world to the client
                // Send message to client to spawn them in a location in the world
            },

            // This will happen when the client joins the world
            createNewWorld: ( data, playerId ) => {
                if (this.messageDebug) console.log( '%c Create new world (brain)', 'background: #142; color: #ced' )
                this.brainGame.createNewWorld(data.size)
            },

            loadWorld: ( data, playerId ) => {
                if (this.messageDebug) console.log( '%c Load world (brain)', 'background: #142; color: #ced' )
                // ToDo: Check if the player is an admin, if so, allow change
                // if (playerId && this.brainGame.admins.includes(playerId)) this.brainGame.loadWorld(data.world)
                this.brainGame.loadWorld(data.world)
                
            },

            updateSingleBlock: ( data, playerId ) => {
                // ToDo: Check for server's game-mode AND player's game-mode (both should be stored on the server) (server's game-mode is the default)
                if (this.brainGame.gameOptions.gameMode === gameModes.creative) {
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

            movePlayer: ( data, playerId ) => {
                // updatePlayerPosition
                // if (this.messageDebug) console.log( `%c Move player ${playerId} (brain)`, 'background: #142; color: #ced', data )
                //...
                // console.log("update player pos: ", data.position)
                // this.brainGame.updatePlayerPosition(data.position)
                data.playerID = playerId

                if (this.isNetworked) {
                    const recipients = "all"
                    this.network.emit( 'genericClientMessage', { type: 'movePlayer', recipients: recipients, args: data } )
                }
            },

            askWhosConnected: ( data, playerId ) => {
                if (this.messageDebug) console.log( `%c Ask who's connected ${playerId} (brain)`, 'background: #142; color: #ced', data )
                this.sayWhosConnected()
            },

            sendChatMessage: ( data, playerId ) => {
                // ToDo: get player name from brain's player list and use that
                // data.playerID = playerId

                if (this.isNetworked) {
                    const recipients = "all"
                    this.network.emit( 'genericClientMessage', { type: 'receiveChatMessage', recipients: recipients, args: data } )
                }
            }
            //...
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