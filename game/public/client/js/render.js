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

// World vars
const newWorld = new World({
    //worldSeed: 'helloworld',
    worldSize: 2
})
Buttons.i.onPress = () => {console.log(newWorld.getWorldSeed())}
let worldCenter = ((newWorld.getWorldSize() * newWorld.getChunkSize()) / 2) - (newWorld.getTileScale()/2)
//let worldCenter = ((3 * 16) / 2) - (1/2)

// Render vars
const canvas = $('#main-canvas')
let engine
let renderScale = 1
let frame = 0
const fogDist = 1000
// Material for most blocks
let mat, mat2, texture

let player

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
    //var camera = new BABYLON.ArcRotateCamera('camera1', Math.PI/4, Math.PI/4, 40, centerTarget, scene)
    var camera = new BABYLON.UniversalCamera('playerCamera', centerTarget, scene)
    camera.minZ = newWorld.getTileScale()/10
    camera.maxZ = fogDist

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
    //mat.diffuseTexture.hasAlpha = true
    //mat.useAlphaFromDiffuseTexture = true
    scene.defaultMaterial = mat
    
    mat2 = new BABYLON.StandardMaterial('mat')
    mat2.diffuseTexture = texture
    mat2.emissiveTexture = texture
    mat2.specularColor = new BABYLON.Color3(0, 0, 0)
    mat2.diffuseTexture.hasAlpha = true
    mat2.useAlphaFromDiffuseTexture = true
    mat2.alpha = 0.5
    scene.transparentMaterial = mat2
    mat2.zOffset = -1 // Give this material depth prioraty

    // Fog
    scene.fogDensity = 0//0.1
    scene.fogStart = 8//fogDist/2
    scene.fogEnd = 128
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP//BABYLON.Scene.FOGMODE_LINEAR
    scene.fogColor = new BABYLON.Color3(0, 0, 0)

    // Generate world
    const genWorld = generateSimpleWorld({
        seed: newWorld.getWorldSeed(),
        tileScale: newWorld.getTileScale(),
        chunkSize: newWorld.getChunkSize(),
        worldSize: newWorld.getWorldSize(),
        scene: scene
    })
    
    const worldMeshes = genWorld.worldChunkMeshes
    newWorld.worldChunks = genWorld.worldChunks
    // Make chunks check for colissions
    worldMeshes.map(mesh=>{ mesh.checkCollisions = true })

    // Create world borders
    let worldBorders = []
    const wallSize = newWorld.getTileScale() * newWorld.getChunkSize() * newWorld.getWorldSize()
    const borderOffset = (newWorld.getTileScale() * newWorld.getChunkSize() * newWorld.getWorldSize())
    const borderOffsetHalf = ((newWorld.getTileScale() * newWorld.getChunkSize() * newWorld.getWorldSize())/2)
    worldBorders.push(createChunkBorder({x: borderOffsetHalf, y: borderOffsetHalf, z: borderOffset}, {x: 0, y: Math.PI, z: 0}, wallSize, mat2, scene)) // Front
    worldBorders.push(createChunkBorder({x: borderOffsetHalf, y: borderOffsetHalf, z: 0}, {x: 0, y: 0, z: 0}, wallSize, mat2, scene)) // Back
    worldBorders.push(createChunkBorder({x: 0, y: borderOffsetHalf, z: borderOffsetHalf}, {x: 0, y: Math.PI/2, z: 0}, wallSize, mat2, scene)) // Left
    worldBorders.push(createChunkBorder({x: borderOffset, y: borderOffsetHalf, z: borderOffsetHalf}, {x: 0, y: -Math.PI/2, z: 0}, wallSize, mat2, scene)) // Right
    //const worldBorderMeshes = BABYLON.Mesh.MergeMeshes(worldBorders, true)

    // Create player
    player = new ClientPlayer(Controls.Player1, camera, scene)
    // Lock cursor to game (release with escape key)
    scene.onPointerDown = (evt) => { if (evt.button === 0) {
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock
        canvas.requestPointerLock()

        // To unlock (without pressing escape)
        // document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock
        // document.exitPointerLock()
    }}
    Buttons.n.onPress = () => {player.spectateMode = !player.spectateMode}

    // Gravity / collisions
    //const framesPS = 60
    //const gravity = -9.8
    //scene.gravity = new BABYLON.Vector3(0, gravity/framesPS, 0)
    scene.collisionsEnabled = true

    camera.attachControl(canvas, true)
    camera.inputs.attached.keyboard.detachControl()
    camera.inertia = 0 // no mouse smoothing
    camera.speed = 0 // Movement speed
    camera.fov = 1.35 // 1 is default
    camera.angularSensibility = 1000 // Mouse sensitivity (default: 2000, higher is slower)
    //camera.applyGravity = true
    camera.checkCollisions = true
    camera.ellipsoid = new BABYLON.Vector3(0.5,0.5,0.5) // Collider for the camera
    
    //camera.keysUp.push(Buttons.w.code)
    //camera.keysDown.push(Buttons.s.code)
    //camera.keysLeft.push(Buttons.a.code)
    //camera.keysRight.push(Buttons.d.code)
    //Controls.Player1.jump.onPress = ()=>{camera.velocity}

    console.log(newWorld)
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

// For fixed framerate:
// `engine.stopRenderLoop()
// setInterval( ()=>{ scene.render() }, frameRate )`
//engine.stopRenderLoop()
engine.runRenderLoop(function(){
// setInterval( function(){ 
    // Update frame
    frame++

    // Update materials
    if (mat2) mat2.alpha = (Math.sin(frame/30) * 0.15) + 0.25

    //movementUpdate()
    player.platformMovementUpdate(engine, newWorld)
    // player.movementUpdate(engine)

    // render scene
    scene.render()
// }, 1000/90 )
})