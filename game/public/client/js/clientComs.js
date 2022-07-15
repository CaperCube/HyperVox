////////////////////////////////////////////////////
// This is that object through which all
// communcations from the client will go to
// interface with the server or game object
//
// Server / game communications will also come
// through here first to get to the client
////////////////////////////////////////////////////

import { defaultWorldSize } from "./clientConstants.js"
import ClientPlayer from "./entities/player.js"

class ClientComs {
    constructor(props = {
        isNetworked: false,
        clientGame, // The object that will send and receive information
        brainComs: null, // null when online
        network: null // null when offline
    }) {
        // The object that will be the source of sent information, and the receiver of information from the host
        this.clientGame = props.clientGame

        // Determins weather a socket message needs to be sent or not
        // True: connecting to a server, False: singleplayer / local-machine only
        this.isNetworked = props.isNetworked

        // If online, this is the ip we'll connect to
        this.host = ''

        // If online, this is the means of communication
        this.network = props.network

        // If offline, this is the object we communicate to
        this.brainComs = this.isNetworked? null : props.brainComs

        // Debugging options
        this.messageDebug = true

        // Connect to brainCom if offline
        if (!this.isNetworked) this.offlineConnect(this)

        ////////////////////////////////////////////////////
        // Incoming messages from brain
        ////////////////////////////////////////////////////
        this.brainMessages = {
            updateSingleBlock: ( data, playerId ) => {
                if (this.messageDebug) console.log( '%c Update single block (client)', 'background: #142; color: #ced' )
                this.clientGame.updateBlock( data.location, data.id )
            },

            loadSentWorld: ( data, playerId ) => {
                if (this.messageDebug) console.log( '%c Load world from brain (client)', 'background: #142; color: #ced' )

                // Store world
                if (this.isNetworked) this.clientGame.clientWorld = data.world
                
                // Deep copy world
                // This has a dual purpose of providing a client copy of the world & converting a JSON world to a World() object
                this.clientGame.deepCopyWorld( data.world )
                
                // Start game
                this.clientGame.startNewGameScene()
            },

            initOtherPlayers: ( data, playerId ) => { 
                if (this.messageDebug) console.log( '%c Load other connected players from brain (client)', 'background: #142; color: #ced' )

                // Add new players
                console.log(data.players)
                for (let p = 0; p < data.players.length; p++) {
                    // If this is not my local player...
                    if (data.players[p]?.playerID !== this.clientGame.localPlayer?.playerID) {
                        // If this player doesn't already exist...
                        if (!this.clientGame.networkPlayers[p]) {
                            // Add new ClientPlayer() to scene
                            const newPlayer = new ClientPlayer(null, null, data.players[p].playerID, this.clientGame)
                            newPlayer.setPlayerName(data.players[p].playerName)
                            // Push this player to array
                            this.clientGame.networkPlayers[p] = newPlayer
                        }
                    }
                }

                // Remove non-existent players
                for (let p = 0; p < this.clientGame.networkPlayers.length; p++) {
                    let thisPlayer = this.clientGame.networkPlayers[p]
                    // If this player doesn't exist...
                    const iDMatchedPlayers = data.players.filter(dp => dp.playerID === thisPlayer?.playerID)
                    if (thisPlayer && iDMatchedPlayers.length === 0) {
                        if (thisPlayer.avatar) thisPlayer.avatar.dispose()
                        delete this.clientGame.networkPlayers[p]
                    }
                }
            },

            movePlayer: ( data, playerId ) => {
                // if (this.messageDebug) console.log( '%c Set player positions from brain (client)', 'background: #142; color: #ced' )

                // If this is not my local player...
                if (data.playerID !== this.clientGame.localPlayer?.playerID) {
                    // Get player by ID
                    const movingPlayer = this.clientGame.networkPlayers.filter(player => player.playerID === data.playerID)
                    if (movingPlayer[0]) {
                        movingPlayer[0].position = data.position
                        // ToDo: Update this when we start using the PlayerAvatar() class
                        if (movingPlayer[0].avatar) movingPlayer[0].head.rotation = data.rotation
                    }
                }
            },

            receiveChatMessage: ( data, playerId ) => {
                if (this.messageDebug) console.log( '%c Receive chat message from brain (client)', 'background: #142; color: #ced' )
                this.clientGame.displayChatMessage(data.message, data.messageName, data.nameColor, data.isServer)
            },

            updateDamagedPlayer: ( data, playerId ) => {
                if (this.messageDebug) console.log( '%c Update damaged player from brain (client)', 'background: #142; color: #ced' )
                // { hitPlayerID, damage, newHelth, newPosition }

                // Get player by ID
                let updatedPlayer = (data.hitPlayerID === this.clientGame.localPlayer?.playerID) ?
                    this.clientGame.localPlayer :
                    this.clientGame.networkPlayers.filter(player => player.playerID === data.hitPlayerID)[0]

                // Do update
                if (updatedPlayer) {
                    // ToDo: This needs to be a server-side action, not client-side
                    updatedPlayer.takeDamage(data.damage, 100, data.attackerPlayerID)
                }
            }
        }
    }

    ////////////////////////////////////////////////////
    // Connection
    ////////////////////////////////////////////////////

    // This is used to get the client connected to a networked game
    connectToNetworkedGame(ip) {
        // Remove connection to brain if it exists
        this.clientGame.removeBrain()
        //delete this.brainComs
        this.brainComs = null

        // Set `isNetworked`
        this.isNetworked = true

        // Set ip and try toconnect
        this.host = ip
        //this.socket = new socket(this.host)
    }

    ////////////////////////////////////////////////////
    // Client to Brain coms
    ////////////////////////////////////////////////////

    offlineConnect(cComs) {
        console.log('%c Offline connecting clientComs to brainComs... (client)', 'background: #124; color: #cde')
        const data = { clientCom: cComs }
        if (this.brainComs) this.brainComs.clientMessages['offlineConnect']( data )
        
        // We don't need a network message version for this since it's an offline only command
    }

    createNewWorld(size = defaultWorldSize) {
        console.log('%c Requesting new world generation... (client)', 'background: #124; color: #cde')
        const data = { size: size }
        if (!this.isNetworked && this.brainComs) {
            this.brainComs.clientMessages['createNewWorld']( data )
        }

        // Network message
        else if (this.network?.connected) this.network.emit( 'genericClientMessage', { type: 'createNewWorld', args: data } )
    }

    loadWorld(world) {
        console.log('%c Requesting world load... (client)', 'background: #124; color: #cde')
        const data = { world: world }
        if (!this.isNetworked && this.brainComs) {
            this.brainComs.clientMessages['loadWorld']( data )
        }

        // Network message
        else if (this.network?.connected) this.network.emit( 'genericClientMessage', { type: 'loadWorld', args: data } )
    }

    updateSingleBlock(location, id) {
        console.log('%c Requesting update to block... (client)', 'background: #124; color: #cde')
        const data = { location: location, id: id }
        if (!this.isNetworked && this.brainComs) this.brainComs.clientMessages['updateSingleBlock']( data )

        // Network message
        else if (this.network?.connected) this.network.emit( 'genericClientMessage', { type: 'updateSingleBlock', args: data } )
    }

    updateMyGamePosition(position, rotation) {
        // console.log('%c Sending my position... (client)', 'background: #124; color: #cde')
        const data = { position: position, rotation: rotation }
        if (!this.isNetworked && this.brainComs) this.brainComs.clientMessages['movePlayer']( data )

        // Network message
        else if (this.network?.connected) this.network.emit( 'genericClientMessage', { type: 'movePlayer', args: data } )
    }

    sendChatMessage(message, playerName, nameColor) {
        const data = { message: message, messageName: playerName, nameColor: nameColor }
        if (!this.isNetworked && this.brainComs) this.brainComs.clientMessages['sendChatMessage']( data )

        // Network message
        else if (this.network?.connected) this.network.emit( 'genericClientMessage', { type: 'sendChatMessage', args: data } )
    }

    sendShootRequest(origin, itemUsed, hitPlayerID) {
        // ToDo: Change this to support time-stamps (later we'll move this so the server checks the player's position at this time-stamp)
        // Server needs to know: player, origin, itemUsed

        const data = { origin: origin, item: itemUsed, hitPlayerID: hitPlayerID } // ToDo: Remove hitPlayerID, this check should be performed on the server
        if (!this.isNetworked && this.brainComs) this.brainComs.clientMessages['shootGun']( data )

        // Network message
        else if (this.network?.connected) this.network.emit( 'genericClientMessage', { type: 'shootGun', args: data } )
    }

    // ToDo: This should be removed because this is a server task
    sendObituary(deadPlayerID, killerPlayerID) {
        const data = { deadPlayerID: deadPlayerID, killerPlayerID: killerPlayerID, deadPlayerColor: '#ff0000', killerPlayerColor: '#00ff00'}
        if (!this.isNetworked && this.brainComs) this.brainComs.clientMessages['applyObituary']( data )
        else if (this.network?.connected) this.network.emit( 'genericClientMessage', { type: 'applyObituary', args: data } )
    }

    // Other stuff that needs to be communcated to the brain / server
    // Like:
    // moveself(newPosition, newSpeed)
    // shootAt(location, direction)
    // changeBlockState(location, state)

}

export default ClientComs