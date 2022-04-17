import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js"
import BrainGame from '../../brain/brainGame.js'
import ClientComs from './clientComs.js'
import { tileScale, defaultChunkSize, defaultWorldSize, fogDistance, renderScale } from './clientConstants.js'
import { getArrayPos } from '../../common/positionUtils.js'
import ClientPlayer from './entities/player.js'
import MeshGenerator from './mesh/meshGen.js'
import DefaultScene from "./defaultScene.js"
import World from '../../brain/gen/world/world.js'
import MenuSystem from './menuSystem.js'

// This will be in charge of all client interactions, (should rendering / `BABYLON.scene` creation be seperate?)
class ClientGame {
    constructor(props = {
        isNetworked: false,
        canvas: null
    }) {
        // The brain for the game, null if online
        // Also if offline, the brain needs a brainComs to talk to a client
        this._brain = props.isNetworked? null : new BrainGame({
            isNetworked: false,
            network: null
        })

        // The communcaiton layer for this client
        this.clientComs = new ClientComs({
            isNetworked: props.isNetworked,
            clientGame: this,
            brainComs: this._brain?.brainComs || null
        })

        // The client and brain should have their own copies of the world chunk data
        // This helps with:
        //     - Reliable client-side colissions
        //     - Comparing what blocks in a chunk have changed when updating meshes
        //     - Treating the brain like a server

        // The client's copy of the world, this will be used for colission, meshGen, and meshUpdates
        this.clientWorld

        ///////////////////////////////////////////////////////
        // Player vars
        ///////////////////////////////////////////////////////

        // The main viewport camera
        this.mainCamera
        this.utilLayer
        this.mainCrosshair
        this.mainInv // ToDo: Replace this with a better UI system

        // The client's main player (this may need to be adjusted to more easily allow for multiple local players)
        this.localPlayer
        this.clientID = 0 // ToDo: make this support local players as well

        // The other players on the network each should get a ClientPlayer that will be updated by the network
        this.networkPlayers = []

        ///////////////////////////////////////////////////////
        // Engin vars
        ///////////////////////////////////////////////////////

        this.canvas = props.canvas
        this.engine = new BABYLON.Engine(this.canvas, false)
        this.frame = 0
        this.scene

        // mesh helper object
        this.meshGen = new MeshGenerator()
        this.chunkWorker = new Worker('./client/js/mesh/chunkMeshWorker.js', {type: 'module'})
        this.chunkWorker.onmessage = (event) => {
            if (this.scene) {
                if (event.data === "doneLoadingChunks") {
                    // this.terminate() // Do not terminate worker, we'll be using it for more chunk updates
                    // console.log('Chunk mesh work completed')
                }
                else if (event.data) {
                    const chunkName = `chunk_${event.data.chunkPosition.x}-${event.data.chunkPosition.y}-${event.data.chunkPosition.z}`
                    const existingChunkMesh = this.scene.getMeshByName(chunkName)

                    if (event.data.chunkEmpty) {
                        const chunkName = `chunk_${event.data.chunkPosition.x}-${event.data.chunkPosition.y}-${event.data.chunkPosition.z}`
                        const existingChunkMesh = this.scene.getMeshByName(chunkName)
                        if (existingChunkMesh) existingChunkMesh.dispose()
                        return
                    }

                    // If the mesh already exists, remove it
                    if (existingChunkMesh) existingChunkMesh.dispose()

                    // Create new mesh with same name
                    const customMesh = new BABYLON.Mesh(chunkName, this.scene)
                            
                    let vertexData = new BABYLON.VertexData()
                    vertexData.indices = event.data.indices
                    vertexData.normals = event.data.normal
                    vertexData.positions = event.data.position
                    vertexData.uvs = event.data.uv

                    vertexData.applyToMesh(customMesh)
                    customMesh.material = this.scene.defaultMaterial
                }
            }
        }

        ///////////////////////////////////////////////////////
        // Menu vars
        ///////////////////////////////////////////////////////
        this.menu = new MenuSystem($("#menu-canvas"))
        this.menu.loadFonts(`./client/src/textures/fonts/`)

        Buttons.tab.onPress = (e) => {
            e.preventDefault()

            // Unlock cursor (without pressing escape)
            document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock
            document.exitPointerLock()

            // Show menu
            this.menu.selectedScene = this.menu.pauseMenu
            this.menu.toggleVisibility()
        }

    }

    ///////////////////////////////////////////////////////
    // Methods
    ///////////////////////////////////////////////////////
    //...

    // ToDo: move this to methon in the World() class
    deepCopyWorld( world ) {
        const clone = JSON.parse(JSON.stringify(world))
        this.clientWorld = new World({
            worldSeed: clone._wSeed,
            tileScale: clone._tileScale,
            chunkSize: clone._chunkSize,
            worldSize: clone._worldSize
        })
        this.clientWorld.worldChunks = clone.worldChunks
    }

    // Use a worker thread to load chunks
    genMeshesFromChunks(world, chunkLocation = null) {
        let chunkWorker = this.chunkWorker

        // To start the thread work
        if (window.Worker) {
            if (chunkLocation) chunkWorker.postMessage({ world: world.worldChunks, chunkLocation: chunkLocation, type: 'chunk-only' })
            else chunkWorker.postMessage({world: world.worldChunks, type: 'full' })
        }
        else {
            // ToDo (maybe): Create a fall-back solution for browsers that don't support workers
        }
    }

    removeScene() {
        this.engine.stopRenderLoop()
        this.scene = null
        this.mainCamera = null
        this.utilLayer = null
        this.mainCrosshair = null
        this.mainInv = null
        this.localPlayer = null
        this.networkPlayers = []
    }

    // Sets up the scene in which the game can be rendered and interacted
    startNewGameScene() {
        // Hide menu
        this.menu.hide()

        // Reset game data
        this.removeScene()
        $('#main-canvas').style.display = 'inline-block'
        if ($('#loading-basic')) $('#loading-basic').style.display = 'none' // ToDo: replace this with a more robust loading indicator

        ////////////////////////////////////////////////////
        // Misc. Event Listeners
        ////////////////////////////////////////////////////

        const onWindowResize = () => {
            rescaleCanvas(renderScale)
        }

        const rescaleCanvas = (ratio) => {
            this.canvas.style.width = `${ratio*100}%`
            this.canvas.style.height = `${ratio*100}%`

            this.engine.resize()

            this.canvas.style.width = "100%"
            this.canvas.style.height = "100%"
        }

        // Set window resize listener
        window.addEventListener( 'resize', onWindowResize )

        ////////////////////////////////////////////////////
        // Init function calls
        ////////////////////////////////////////////////////

        // Init engine
        rescaleCanvas(renderScale)

        // Init scene
        this.scene = DefaultScene(this.engine)
        // Lock cursor to game (release with escape key)
        this.scene.onPointerDown = (evt) => { if (evt.button === 0) {
            this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.mozRequestPointerLock
            this.canvas.requestPointerLock()

            // To unlock (without pressing escape)
            // document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock
            // document.exitPointerLock()
        }}

        // Create world border mesh
        this.meshGen.createWorldBorders(this.clientWorld, this.scene)

        // Start generating chunk meshes
        this.genMeshesFromChunks(this.clientWorld, null)

        ////////////////////////////////////////////////////
        // Player and Camera
        ////////////////////////////////////////////////////

        // Create new camera in scene
        //const worldMax = defaultWorldSize * defaultChunkSize * tileScale
        const worldMax = this.clientWorld._worldSize * this.clientWorld._chunkSize * this.clientWorld._tileScale
        const centerTarget = new BABYLON.Vector3(worldMax/2, worldMax, worldMax/2) //new BABYLON.Vector3(worldCenter, worldCenter, worldCenter)
        this.mainCamera = new BABYLON.UniversalCamera('playerCamera', centerTarget, this.scene)
        this.mainCamera.minZ = tileScale/10
        this.mainCamera.maxZ = fogDistance

        this.mainCamera.attachControl(this.canvas, true)
        this.mainCamera.inputs.attached.keyboard.detachControl()
        this.mainCamera.inertia = 0 // no mouse smoothing
        this.mainCamera.speed = 0 // Movement speed
        this.mainCamera.fov = 1.35 // 1 is default
        this.mainCamera.angularSensibility = 1000 // Mouse sensitivity (default: 2000, higher is slower)

        // Create player
        this.localPlayer = new ClientPlayer(Controls.Player1, this.mainCamera, this.clientID, this)
        this.localPlayer.position = centerTarget
        // console.log("creating player with ID: ", this.clientID)
        // this.localPlayer.playerID = this.clientID // ToDo: make this support local players as well

        // Request other players
        // ToDo: DON'T send a network message here, this could be a single player game! (Consider sending a message to brain that the scene is created)
        if (this.clientComs.isNetworked) {
            console.log("asking who's here")
            this.clientComs.network.emit( 'genericClientMessage', { type: 'askWhosConnected', args: {} } )
        }

        // Create crosshair
        this.utilLayer = new BABYLON.UtilityLayerRenderer(this.scene)
        let utilLight = new BABYLON.HemisphericLight('utilLight', new BABYLON.Vector3(1, 1, 0), this.utilLayer.utilityLayerScene)
        utilLight.groundColor = new BABYLON.Color3(1, 1, 1)

        this.mainCrosshair = this.meshGen.createQuadWithUVs({x: 0, y: 0, z: 0}, 'back', 250, this.utilLayer.utilityLayerScene)
        this.mainCrosshair.material = this.scene.defaultMaterial
        this.mainCrosshair.setParent(this.mainCamera)
        this.mainCrosshair.position = new BABYLON.Vector3(0, 0, 8)

        this.changeInvSlot(1)

        ////////////////////////////////////////////////////
        // Render loop
        ////////////////////////////////////////////////////

        this.engine.runRenderLoop(() => { // setInterval( function(){ 
            // Update frame
            this.frame++

            // Tell the brain my position
            if (this.frame % 100) this.clientComs.updateMyGamePosition({ x: this.localPlayer.position.x, y: this.localPlayer.position.y, z: this.localPlayer.position.z })

            // Update materials
            if (this.scene.transparentMaterial) this.scene.transparentMaterial.alpha = (Math.sin(this.frame/30) * 0.2) + 0.4

            // Update player (change this to a loop for local machine players if we do that)
            if (this.localPlayer) this.localPlayer.platformMovementUpdate(this.engine)

            // Update network players
            for (let p in this.networkPlayers) {
                if (this.networkPlayers[p]) {
                    this.networkPlayers[p].updatePosition()
                }
            }

            // render scene
            this.scene.render()
        }) // }, 1000/90 )
    }

    // ToDo: Replace this when `this.mainInv` gets replaced
    changeInvSlot(idx) {
        if (this.mainInv) this.mainInv.dispose()
        this.mainInv = this.meshGen.createQuadWithUVs({x: 0, y: 0, z: 0}, 'back', idx, this.utilLayer.utilityLayerScene)
        this.mainInv.material = this.scene.defaultMaterial
        this.mainInv.rotation = new BABYLON.Vector3(this.mainCamera.rotation.x, this.mainCamera.rotation.y, this.mainCamera.rotation.z) 
        this.mainInv.setParent(this.mainCamera)
        this.mainInv.position = new BABYLON.Vector3(0, -5.5, 8)
    }

    // This is used when switching to an online session
    // (Not Yet Implemented)
    removeBrain() {
        // Save first?
        // Remove brain from memory
        //delete this._brain
        if (this._brain) {
            this._brain.brainComs = null
            this._brain = null
        }
        //this.clientWorld = null
    }

    // Connect to a networked session (go Online)
    //...
    connectToNetworkGame = (serverURL = "") => { //"http://localhost:3000"
        // Only join if not already connected to a game
        if (!this.clientComs.network) {
            // Remove brain, since we won't use it in a network game
            this.removeBrain()

            // Stop current scene
            this.removeScene()
            $('#main-canvas').style.display = 'none'

            // Connect
            let socket = io.connect(serverURL, { reconnection: false })
            socket.on('connect_error', (err) => {
                console.log(err)
                this.goOffline()
            })
            socket.on('connect_failed', (err) => {
                handleErrors(err)
                this.goOffline()
            })

            // Setup incomming message listeners
            socket.on(`welcomePacket`, (data) => {
                console.log(`Welcome new player!`)
                console.log(data)

                this.clientID = data.clientID
            })

            socket.on( 'genericClientMessage', ( data ) => {
                const playerId = 0//socket.connectionID // This does not support multiple players per client in networked games
                this.clientComs.brainMessages[data.type]( data.args, playerId )
            })

            // Reset client coms with networked settings
            this.clientComs = new ClientComs({
                isNetworked: true,
                clientGame: this,
                brainComs: null,
                network: socket
            })
        }
        else {
            // ToDo: Tell client that they need to diconnect from the current game to join an online game
            console.log('You need to leave your current game before you can join')
        }
    }

    // Go offline / Disconnect
    goOffline = () => {
        if (this.clientComs.network) this.clientComs.network.disconnect()
        this.clientComs.network = null // This might not strictly be necessary

        // Stop current scene
        this.removeScene()
        $('#main-canvas').style.display = 'none'

        // Go back to main menu
        this.menu.setScene(this.menu.mainMenu)


        // Create brain
        this._brain = new BrainGame({
            isNetworked: false,
            network: null
        })

        // Reset client coms
        this.clientComs = new ClientComs({
            isNetworked: false,
            clientGame: this,
            brainComs: this._brain?.brainComs,
            network: null
        })
    }

    // Create an offline session
    //... (ToDo: Move clientGame init code to a function and use here)

    // This is used for client-authored block updates
    updateSingleBlock(location, id) {
        if (this.clientWorld) {
            // Get adjusted position from global position
            const cSize = this.clientWorld.getChunkSize()
            const wSize = this.clientWorld.getWorldSize()
            const worldPos = getArrayPos(location, cSize)
            
            // Check if block is within the world
            const isWithinExsitingChunk = (
                worldPos.chunk.z < wSize && worldPos.chunk.z >= 0 &&
                worldPos.chunk.x < wSize && worldPos.chunk.x >= 0 &&
                worldPos.chunk.y < wSize && worldPos.chunk.y >= 0
            )
            if (isWithinExsitingChunk) {
                const worldOffset = {x: worldPos.chunk.x, y: worldPos.chunk.y, z: worldPos.chunk.z}
                const blockOffset = {x: worldPos.block.x, y: worldPos.block.y, z: worldPos.block.z}
                let updatedChunk = this.clientWorld.worldChunks[worldOffset.y][worldOffset.x][worldOffset.z]

                // Check if this change is actually different from world data
                if (updatedChunk[blockOffset.y][blockOffset.x][blockOffset.z] !== id) {
                    // Early chunk update on client
                    updatedChunk[blockOffset.y][blockOffset.x][blockOffset.z] = id

                    // Early mesh update on client (if networked)
                    if (this.clientComs.isNetworked) this.updateChunks(worldPos)
                            
                    // Send event to brain to update the chunk
                    this.clientComs.updateSingleBlock(worldPos, id)
                }
            }
        }
    }

    // Update the chunk mesh
    updateChunks(location) {
        const cSize = this.clientWorld.getChunkSize()
        const wSize = this.clientWorld.getWorldSize()

        // Start generating chunk meshes
        const chunkGroup = this.meshGen.getChunkGroup(this.clientWorld.worldChunks, { x: location.chunk.x, y: location.chunk.y, z: location.chunk.z })
        this.chunkWorker.postMessage({ chunkGroup: chunkGroup, type: 'chunk-only' })

        // Update neighboring chunks if needed
        const xIsAtChunkFarEdge = (location.block.x === cSize-1)
        const xIsAtChunkNearEdge = (location.block.x === 0)
        const yIsAtChunkFarEdge = (location.block.y === cSize-1)
        const yIsAtChunkNearEdge = (location.block.y === 0)
        const zIsAtChunkFarEdge = (location.block.z === cSize-1)
        const zIsAtChunkNearEdge = (location.block.z === 0)

        // X
        if (xIsAtChunkFarEdge && (location.chunk.x + 1) < wSize) {
            this.updateChunks({
                chunk: { x: location.chunk.x + 1, y: location.chunk.y, z: location.chunk.z },
                block: { x: 1, y: 1, z: 1 } // We don't care what block this is since the whole mesh will regenerate, but we don't want a chunk edge otherwise we get an recursive loop
            })
        }
        else if (xIsAtChunkNearEdge && (location.chunk.x - 1) >= 0) {
            this.updateChunks({
                chunk: { x: location.chunk.x - 1, y: location.chunk.y, z: location.chunk.z },
                block: { x: 1, y: 1, z: 1 } // We don't care what block this is since the whole mesh will regenerate, but we don't want a chunk edge otherwise we get an recursive loop
            })
        }
        // Y
        if (yIsAtChunkFarEdge && (location.chunk.y + 1) < wSize) {
            this.updateChunks({
                chunk: { x: location.chunk.x, y: location.chunk.y + 1, z: location.chunk.z },
                block: { x: 1, y: 1, z: 1 } // We don't care what block this is since the whole mesh will regenerate, but we don't want a chunk edge otherwise we get an recursive loop
            })
        }
        else if (yIsAtChunkNearEdge && (location.chunk.y - 1) >= 0) {
            this.updateChunks({
                chunk: { x: location.chunk.x, y: location.chunk.y - 1, z: location.chunk.z },
                block: { x: 1, y: 1, z: 1 } // We don't care what block this is since the whole mesh will regenerate, but we don't want a chunk edge otherwise we get an recursive loop
            })
        }
        // Z
        if (zIsAtChunkFarEdge && (location.chunk.z + 1) < wSize) {
            this.updateChunks({
                chunk: { x: location.chunk.x, y: location.chunk.y, z: location.chunk.z + 1 },
                block: { x: 1, y: 1, z: 1 } // We don't care what block this is since the whole mesh will regenerate, but we don't want a chunk edge otherwise we get an recursive loop
            })
        }
        else if (zIsAtChunkNearEdge && (location.chunk.z - 1) >= 0) {
            this.updateChunks({
                chunk: { x: location.chunk.x, y: location.chunk.y, z: location.chunk.z - 1 },
                block: { x: 1, y: 1, z: 1 } // We don't care what block this is since the whole mesh will regenerate, but we don't want a chunk edge otherwise we get an recursive loop
            })
        }
    }

    ///////////////////////////////////////////////////////
    // Messages from brain
    ///////////////////////////////////////////////////////

    // This is used for brain-authored chunk updates
    updateBlock(location, id) {

        // Update world
        this.clientWorld.worldChunks
        [location.chunk.y][location.chunk.x][location.chunk.z]
        [location.block.y][location.block.x][location.block.z] = id

        // Update chunk mesh
        this.updateChunks(location)
    }

    ///////////////////////////////////////////////////////
    // Loops
    ///////////////////////////////////////////////////////
    
    // (Not Yet Implemented)
    networkUpdate = () => { /* Here is where scheduled network messages should send */ }
}

export default ClientGame