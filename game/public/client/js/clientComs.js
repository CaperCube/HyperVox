////////////////////////////////////////////////////
// This is that object through which all
// communcations from the client will go to
// interface with the server or game object
//
// Server / game communications will also come
// through here first to get to the client
////////////////////////////////////////////////////

import { defaultWorldSize } from "/client/js/clientConstants.js"

class ClientComs {
    constructor(props = {
        isNetworked: false,
        clientGame, // The object that will send and receive information
        brainComs: null // null when online
    }) {
        // The object that will be the source of sent information, and the receiver of information from the host
        this.clientGame = props.clientGame

        // Determins weather a socket message needs to be sent or not
        // True: connecting to a server, False: singleplayer / local-machine only
        this.isNetworked = props.isNetworked

        // If online, this is the ip we'll connect to
        this.host = ''

        // If online, this is the means of communication
        this.network// = this.isNetworked? new scoket(this.host) : null

        // If offline, this is the object we communicate to
        this.brainComs = this.isNetworked? null : props.brainComs

        // Debugging options
        this.messageDebug = true

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
                else {
                    // Deep copy world (if offline)
                    this.clientGame.deepCopyWorld( data.world )
                }
                
                // Start game
                this.clientGame.startNewGameScene()
            },
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
        else if (this.network) this.network.emit( 'genericClientMessage', { type: 'createNewWorld' } )
    }

    updateSingleBlock(location, id) {
        console.log('%c Requesting update to block... (client)', 'background: #124; color: #cde')
        const data = { location: location, id: id }
        if (!this.isNetworked && this.brainComs) this.brainComs.clientMessages['updateSingleBlock']( data )

        // Network message
        else if (this.network) this.network.emit( 'genericClientMessage', { type: 'updateSingleBlock', args: data } )
    }

    // Other stuff that needs to be communcated to the brain / server
    // Like:
    // moveself(newPosition, newSpeed)
    // shootAt(location, direction)
    // changeBlockState(location, state)

}

export default ClientComs