////////////////////////////////////////////////////
// This is that object through which all
// communcations from the brain will go to
// interface with the clients
//
// Client communications will also come
// through here first to get to the brain
////////////////////////////////////////////////////

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
                // Store the client's player(s)
                // Send the world to the client
                // Send message to client to spawn them in a location in the world
            },

            // This will happen when the client joins the world
            createNewWorld: ( data, playerId ) => {
                if (this.messageDebug) console.log( '%c Create new world (brain)', 'background: #142; color: #ced' )
                this.brainGame.createNewWorld(data.size)
            },

            updateSingleBlock: ( data, playerId ) => {
                if (this.messageDebug) console.log( '%c Update single block (brain)', 'background: #142; color: #ced', data )
                // Tell brain to validate & update this block
                this.brainGame.updateSingleBlock(data.location, data.id)
            },

            movePlayer: ( data, playerId ) => {
                if (this.messageDebug) console.log( `%c Move player ${playerId} (brain)`, 'background: #142; color: #ced', data )
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

    // Other stuff that needs to be communcated to the clients

}

export default BrainComs