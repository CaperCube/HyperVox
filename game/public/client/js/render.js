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

// World vars
const newWorld = new World({
    worldSeed: 'helloworld',
    worldSize: 6
})
let worldCenter = ((newWorld.getWorldSize() * newWorld.getChunkSize()) / 2) - (newWorld.getTileScale()/2)
//let worldCenter = ((3 * 16) / 2) - (1/2)
console.log(newWorld)

// Render vars
const canvas = $('#main-canvas')
let engine
let renderScale = 1
let frame = 0
const fogDist = 1000
// Material for most blocks
let mat, texture


////////////////////////////////////////////////////
// Scene init
////////////////////////////////////////////////////

// TODO: Clean this function up
const createScene = () => {
    // Create new scene
    const scene = new BABYLON.Scene(engine)
    scene.clearColor = new BABYLON.Color3.Black()

    // Create new camera in scene
    //const camera = new BABYLON.FreeCamera( "camera1", new BABYLON.Vector3( 0, 0, -10 ), scene )
    let centerTarget = new BABYLON.Vector3(worldCenter, worldCenter, worldCenter)
    var camera = new BABYLON.ArcRotateCamera('camera1', Math.PI/4, Math.PI/4, 40, centerTarget, scene)
    //var camera = new BABYLON.UniversalCamera('playerCamera', centerTarget, scene)
    camera.minZ = newWorld.getTileScale()/5
    camera.maxZ = fogDist
    camera.attachControl(canvas, true)

    // Create light in scene
    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0))
    //light.intensity = 1

    // Create block material
    // TODO: set this as the scene's default scene so it can be referenced that way
    mat = new BABYLON.StandardMaterial('mat')
    texture = new BABYLON.Texture(imageSRC.Tiles, scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE)
    mat.diffuseTexture = texture
    //mat.backFaceCulling = true;
    mat.specularColor = new BABYLON.Color3(0, 0, 0)

    // Fog
    scene.fogDensity = 0//0.15
    scene.fogStart = fogDist/2
    scene.fogEnd = fogDist
    scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR//FOGMODE_EXP
    scene.fogColor = new BABYLON.Color3(0, 0, 0)

    // Generate world
    generateSimpleWorld({
        seed: newWorld.getWorldSeed(),
        tileScale: newWorld.getTileScale(),
        chunkSize: newWorld.getChunkSize(),
        worldSize: newWorld.getWorldSize(),
        scene: scene
    })
    
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

////////////////////////////////////////////////////
// Render loop
////////////////////////////////////////////////////

engine.runRenderLoop(function(){
    // Update frame
    frame++

    //movementUpdate()

    // render scene
    scene.render()
})