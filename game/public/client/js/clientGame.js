import BrainGame from '../../brain/brainGame.js'
import ClientComs from './clientComs.js'
import { tileScale, defaultChunkSize, defaultWorldSize, fogDistance, renderScale } from './clientConstants.js'
import { getArrayPos, getGlobalPos } from '../../common/positionUtils.js'
import ClientPlayer from './entities/player.js'
import MeshGenerator from './mesh/meshGen.js'
import DefaultScene from "./defaultScene.js"
import World from '../../brain/gen/world/world.js'

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

        // Connect the clientCom to brainCom
        if (!props.isNetworked) this.clientComs.offlineConnect(this.clientComs)

        // The client's copy of the world, this will be used for colission, meshGen, and meshUpdates
        this.clientWorld

        ///////////////////////////////////////////////////////
        // Player vars
        ///////////////////////////////////////////////////////

        // The main viewport camera
        this.mainCamera
        this.mainCrosshair

        // The client's main player (this may need to be adjusted to more easily allow for multiple local players)
        this.localPlayer// = new ClientPlayer()

        //this.debugLines, utilLayer, crosshair, skybox, stars, stars2

        ///////////////////////////////////////////////////////
        // Engin vars
        ///////////////////////////////////////////////////////

        this.canvas = props.canvas
        this.engine = new BABYLON.Engine(this.canvas, false)
        this.frame = 0
        this.scene

        // mesh helper object
        this.meshGen = new MeshGenerator()
    }

    ///////////////////////////////////////////////////////
    // Methods
    ///////////////////////////////////////////////////////
    //...

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

    // Sets up the scene in which the game can be rendered and interacted
    startNewGameScene() {
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

        // Use a worker thread to load chunks
        function genMeshesFromChunks(world, scene) {
            let chunkWorker

            // To start the thread work
            if (window.Worker) {
                chunkWorker = new Worker('./client/js/mesh/chunkMeshWorker.js', {type: 'module'})
                chunkWorker.postMessage({world: world.worldChunks})
            }

            // To get the data back
            chunkWorker.onmessage = function(event){
                // document.getElementById("result").innerHTML = event.data
                // console.log('Worker data: ', event.data)
                if (event.data === "doneLoadingChunks") {
                    chunkWorker.terminate()
                    console.log('Worker terminated')
                }
                else if (event.data) {
                    const customMesh = new BABYLON.Mesh(`chunk_${event.data.chunkPostion.x}-${event.data.chunkPostion.y}-${event.data.chunkPostion.z}`, scene)
                        
                    let vertexData = new BABYLON.VertexData()
                    vertexData.indices = event.data.indices
                    vertexData.normals = event.data.normal
                    vertexData.positions = event.data.position
                    vertexData.uvs = event.data.uv

                    vertexData.applyToMesh(customMesh)
                    customMesh.material = scene.defaultMaterial

                    // Append mesh to array
                    // if (!worldChunkMeshes[event.data.chunkPostion.y]) worldChunkMeshes[event.data.chunkPostion.y] = []
                    // if (!worldChunkMeshes[event.data.chunkPostion.y][event.data.chunkPostion.x]) worldChunkMeshes[event.data.chunkPostion.y][event.data.chunkPostion.x] = []
                    // if (!worldChunkMeshes[event.data.chunkPostion.y][event.data.chunkPostion.x][event.data.chunkPostion.z]) worldChunkMeshes[event.data.chunkPostion.y][event.data.chunkPostion.x][event.data.chunkPostion.z] = []
                    // worldChunkMeshes[event.data.chunkPostion.y][event.data.chunkPostion.x][event.data.chunkPostion.z].push(customMesh)
                }
            }
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
        genMeshesFromChunks(this.clientWorld, this.scene)

        ////////////////////////////////////////////////////
        // Player and Camera
        ////////////////////////////////////////////////////

        // Create new camera in scene
        const worldMax = defaultWorldSize * defaultChunkSize * tileScale
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
        this.localPlayer = new ClientPlayer(Controls.Player1, this.mainCamera, this)
        this.localPlayer.position = centerTarget

        // Create crosshair
        const utilLayer = new BABYLON.UtilityLayerRenderer(this.scene)
        let utilLight = new BABYLON.HemisphericLight('utilLight', new BABYLON.Vector3(1, 1, 0), utilLayer.utilityLayerScene)
        utilLight.groundColor = new BABYLON.Color3(1, 1, 1)

        this.mainCrosshair = this.meshGen.createQuadWithUVs({x: 0, y: 0, z: 0}, 'front', 250, utilLayer.utilityLayerScene)
        this.mainCrosshair.material = this.scene.defaultMaterial
        this.mainCrosshair.setParent(this.mainCamera)
        this.mainCrosshair.position = new BABYLON.Vector3(0, 0, 4)

        ////////////////////////////////////////////////////
        // Render loop
        ////////////////////////////////////////////////////

        this.engine.runRenderLoop(() => { // setInterval( function(){ 
            // Update frame
            this.frame++

            // Update materials
            if (this.scene.transparentMaterial) this.scene.transparentMaterial.alpha = (Math.sin(this.frame/30) * 0.2) + 0.4

            // Update player (change this to a loop for local machine players if we do that)
            if (this.localPlayer) this.localPlayer.platformMovementUpdate(this.engine)

            // render scene
            this.scene.render()
        }) // }, 1000/90 )
    }

    // This is used when switching to an online session
    // (Not Yet Implemented)
    removeBrain() {
        // Save first?
        // Remove brain from memory
        //delete this._brain
        this._brain = null
        this.clientWorld = null
    }

    // This is used for client-authored block updates
    updateSingleBlock(location, id) {
        if (this.clientWorld) {
            // Get adjusted position from global position
            const cSize = this.clientWorld.getChunkSize()
            const wSize = this.clientWorld.getWorldSize()
            const worldPos = getArrayPos( location, cSize)
            
            // Check if block is within the world
            const isWithinExsitingChunk = (
                worldPos.chunk.z < wSize && worldPos.chunk.z >= 0 &&
                worldPos.chunk.x < wSize && worldPos.chunk.x >= 0 &&
                worldPos.chunk.y < wSize && worldPos.chunk.y >= 0
            )
            if (isWithinExsitingChunk) {
                // Early update on client (only do this if online)
                // ToDo: remove the `!` here once chunk updates are working
                if (!this.isNetworked) {
                    // Create temporary mesh
                    //if (id > 0) this.meshGen.createBlockWithUV({x: location.x, y: location.y, z: location.z}, id, this.scene)

                    // Update world
                    const worldOffset = {x: worldPos.chunk.x, y: worldPos.chunk.y, z: worldPos.chunk.z}
                    const blockOffset = {x: worldPos.block.x, y: worldPos.block.y, z: worldPos.block.z}
                    let updatedChunk = this.clientWorld.worldChunks[worldOffset.y][worldOffset.x][worldOffset.z]
                    updatedChunk[blockOffset.y][blockOffset.x][blockOffset.z] = id
                }
                        
                // Send event to brain to update the chunk
                // ToDo: make this actually do something
                this.clientComs.updateSingleBlock(worldPos, id)
            }
        }
    }

    // Update the chunk mesh
    updateChunks(location) {

        // Create a mesh
        // const id = this.clientWorld.worldChunks
        // [location.chunk.y][location.chunk.x][location.chunk.z]
        // [location.block.y][location.block.x][location.block.z]
        const cSize = this.clientWorld.getChunkSize()

        const globalPos = getGlobalPos(location, cSize)
        const changedChunk = this.clientWorld.worldChunks[location.chunk.y][location.chunk.x][location.chunk.z]
        // let allMeshes = this.meshGen.createChunkBlock(changedChunk, globalPos, location.block, id, this.scene)

        // Select the changed mesh
        const chunkName = `chunk_${location.chunk.x}-${location.chunk.y}-${location.chunk.z}`
        const chunkMesh = this.scene.getMeshByName(chunkName)
        
        // Dispose it
        if (chunkMesh) chunkMesh.dispose()

        // Generate new chunk mesh
        // ToDo: Move mesh gen of of main thread
        const chunkOffset = { x: location.chunk.x * cSize, y:location.chunk.y * cSize, z:location.chunk.z * cSize }//{ x: x*chunkSize, y: y*chunkSize, z: z*chunkSize }
        const newMeshes = this.meshGen.createChunkMesh(changedChunk, chunkOffset, this.scene)
        const newChunkMesh = BABYLON.Mesh.MergeMeshes(newMeshes, true)
        newChunkMesh.name = chunkName

        // Try this for better performance in full chunks:
        // 1. Create worker to generate updated mesh
        // 2. When complete, set name to `${chunkName}-updated`
        // 3. Dispose old mesh
        // 4. Changed updated mesh name to `${chunkName}`
    }

    ///////////////////////////////////////////////////////
    // Messages from brain
    ///////////////////////////////////////////////////////

    // This is used for brain-authored chunk updates
    updateBlock(location, id) {
        //
        console.log('UPDATE', location, id)

        // Update world
        this.clientWorld.worldChunks
        [location.chunk.y][location.chunk.x][location.chunk.z]
        [location.block.y][location.block.x][location.block.z] = id

        // ToDo: Remove this once chunk mesh updates work
        // const globalPos = getGlobalPos(location, this.clientWorld.getChunkSize())
        // if (id > 0) this.meshGen.createBlockWithUV(
        //     { x: globalPos.x + 0.5, y: globalPos.y + 0.5, z: globalPos.z + 0.5 },
        //     id, this.scene
        // )

        // Update chunk mesh
        this.updateChunks(location)

        //this.updateChunks()
    }

    ///////////////////////////////////////////////////////
    // Loops
    ///////////////////////////////////////////////////////
    
    // (Not Yet Implemented)
    networkUpdate = () => { /* Here is where scheduled network messages should send */ }
}

export default ClientGame