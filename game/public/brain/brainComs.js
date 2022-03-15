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
            updateSingleBlock: ( data, playerId ) => { console.log( 'update single block', data ) },
            movePlayer: ( data, playerId ) => { console.log( `move player ${playerId}`, data ) }
            //...
        }
    }

    ////////////////////////////////////////////////////
    // Brain to Client coms
    ////////////////////////////////////////////////////

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

    // This is used for offline / non-networked games and should only be needed once per session
    offlineConnect(clientCom) {
        this.clientCom = clientCom
    }

    // This will happen when the client joins the world
    clientJoin(playerID) {
        // Store the client's player(s)
        // Send the world to the client
        // Send message to client to spawn them in a location in the world
    }

    // This will happen when the brain / server 
    clientUpdateSingleBlock(playerID, location, id) {
        //...
    }

    // Other stuff that needs to be communcated to the clients

}

export default BrainComs