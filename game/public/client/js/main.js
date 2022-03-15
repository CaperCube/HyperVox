import { tileScale, defaultWorldSize, fogDistance } from './clientConstants.js'
import BrainGame from '../../brain/brainGame.js'
import MeshGenerator from './mesh/meshGen.js'
import ClientPlayer from './entities/player.js'

////////////////////////////////////////////////////
// This should be in charge of rendering firing client-side updates
////////////////////////////////////////////////////

// `var block = 0x00000000` A single hex value to represent the block ID, orientation, damage value, and state (open/closed, other)
// 0x 0000      00      0       0
//    BlockID   Rot     Damage  State

// `var chunk = [[[]]]` A 16x16x16 array to hold the current chunk's block IDs
// Chunk coordinate format: chunk[y][x][z]

// `var visibleChunks = [[[]]]` A 5x5x5 array to hold the visible chunks
// `var world.chunks = [[[]]]` A _x_x_ array to hold the chunks for the whole world
// `var visibleMesh = FlattenChunks(visibleChunks)`

////////////////////////////////////////////////////
// Vars
////////////////////////////////////////////////////

// Game vars
const game = new BrainGame()

// Generate world data
game.createNewWorld()
let worldCenter = ((game.world.getWorldSize() * game.world.getChunkSize()) / 2) - (tileScale/2)

const meshGen = new MeshGenerator()
let worldChunkMeshes = []

// Render vars
const canvas = $('#main-canvas')
let engine
let renderScale = 1
let frame = 0

// Material for most blocks
let mat, mat2, texture

let player

let debugLines, utilLayer, crosshair, skybox, stars, stars2

let light

////////////////////////////////////////////////////
// Scene init
////////////////////////////////////////////////////

// TODO: Clean this function up
const createScene = () => {
    // Create new scene
    const scene = new BABYLON.Scene(engine)
    scene.clearColor = new BABYLON.Color3.Black()

    ////////////////////////////////////////////////////
    // Materials
    ////////////////////////////////////////////////////

    // Create block materials
    mat = new BABYLON.StandardMaterial('mat')
    texture = new BABYLON.Texture(imageSRC.Tiles, scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE)
    mat.diffuseTexture = texture
    mat.specularColor = new BABYLON.Color3(0, 0, 0)
    scene.defaultMaterial = mat
    
    mat2 = new BABYLON.StandardMaterial('mat')
    mat2.diffuseTexture = texture
    mat2.emissiveTexture = texture
    mat2.specularColor = new BABYLON.Color3(0, 0, 0)
    mat2.diffuseTexture.hasAlpha = true
    mat2.useAlphaFromDiffuseTexture = true
    mat2.alpha = 0.5
    scene.transparentMaterial = mat2
    mat2.zOffset = -1 // Gives this material depth prioraty

    ////////////////////////////////////////////////////
    // Skybox
    ////////////////////////////////////////////////////
    skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene)
    skybox.infiniteDistance = true
    skybox.renderingGroupId = 0

    let skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMat", scene)
    skyboxMaterial.backFaceCulling = false
    // suffixes for sides: +x, +y, +z, -x, -y, -z
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(imageSRC.Skybox1, scene, [`right.png`, `bottom.png`, `back.png`, `left.png`, `top.png`, `front.png`], false)
    skyboxMaterial.reflectionTexture.onLoadObservable.add(() => {
        skyboxMaterial.reflectionTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE)
    })
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0)
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0)

    skybox.material = skyboxMaterial
    skybox.applyFog = false

    // Stars
    stars = BABYLON.MeshBuilder.CreateSphere("stars", { diameter: 200.0 }, scene)
    stars.infiniteDistance = true
    stars.renderingGroupId = 0

    stars.scaling = new BABYLON.Vector3 (1, 5, 1)
    stars.rotation.z = Math.PI/2

    let starMaterial = new BABYLON.StandardMaterial("starsMat", scene)
    starMaterial.backFaceCulling = false
    starMaterial.diffuseTexture = new BABYLON.Texture(imageSRC.Stars, scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE)
    starMaterial.specularColor = new BABYLON.Color3(0, 0, 0)
    starMaterial.diffuseTexture.hasAlpha = true
    starMaterial.useAlphaFromDiffuseTexture = true
    starMaterial.alpha = 0.75

    BABYLON.Animation.CreateAndStartAnimation("u", starMaterial.diffuseTexture, "vOffset", 30, 240, 0, 1, 1)
    BABYLON.Animation.CreateAndStartAnimation("u", starMaterial.diffuseTexture, "uOffset", 30, 800, 0, 1, 1)
    stars.material = starMaterial
    stars.applyFog = false

    // Stars 2
    stars2 = BABYLON.MeshBuilder.CreateSphere("stars", { diameter: 400.0 }, scene)
    stars2.infiniteDistance = true
    stars2.renderingGroupId = 0

    stars2.scaling = new BABYLON.Vector3 (1, 1, 1)
    stars2.rotation.z = Math.PI/2

    let starMaterial2 = new BABYLON.StandardMaterial("starsMat", scene)
    starMaterial2.backFaceCulling = false
    starMaterial2.diffuseTexture = new BABYLON.Texture(imageSRC.Stars, scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE)
    starMaterial2.specularColor = new BABYLON.Color3(0, 0, 0)
    starMaterial2.diffuseTexture.hasAlpha = true
    starMaterial2.useAlphaFromDiffuseTexture = true
    starMaterial2.alpha = 0.25
    BABYLON.Animation.CreateAndStartAnimation("u", starMaterial2.diffuseTexture, "vOffset", 30, 800, 0, 1, 1)
    BABYLON.Animation.CreateAndStartAnimation("u", starMaterial2.diffuseTexture, "uOffset", 30, 4000, 0, 1, 1)
    stars2.material = starMaterial2
    stars2.applyFog = false

    ////////////////////////////////////////////////////
    // Lighting and fog
    ////////////////////////////////////////////////////

    // Create light in scene
    light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0))
    // light.intensity = 1
    light.diffuse = new BABYLON.Color3(203/255, 219/255, 252/255) // Light Blue
    light.groundColor = new BABYLON.Color3(69/255, 40/255, 60/255) // Dark Purple
    // light.groundColor = new BABYLON.Color3(0/255, 6/255, 34/255) // Dark Blue
    // light.groundColor = new BABYLON.Color3(25/255, 9/255, 19/255) // Dark Blue

    // Fog
    scene.fogDensity = 0.02
    scene.fogStart = 8//fogDistance/2
    scene.fogEnd = 128
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP//BABYLON.Scene.FOGMODE_LINEAR
    scene.fogColor = new BABYLON.Color3(0, 0, 0)

    // Create world border mesh
    meshGen.createWorldBorders(game.world, scene)

    ////////////////////////////////////////////////////
    // Player and Camera
    ////////////////////////////////////////////////////

    // Create new camera in scene
    let centerTarget = new BABYLON.Vector3(worldCenter, worldCenter, worldCenter)
    //var camera = new BABYLON.ArcRotateCamera('camera1', Math.PI/4, Math.PI/4, 40, centerTarget, scene)
    var camera = new BABYLON.UniversalCamera('playerCamera', centerTarget, scene)
    camera.minZ = tileScale/10
    camera.maxZ = fogDistance

    camera.attachControl(canvas, true)
    camera.inputs.attached.keyboard.detachControl()
    camera.inertia = 0 // no mouse smoothing
    camera.speed = 0 // Movement speed
    camera.fov = 1.35 // 1 is default
    camera.angularSensibility = 1000 // Mouse sensitivity (default: 2000, higher is slower)

    // Create player
    player = new ClientPlayer(Controls.Player1, camera, debugLines, game.world, meshGen, scene)
    player.position = new BABYLON.Vector3(worldCenter, worldCenter*2, worldCenter)

    // Lock cursor to game (release with escape key)
    scene.onPointerDown = (evt) => { if (evt.button === 0) {
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock
        canvas.requestPointerLock()

        // To unlock (without pressing escape)
        // document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock
        // document.exitPointerLock()
    }}

    // Create crosshair
    utilLayer = new BABYLON.UtilityLayerRenderer(scene)
    let utilLight = new BABYLON.HemisphericLight('utilLight', new BABYLON.Vector3(1, 1, 0), utilLayer.utilityLayerScene)
    utilLight.groundColor = new BABYLON.Color3(1, 1, 1)

    crosshair = meshGen.createQuadWithUVs({x: player.position.x - 0.5, y: player.position.y + 0.5, z: player.position.z + 4}, 'front', 250, utilLayer.utilityLayerScene)
    crosshair.material = scene.defaultMaterial
    crosshair.setParent(camera)
    crosshair.position = new BABYLON.Vector3(0, 0, 4)


    // Create debug line mesh
    debugLines = BABYLON.Mesh.CreateLines("debugLines", new BABYLON.Vector3(0,0,0), scene, true)

    ////////////////////////////////////////////////////
    // Return scene
    ////////////////////////////////////////////////////

    console.log(game.world)
    // Return the scene to the renderer
    return scene
}

////////////////////////////////////////////////////
// Init function calls
////////////////////////////////////////////////////

// Init engine
rescaleCanvas(renderScale)

// Init scene
const scene = createScene()

// Start generating chunk meshes
genMeshesFromChunks(game.world, scene)

////////////////////////////////////////////////////
// Misc. Event Listeners
////////////////////////////////////////////////////

// Set window resize listener
window.addEventListener( 'resize', onWindowResize );
function onWindowResize() {
    rescaleCanvas(renderScale)
}

function rescaleCanvas(ratio) {
    canvas.style.width = `${ratio*100}%`
    canvas.style.height = `${ratio*100}%`

    engine = new BABYLON.Engine(canvas, false)

    canvas.style.width = "100%"
    canvas.style.height = "100%"
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
            const customMesh = new BABYLON.Mesh("workerChunk", scene)
                
            let vertexData = new BABYLON.VertexData()
            vertexData.indices = event.data.indices
            vertexData.normals = event.data.normal
            vertexData.positions = event.data.position
            vertexData.uvs = event.data.uv

            vertexData.applyToMesh(customMesh)
            customMesh.material = scene.defaultMaterial

            // Append mesh to array
            if (!worldChunkMeshes[event.data.chunkPostion.y]) worldChunkMeshes[event.data.chunkPostion.y] = []
            if (!worldChunkMeshes[event.data.chunkPostion.y][event.data.chunkPostion.x]) worldChunkMeshes[event.data.chunkPostion.y][event.data.chunkPostion.x] = []
            if (!worldChunkMeshes[event.data.chunkPostion.y][event.data.chunkPostion.x][event.data.chunkPostion.z]) worldChunkMeshes[event.data.chunkPostion.y][event.data.chunkPostion.x][event.data.chunkPostion.z] = []
            worldChunkMeshes[event.data.chunkPostion.y][event.data.chunkPostion.x][event.data.chunkPostion.z].push(customMesh)
        }
    }
}

////////////////////////////////////////////////////
// Render loop
////////////////////////////////////////////////////

engine.runRenderLoop(function(){
// setInterval( function(){ 
    // Update frame
    frame++

    // Update materials
    if (mat2) mat2.alpha = (Math.sin(frame/30) * 0.2) + 0.4

    // Update player (change this to a loop for local machine players if we do that)
    if (player) player.platformMovementUpdate(engine)

    if (skybox) {
        // skybox.rotation.x += 0.0001
        // skybox.rotation.z += 0.0001
    }

    // render scene
    scene.render()
// }, 1000/90 )
})