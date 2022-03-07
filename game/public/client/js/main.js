import { tileScale, defaultWorldSize } from './clientConstants.js'
import Game from '../../brain/game.js'
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
const game = new Game()

// Generate world data
game.createNewWorld()
let worldCenter = ((game.world.getWorldSize() * game.world.getChunkSize()) / 2) - (tileScale/2)

const meshGen = new MeshGenerator()

// Render vars
const canvas = $('#main-canvas')
let engine
let renderScale = 1
let frame = 0
const fogDist = 1000

// Material for most blocks
let mat, mat2, texture

let player

let debugLines

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
    //mat.backFaceCulling = true
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
    // Lighting and fog
    ////////////////////////////////////////////////////

    // Create light in scene
    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0))
    //light.intensity = 1

    // Fog
    scene.fogDensity = 0//0.1
    scene.fogStart = 8//fogDist/2
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
    camera.maxZ = fogDist

    camera.attachControl(canvas, true)
    camera.inputs.attached.keyboard.detachControl()
    camera.inertia = 0 // no mouse smoothing
    camera.speed = 0 // Movement speed
    camera.fov = 1.35 // 1 is default
    camera.angularSensibility = 1000 // Mouse sensitivity (default: 2000, higher is slower)

    // Create player
    player = new ClientPlayer(Controls.Player1, camera, debugLines, game.world, meshGen, scene)
    player.position = new BABYLON.Vector3(worldCenter, worldCenter*2, 0)

    // Lock cursor to game (release with escape key)
    scene.onPointerDown = (evt) => { if (evt.button === 0) {
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock
        canvas.requestPointerLock()

        // To unlock (without pressing escape)
        // document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock
        // document.exitPointerLock()
    }}

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
    player.platformMovementUpdate(engine)

    // render scene
    scene.render()
// }, 1000/90 )
})