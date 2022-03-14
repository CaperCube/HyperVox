import { tileScale, defaultWorldSize } from './clientConstants.js'
import BrainGame from '../../brain/brainGame.js'
import MeshGenerator from './mesh/meshGen.js'
import ClientPlayer from './entities/player.js'

// This will be in charge of all client interactions, (should rendering / `BABYLON.scene` creation be seperate?)
class ClientGame {
    constructor(props = {
        isNetworked: false
    }) {
        // The brain for the game, null if online
        // Also if offline, the brain needs a brainComs to talk to a client
        this.brain = props.isNetworked? null : new BrainGame({
            isNetworked: false,
            network: null
        })

        // The communcaiton layer for this client
        this.clientComs = new ClientComs({
            isNetworked: props.isNetworked,
            clientGame: this,
            brainComs: this.brain.brainComs || null
        })

        if (!isNetworked) this.brain.brainComs.offlineConnect(this.clientComs)

        // The client's copy of the world, this will be used for colission, meshGen, and meshUpdates
        this.clientWorld

        // The main viewport camera
        this.mainCamera

        // The client's main player (this may need to be adjusted to more easily allow for multiple local players)
        this.localPlayer = new ClientPlayer()

        //this.debugLines, utilLayer, crosshair, skybox, stars, stars2

        // The rendering engine
        //this.engine = new BABYLON.Engine()
    }

    ///////////////////////////////////////////////////////
    // Methods
    ///////////////////////////////////////////////////////
    //...

    // This is used when switching to an online session
    removeBrain() {
        // Save first?
        // Remove brain from memory
        //delete this.brain
        this.brain = null
        this.clientWorld = null
    }

    ///////////////////////////////////////////////////////
    // Loops
    ///////////////////////////////////////////////////////
    networkUpdate = () => { /* Here is where scheduled network messages should send */ }
}

export default ClientGame