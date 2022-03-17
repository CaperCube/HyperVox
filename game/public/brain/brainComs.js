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

        ////////////////////////////////////////////////////
        // Incoming messages from a client
        ////////////////////////////////////////////////////
        this.clientMessages = {

            // This is used for offline / non-networked games and should only be needed once per session
            offlineConnect: ( data, playerId ) => { this.clientCom = data.clientCom; console.log('%c Connected to clientComs (brain)', 'background: #142; color: #ced') },
            clientJoin: ( data, playerId ) => {
                console.log( 'Client joined game (brain)', data )
                // Store the client's player(s)
                // Send the world to the client
                // Send message to client to spawn them in a location in the world
            },

            // This will happen when the client joins the world
            createNewWorld: ( data, playerId ) => {
                console.log( '%c Create new world (brain)', 'background: #142; color: #ced' )
                this.brainGame.createNewWorld()
            },

            updateSingleBlock: ( data, playerId ) => { console.log( 'Update single block (brain)', data ) },

            movePlayer: ( data, playerId ) => { console.log( `move player ${playerId} (brain)`, data ) }
            //...
        }
    }

    ////////////////////////////////////////////////////
    // Brain to Client coms
    ////////////////////////////////////////////////////

    sendFullWorld( world ) {
        console.log('%c Sending world to player... (brain)', 'background: #124; color: #cde')
        if (!this.isNetworked && this.clientCom) this.clientCom.brainMessages['loadSentWorld']( { world: world } )

        // Network message
        else if (this.network) this.network.emit( 'genericClientMessage', { type: 'loadSentWorld', recipients: 'all', args: { world: world } } )
    }

    updateSingleBlock(location, id) {
        // Tell connected players to update the chunk containing the updated block
    }

    updateMultipleBlocks(locations = [], ids = []) {
        // Tell connected players to update the chunks containing the updated blocks
    }

    ////////////////////////////////////////////////////
    // Client messages (requests from clients / server)
    // ToDo: move these to `Incoming messages` above
    ////////////////////////////////////////////////////

    // This will happen when the brain / server 
    clientUpdateSingleBlock(playerId, location, id) {
        //...
    }

    // Other stuff that needs to be communcated to the clients

}

export default BrainComs