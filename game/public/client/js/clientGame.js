// import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js" //ToDo: Download and include in "./dist/"
import { io } from "./dist/socket.io.esm.min.js"
import BrainGame from '../../brain/brainGame.js'
import ClientComs from './clientComs.js'
import { fogDistance, renderScale, chatMessageTime, lsKeys } from './clientConstants.js'
import { getRandomName, tileScale } from '../../common/commonConstants.js'
import { getArrayPos, getGlobalPos } from '../../common/positionUtils.js'
import { clamp } from '../../common/dataUtils.js'
import ClientPlayer from './entities/player.js'
import MeshGenerator from './mesh/meshGen.js'
import DefaultScene from "./defaultScene.js"
import World from '../../brain/gen/world/world.js'
import MenuSystem from './render2d/menu/menuSystem.js'
import HUDSystem from "./render2d/hudSystem.js"
import { blockTypes } from '../../common/blockSystem.js'
import { imageSRC, soundSRC, sounds } from "./resources.js"
import { localStorageIsAllowed } from "../../common/localStorageUtils.js"

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

        // The Client's settings object
        const settingsLoaded = (localStorageIsAllowed())? JSON.parse(localStorage.getItem(lsKeys.clientSettings)) : null // Load settings if the exist
        this.settings = {
            mouseSensitivity: settingsLoaded?.mouseSensitivity || 400, //higher is slower
            mouseInertia: 0.5, // 0 = no mouse smoothing
            fov: settingsLoaded?.fov || 1.35,
            chunkDist: settingsLoaded?.chunkDist || 5,
            // clientUpdateSpeed
            // ToDo: put player controls in here
        }

        // ToDo: make this a setting? maybe not, the movement speed is currently dependent on this
        this.clientUpdateSpeed = 16 // roughly 60 fps (1000ms/60frames = 16.6666)

        ///////////////////////////////////////////////////////
        // Player vars
        ///////////////////////////////////////////////////////

        // The main viewport camera
        this.mainCamera

        // The client's main player (this may need to be adjusted to more easily allow for multiple local players)
        this.localPlayer
        this.clientID = 0 // ToDo: make this support local players as well
        this.clientName = getRandomName()
        Buttons.isInputFocused = false

        // The other players on the network each should get a ClientPlayer that will be updated by the network
        this.networkPlayers = []

        ///////////////////////////////////////////////////////
        // Entity vars
        ///////////////////////////////////////////////////////
        this.effects = []

        ///////////////////////////////////////////////////////
        // Engin vars
        ///////////////////////////////////////////////////////

        this.canvas = props.canvas
        // new BABYLON.WebGPUEngine(this.canvas, false); await engine.initAsync(); // use Babylon 5's WebGPU support
        this.engine = new BABYLON.Engine(this.canvas, false)
        this.frame = 0
        this.scene
        this.updateLoop = null

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
                    customMesh.material = this.scene.defaultMaterial //this.scene.combinedMaterial
                }
            }
        }

        ///////////////////////////////////////////////////////
        // Menu vars
        ///////////////////////////////////////////////////////
        this.menu = new MenuSystem($("#menu-canvas"))
        this.menu.setupGraphics({
            tileSheetPath: imageSRC.UI,
            fontPath: `./client/src/textures/fonts/`
        })

        //[lookSlider, fovSlider, mouseInertiaeSlider, chunkDistSlider, defaultsButton, optionsBackButton]

        // Look Speed
        this.menu.optionsMenu.selectableElements[0].valueUpdateFunction = (val)=>{ this.settings.mouseSensitivity = ((this.menu.optionsMenu.selectableElements[0].valRange[0] + this.menu.optionsMenu.selectableElements[0].valRange[1]) - val); this.updateSettings(); }
        // this.menu.optionsMenu.selectableElements[0].valueUpdateFunction = (val)=>{ console.log(val) }

        // Inertia
        this.menu.optionsMenu.selectableElements[1].valueUpdateFunction = (val)=>{ this.settings.mouseInertia = val; this.updateSettings(); }

        // FoV
        this.menu.optionsMenu.selectableElements[2].valueUpdateFunction = (val)=>{ this.settings.fov = val; this.updateSettings(); }

        // Chunk distance
        this.menu.optionsMenu.selectableElements[3].valueUpdateFunction = (val)=>{
            this.settings.chunkDist = val;
            if (this.mainCamera && this.clientWorld) this.mainCamera.maxZ = (this.settings.chunkDist + 1) * (this.clientWorld?._chunkSize || 8)
            this.updateSettings();
        }

        // Defaults
        this.menu.optionsMenu.selectableElements[4].pressButton = ()=>{
            this.menu.optionsMenu.selectableElements[0].update(2000)
            this.menu.optionsMenu.selectableElements[1].update(0.5)
            this.menu.optionsMenu.selectableElements[2].update(1.35)
            this.menu.optionsMenu.selectableElements[3].update(5)
        }

        this.unlockCursor = () => {
            // Unlock cursor (without pressing escape)
            document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock
            document.exitPointerLock()
            
            Buttons.isInputFocused = false
            releaseAllButtons()

            // Change chat style
            $("#chat-window").classList.remove("noBG")
            $("#chat-input").classList.remove("noBG")
        }

        this.lockCursor = () => {
            // Lock cursor
            this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.mozRequestPointerLock
            this.canvas.requestPointerLock()
            Buttons.isInputFocused = true

            // Change chat style
            $("#chat-window").classList.add("noBG")
            $("#chat-input").classList.add("noBG")
        }

        Buttons.escape.onPress = Buttons.tab.onPress = (e) => {
            e.preventDefault()

            // Unlock cursor
            this.unlockCursor()

            // Show menu
            this.menu.selectedScene = this.menu.pauseMenu
            this.menu.toggleVisibility()
        }

        assignFunctionToInput([Buttons.comma], () => { this.settings.fov -= .1; this.updateSettings()}, ()=>{});
        assignFunctionToInput([Buttons.period], () => { this.settings.fov += .1; this.updateSettings()}, ()=>{});

        ///////////////////////////////////////////////////////
        // HUD vars
        ///////////////////////////////////////////////////////
        this.hud = new HUDSystem($("#hud-canvas"))
        this.hud.setupGraphics({
            tileSheetPath: imageSRC.UI,
            blockSheetPath: imageSRC.Tiles,
            fontPath: `./client/src/textures/fonts/`
        })
        this.hud.hide()

        // Chunk load interval
        this.loadChunkInterval = null
        this.chunkQueue = {}
    }

    ///////////////////////////////////////////////////////
    // Chunk Gen
    ///////////////////////////////////////////////////////

    // Check if chunk is in range of main camera
    isChunkInRange(camLocation, chunkLocation, renderDistance) {
        // Check distance
        const xInRange = Math.abs(camLocation.chunk.x - chunkLocation.x) <= renderDistance
        const yInRange = Math.abs(camLocation.chunk.y - chunkLocation.y) <= renderDistance
        const zInRange = Math.abs(camLocation.chunk.z - chunkLocation.z) <= renderDistance

        // Return
        if (xInRange && yInRange && zInRange)
            return true
        else return false
    }

    // Queues nearby chunk generation (Triggered on an interval)
    queueProximalChunks() {
        if (this.mainCamera) {
            //////////////////////////////////
            // Generate chunks in range
            //////////////////////////////////

            // Get array coordinates of camera
            const camPos = { x: this.mainCamera.position.x, y: this.mainCamera.position.y, z: this.mainCamera.position.z }
            const camLocation = getArrayPos(camPos, this.clientWorld._chunkSize)

            // Loop thorough chunks near us
            const camLowerY = clamp((camLocation.chunk.y - this.settings.chunkDist), 0, this.clientWorld._worldSize)
            const camUpperY = clamp((camLocation.chunk.y + this.settings.chunkDist), 0, this.clientWorld._worldSize)
            for (let y = camLowerY; y < camUpperY; y++) {

            const camLowerX = clamp((camLocation.chunk.x - this.settings.chunkDist), 0, this.clientWorld._worldSize)
            const camUpperX = clamp((camLocation.chunk.x + this.settings.chunkDist), 0, this.clientWorld._worldSize)
            for (let x = camLowerX; x < camUpperX; x++) {

            const camLowerZ = clamp((camLocation.chunk.z - this.settings.chunkDist), 0, this.clientWorld._worldSize)
            const camUpperZ = clamp((camLocation.chunk.z + this.settings.chunkDist), 0, this.clientWorld._worldSize)
            for (let z = camLowerZ; z < camUpperZ; z++) {
                // Queue the chunk
                const chunkLocation = { x: x, y: y, z: z }
                this.queueChunkMeshGen(chunkLocation)
            }}}

            //////////////////////////////////
            // Remove chunks out of range
            //////////////////////////////////
            const allChunkMeshes = this.scene.meshes.filter( (m) => { return m.name.includes('chunk_') })

            for (let i = 0; i < allChunkMeshes?.length; i++) {
                // Get chunk name & location
                const chunkName = allChunkMeshes[i].name
                const terms = chunkName.split('_')[1].split('-')
                const chunkLocation = { x: parseInt(terms[0]), y: parseInt(terms[1]), z: parseInt(terms[2]) }
                
                if (!this.isChunkInRange(camLocation, chunkLocation, this.settings.chunkDist)) {
                    // Unqueue it
                    this.chunkQueue[chunkName] = false

                    // Remove if it exists
                    const existingChunkMesh = this.scene.getMeshByName(chunkName)
                    if (existingChunkMesh) existingChunkMesh.dispose()
                }
            }
        }
    }

    // Tells the chunk worker to start generating a chunk
    queueChunkMeshGen(chunkLocation, override = false) {
        // Check the chunk queue
        const chunkName = `chunk_${chunkLocation.x}-${chunkLocation.y}-${chunkLocation.z}`

        // if (window.Worker && this.chunkWorker) {
        if (!this.chunkQueue[chunkName] || override) {
            // Tell ourselves we've queued this chunk
            this.chunkQueue[chunkName] = true

            // Tell the chunk worker to load the chunk
            const chunkGroup = this.meshGen.getChunkGroup(this.clientWorld.worldChunks, { x: chunkLocation.x, y: chunkLocation.y, z: chunkLocation.z })
            this.chunkWorker.postMessage({ chunkGroup: chunkGroup, type: 'chunk-only' })
        }
    }

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

                    // Play sound
                    switch (id) {
                        case 0:
                            // Remove block
                            if (sounds.BLOCK_BREAK_1) sounds.BLOCK_BREAK_1.play()
                            break
                        default:
                            // Place block                        
                            if (sounds.BLOCK_PLACE_1) sounds.BLOCK_PLACE_1.play()
                            break
                    }
                }
            }
        }
    }

    // Update the chunk mesh
    updateChunks(location) {
        const cSize = this.clientWorld.getChunkSize()
        const wSize = this.clientWorld.getWorldSize()

        // Get array coordinates of camera
        const camPos = { x: this.mainCamera.position.x, y: this.mainCamera.position.y, z: this.mainCamera.position.z }
        const camLocation = getArrayPos(camPos, cSize)

        // Start generating chunk meshes
        if (this.isChunkInRange(camLocation, location.chunk, this.settings.chunkDist)) this.queueChunkMeshGen(location.chunk, true)

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
    // Methods
    ///////////////////////////////////////////////////////

    displayPopupMessage(message) {
        const popup = $("#popup-top")

        // Set message and open popup
        popup.innerHTML = message
        popup.classList.add("open")

        // Set popup timer
        setTimeout(() => { 
            popup.classList.remove("open")
        }, 5000)
    }

    saveWorld(worldName) {
        // When saving worlds locally, we should request the brain's version of the world to save
        this.clientComs.genericToBrain("requestWorldToSave", {})
    }

    downloadWorld(worldJSON, worldName = "world.json") {
        // Create download link
        let element = document.createElement('a')
        element.setAttribute( 'href', 'data:text/plain;charset=utf-8,' + encodeURIComponent( worldJSON ) )
        element.setAttribute( 'download', worldName || 'world.json' )
      
        element.style.display = 'none'
        document.body.appendChild(element)

        // Click self
        element.click()

        // Remove element
        document.body.removeChild(element)
    }
    
    // Export world as obj (ToDo: Move this somewhere)
    exportWorldMesh() {
        // Export options
        let options = {
            // Only export meshes with "chunk" in the name
            shouldExportNode: function (node) {
                return node.name.includes('chunk')
            },
        }

        // Export & download
        BABYLON.GLTF2Export.GLBAsync(this.scene, "fileName", options).then((glb) => {
            glb.downloadFiles()
        })

    }

    removeScene() {
        // Remove local player
        delete this.localPlayer
        this.localPlayer = null

        // Stop rendering and remove scene
        clearInterval(this.updateLoop)
        this.updateLoop = null
        this.engine.stopRenderLoop()
        this.scene = null

        // Stop chunk loading
        this.chunkQueue = {}
        clearInterval(this.loadChunkInterval)
        this.loadChunkInterval = null

        // Remove other players and camera
        this.mainCamera = null
        this.networkPlayers = []

        // Remove UI functions / styles
        $("#chat-window").style.display = 'none'
        $("#chat-input").style.display = 'none'
        $("#chat-input").onsubmit = (e) => { e.preventDefault() }

        // Remove command buttons
        $("#lobby-reset-scores").onclick = () => {}
        $("#lobby-set-spectator").onclick = () => {}
        $("#lobby-set-creative").onclick = () => {}
        $("#lobby-set-deathmatch").onclick = () => {}
        $("#lobby-set-parkour").onclick = () => {}

        // Stop all sounds
        this.stopAllSounds()
    }
    
    stopAllSounds() {
        for (const prop in sounds) {
            sounds[prop].stop()
        }
    }

    // Sets up the scene in which the game can be rendered and interacted
    startNewGameScene() {
        console.log('Creating new scene...')
        ////////////////////////////////////////////////////
        // Restart / Start Scene & UI
        ////////////////////////////////////////////////////

        // Reset game data
        this.removeScene()
        $('#main-canvas').style.display = 'inline-block'
        if ($('#loading-basic')) $('#loading-basic').style.display = 'none' // ToDo: replace this with a more robust loading indicator

        // Stop all sounds
        this.stopAllSounds()

        // Enable chat window
        $("#chat-window").style.display = 'inline-block'
        $("#chat-input").style.display = 'inline-block'
        $("#chat-input").onsubmit = (e) => { 
            e.preventDefault()
            this.clientComs.sendChatMessage($("#chat-input-text").value, this.localPlayer.playerName, this.localPlayer.playerColor)
            $("#chat-input-text").value = ''
        }

        // Add command buttons
        $("#lobby-reset-scores").onclick = () => { this.clientComs.sendChatMessage(`/clearscores`, this.localPlayer.playerName, this.localPlayer.playerColor) }
        $("#lobby-set-spectator").onclick = () => { this.clientComs.sendChatMessage(`/sgm spectator`, this.localPlayer.playerName, this.localPlayer.playerColor) }
        $("#lobby-set-creative").onclick = () => { this.clientComs.sendChatMessage(`/sgm creative`, this.localPlayer.playerName, this.localPlayer.playerColor) }
        $("#lobby-set-deathmatch").onclick = () => { this.clientComs.sendChatMessage(`/sgm deathmatch`, this.localPlayer.playerName, this.localPlayer.playerColor) }
        $("#lobby-set-parkour").onclick = () => { this.clientComs.sendChatMessage(`/sgm parkour`, this.localPlayer.playerName, this.localPlayer.playerColor) }

        // Hide menu
        this.menu.hide()
        this.hud.show()

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
            this.lockCursor()

            // To unlock (without pressing escape)
            // document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock
            // document.exitPointerLock()
        }}

        // Create world border mesh
        const worldBorderMesh = this.meshGen.createWorldBorders(this.clientWorld, this.scene)

        // Allow debugger to be opened
        Buttons.backquote.onPress = (e) => {
            if (!this.scene.debugLayer.isVisible()) {
                this.scene.debugLayer.show({
                    embedMode: true,
                })
            }
            else this.scene.debugLayer.hide()
        }

        ////////////////////////////////////////////////////
        // Player and Camera
        ////////////////////////////////////////////////////

        // Create new camera in scene
        //const worldMax = defaultWorldSize * defaultChunkSize * tileScale
        const worldSpawn = getGlobalPos(this.clientWorld.worldSpawn, this.clientWorld._chunkSize)
        const worldSpawnPos = new BABYLON.Vector3(worldSpawn.x, worldSpawn.y, worldSpawn.z)
        this.mainCamera = new BABYLON.UniversalCamera('playerCamera', worldSpawnPos, this.scene)
        this.mainCamera.minZ = tileScale/10
        // this.mainCamera.maxZ = fogDistance
        this.mainCamera.maxZ = (this.settings.chunkDist + 1) * this.clientWorld._chunkSize

        this.mainCamera.attachControl(this.canvas, true)
        this.mainCamera.inputs.attached.keyboard.detachControl()
        this.mainCamera.inertia = this.settings.mouseInertia // 0 = no mouse smoothing
        this.mainCamera.speed = 0 // Movement speed
        this.mainCamera.fov = this.settings.fov // 1 is default
        this.mainCamera.angularSensibility = this.settings.mouseSensitivity // Mouse sensitivity

        // Create player
        this.localPlayer = new ClientPlayer(Controls.Player1, this.mainCamera, this.clientID, this)
        this.localPlayer.setPlayerName(this.clientName)
        // Spawn player and set default spawn
        this.localPlayer.position = worldSpawnPos
        this.localPlayer.setPlayerSpawn(worldSpawnPos)
        this.localPlayer.worldDefualtSpawn = worldSpawnPos

        // Request other players
        // ToDo: DON'T send a network message here, this could be a single player game! (Consider sending a message to brain that the scene is created)
        if (this.clientComs.isNetworked) {
            // Ask who's here
            this.clientComs.genericToBrain('askWhosConnected', {})
            // this.clientComs.network.emit( 'genericClientMessage', { type: 'askWhosConnected', args: {} } )

            // Send chat that I've joined
            this.clientComs.sendChatMessage(`I have joined!`, this.localPlayer.playerName, this.localPlayer.playerColor)
        }

        ////////////////////////////////////////////////////
        // Init sounds
        ////////////////////////////////////////////////////
        
        sounds.LASERGUN_SHOOT_1 = new BABYLON.Sound("lasergun_shoot_1", soundSRC.LASERGUN_SHOOT_1, this.scene)
        sounds.RAILGUN_SHOOT_1 = new BABYLON.Sound("railgun_shoot_2", soundSRC.RAILGUN_SHOOT_1, this.scene, null, { volume: 0.75, })
        sounds.BLOCK_PLACE_1 = new BABYLON.Sound("block_place_1", soundSRC.BLOCK_PLACE_1, this.scene)
        sounds.BLOCK_BREAK_1 = new BABYLON.Sound("block_break_1", soundSRC.BLOCK_BREAK_1, this.scene)
        sounds.BLOCK_BREAK_1 = new BABYLON.Sound("block_break_1", soundSRC.BLOCK_BREAK_1, this.scene)

        sounds.PLAYER_HIT_1 = new BABYLON.Sound("player_hit_1", soundSRC.PLAYER_HIT_1, this.scene, null, { volume: 0.5, })

        sounds.STEP_GRASS_1 = new BABYLON.Sound("step_grass_1", soundSRC.STEP_GRASS_1, this.scene, null, { volume: 0.25, })
        sounds.STEP_GRASS_2 = new BABYLON.Sound("step_grass_2", soundSRC.STEP_GRASS_2, this.scene, null, { volume: 0.25, })
        sounds.STEP_GRASS_3 = new BABYLON.Sound("step_grass_3", soundSRC.STEP_GRASS_3, this.scene, null, { volume: 0.25, })
        
        sounds.AMB_WIND_1 = new BABYLON.Sound("amb_wind_1", soundSRC.AMB_WIND_1, this.scene, null, { 
            loop: true,
            autoplay: true,
            volume: 0.25,
        })

        sounds.MUSIC_BATTLE_1 = new BABYLON.Sound("music_battle_1", soundSRC.MUSIC_BATTLE_1, this.scene, null, { 
            loop: true,
            // autoplay: true,
            volume: 0.25,
        })

        ////////////////////////////////////////////////////
        // Render loop
        ////////////////////////////////////////////////////

        // Start interval for loading new chunks
        this.loadChunkInterval = setInterval(()=>{ this.queueProximalChunks() }, 250)

        this.engine.runRenderLoop(() => { // setInterval( function(){ 
            // Update frame
            this.frame++

            // Update materials
            if (this.scene.transparentMaterial) this.scene.transparentMaterial.alpha = (Math.sin(this.frame/30) * 0.2) + 0.4

            // render scene
            this.scene.render()
        }) // }, 1000/90 )

        // Create an update loop (for client-side collision and movement updates)
        this.updateLoop = setInterval(()=>{

            // Update player (change this to loop through all local machine players, if we do that)
            if (this.localPlayer) {
                // Tell the brain my position
                if (this.frame % 100) this.clientComs.updateMyGamePosition({ x: this.localPlayer.position.x, y: this.localPlayer.position.y, z: this.localPlayer.position.z }, { x: this.localPlayer.avatar.rotation.x, y: this.localPlayer.avatar.rotation.y, z: this.localPlayer.avatar.rotation.z })
                // Update my position
                this.localPlayer.movementUpdate(this.engine)
            }

            // Update network players
            for (let p in this.networkPlayers) {
                if (this.networkPlayers[p]) {
                    this.networkPlayers[p].updatePosition()
                }
            }

            // Update effect
            for (let e in this.effects) {
                if (this.effects[e]) {
                    this.effects[e].update()
                }
            }

            // Update entities
            //...

        }, this.clientUpdateSpeed)
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
            let socket = io.connect(serverURL, {
                reconnection: false,
                timeout: 1000
            })
            socket.on('connect', (err) => {
                console.log(err)
                console.log("connected!")
                // Set heartbeat ping (this will ensure the client goes back to the menu if the connection fails / ends)
                socket.pingTimeout = 1000
                socket.pingInterval = 500
            })
            socket.on('connect_error', (err) => {
                // ToDo: Tell client there's a connection error
                console.log(err)
                this.goOffline()
                this.displayPopupMessage(`Connection Error: ${err}`)
            })
            socket.on('connect_failed', (err) => {
                // ToDo: Tell client there's a connection error
                console.log(err)
                this.goOffline()
                this.displayPopupMessage(`Connection Error: ${err}`)
            })
            socket.on('disconnect', (err) => {
                // ToDo: Tell client they've been disconnected
                console.log("YO YOU BEEN KICKED!!!")
                console.log(err)
                this.goOffline()
            })

            // Setup incomming message listeners
            // socket.on(`welcomePacket`, (data) => {
            //     console.log(`Welcome new player!`)
            //     console.log(data)

            //     this.clientID = data.clientID
            //     this.clientName = data.playerName
            //     console.log(data.playerName)
            // })

            socket.on( 'genericClientMessage', ( data ) => {
                // Only listen for messages if they're for me
                if (!data.recipients || data.recipients === 'all' || data.recipients.includes(this.localPlayer?.playerID)) {
                    const playerId = 0 //socket.connectionID // This does not support multiple players per client in networked games
                    this.clientComs.brainMessages[data.type]( data.args, playerId )
                }
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
            // ToDo: Tell client that they need to disconnect from the current game to join an online game
            console.log('You need to leave your current game before you can join')
            this.displayPopupMessage(`You need to leave your current game first.`)
        }
    }

    // Go offline / Disconnect
    goOffline = () => {
        // If online...
        if (this.clientComs.network) this.clientComs.network.disconnect()
        // If offline...
        else this._brain.stopGameLoop()
        this.clientComs.network = null // This might not strictly be necessary

        // Stop current scene
        this.removeScene()
        $('#main-canvas').style.display = 'none'

        // Go back to main menu
        this.menu.setScene(this.menu.mainMenu)
        this.menu.show()
        this.hud.hide()


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

    // Load an embed link
    // ToDo: Change this to accept a url, only run this function a command initiated it
    loadEmbed = (block, blockID) => {
        const uniqueBlock = `${blockID}_${block.x}_${block.y}_${block.z}`
        console.log(uniqueBlock)
        // Get embed URL from world file based on blockID's index data
        let embedUrl = ""
        if (this.clientWorld.blockData[uniqueBlock] !== undefined) embedUrl = this.clientWorld.blockData[uniqueBlock]

        if (embedUrl) {
            // Set embed
            SetEmbed(embedUrl)

            // Unlock cursor
            this.unlockCursor()
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

    // Display chat message
    displayChatMessage(message, messageName, nameColor = `rgb(${150},${150},${150})`, isServer = false) {
        console.log(messageName, message)

        const newMessage = document.createElement("p")
        if (isServer) newMessage.classList.add("fromServer")

        newMessage.innerHTML = `<b style="color: ${nameColor};">${messageName}:</b> ${message}` // ToDo: CHANGE THIS, THIS IS DANGEROUS! If users can inject RAW text directly into the html, a user could inject js code
        $("#chat-window").appendChild(newMessage)

        $("#chat-window").scrollTop = $("#chat-window").scrollHeight

        // Fade out
        setTimeout(()=>{
            newMessage.style.opacity = 0
        }, chatMessageTime)

        // Delete after fade out
        setTimeout(()=>{
            newMessage.remove()
        }, (chatMessageTime + 1000))
    }

    ///////////////////////////////////////////////////////
    // Loops
    ///////////////////////////////////////////////////////
    
    // (Not Yet Implemented)
    networkUpdate = () => { /* Here is where scheduled network messages should send */ }


    //TODO populate with objects that need to be updated when settings are updated
    //TODO use a bool array of fields that were updated to eliminate unnecessary processing
    updateSettings() {
        // Make updates
        if (this.mainCamera) {
            this.mainCamera.fov = this.settings.fov // 1 is default
            this.mainCamera.angularSensibility = this.settings.mouseSensitivity // Mouse sensitivity
            this.mainCamera.inertia = this.settings.mouseInertia // Mouse inertia
        }

        // After updating, save to local storage
        localStorage.setItem(lsKeys.clientSettings, JSON.stringify(this.settings))
    }
}

export default ClientGame