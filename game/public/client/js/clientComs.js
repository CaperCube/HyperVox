////////////////////////////////////////////////////
// This is that object through which all
// communcations from the client will go to
// interface with the server or game object
//
// Server / game communications will also come
// through here first to get to the client
////////////////////////////////////////////////////

class ClientComs {
    constructor(props = {
        isNetworked: false,
        clientGame, // The object that will send and receive information
        brainComs: null, // null when online
        host: null // The ip of the host server
    }) {
        // The object that will be the source of sent information, and the receiver of information from the host
        this.clientGame = props.clientGame

        // Determins weather a socket message needs to be sent or not
        // True: connecting to a server, False: singleplayer / local-machine only
        this.isNetworked = props.isNetworked

        // If online, this is the ip we'll connect to
        this.host = this.isNetworked? props.host : null

        // If online, this is the means of communication
        //this.socket = this.isNetworked? new scoket(this.host) : null

        // If offline, this is the object we communicate to
        this.brainComs = this.isNetworked? null : props.brain
    }

    ////////////////////////////////////////////////////
    // Client to Brain coms
    ////////////////////////////////////////////////////

    changeSingleBlock(location, id) {
        //...
    }

    ////////////////////////////////////////////////////
    // Brain messages
    ////////////////////////////////////////////////////

    // This will happen when the client joins the world
    loadEntireWorld(world) {
        //...
    }

    // This will happen when the brain / server 
    updateSingleBlock(location, id) {
        //...
    }

    // Other stuff that needs to be communcated to the game / server
    // Like:
    // moveself(newPosition, newSpeed)
    // shootAt(location, direction)
    // changeBlockState(location, state)

}