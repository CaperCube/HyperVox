// Texture 
//'./client/src/textures/textures.png'
// main canvas
// $("#main-canvas")

////////////////////////////////////////////////////
// Vars
////////////////////////////////////////////////////


// Material for most blocks
let mat, texture
let frame = 0
//let controls;

let renderScale = 1

let tileScale = 1
let worldSize = 50 // In num of tiles
let playerHeight = tileScale * 1.5

let moveForward, moveBackward, moveLeft, moveRight
let moveSpeed = tileScale/20

////////////////////////////////////////////////////
// Scene init
////////////////////////////////////////////////////
const createTestScene = () => {
    // Create new scene
    const scene = new BABYLON.Scene(engine)
    scene.clearColor = new BABYLON.Color3.Black()

    // Create new camera in scene
    //const camera = new BABYLON.FreeCamera( "camera1", new BABYLON.Vector3( 0, 0, -10 ), scene )
    var camera = new BABYLON.ArcRotateCamera('camera1', 0, 0, 0, new BABYLON.Vector3(0, 0, -10), scene)
    camera.minZ = tileScale/5
    camera.setTarget(BABYLON.Vector3.Zero())
    camera.attachControl(canvas, true)

    // Create light in scene
    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0))

    // Create block material
    mat = new BABYLON.StandardMaterial('mat')
    texture = new BABYLON.Texture('./client/src/textures/textures.png', scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE)
    mat.diffuseTexture = texture
    mat.specularColor = new BABYLON.Color3(0, 0, 0)

    // Fog
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP
    scene.fogDensity = 0//0.1
    scene.fogStart = tileScale
    scene.fogEnd = tileScale*50
    scene.fogColor = new BABYLON.Color3(0, 0, 0)
    
    // Return the scene to the renderer
    return scene
}

////////////////////////////////////////////////////
// Init function calls
////////////////////////////////////////////////////
// Init engine
const canvas = $('#main-canvas')
let engine
rescaleCanvas(renderScale)

// Init scene
const scene = createTestScene()
createBlockWithUV({x: 0, y: 0, z: 0}, 0)

initMovementControls()
//createRandomFloor()

////////////////////////////////////////////////////
// Misc. Event Listeners
////////////////////////////////////////////////////
// Set event listener
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
    //frame++
    //movementUpdate()

    // Update scene
    scene.render()
})

////////////////////////////////////////////////////
// Basic mesh creation
////////////////////////////////////////////////////
// Return UV coordinates for a quad based on the tile index
function getTileUVByIndex(idx) {
    let row = 0
    let maxTileRow = 16 // the totla number of tiles in a row & col
    let tileInc = 1/maxTileRow
    
    // calculate the UV points for the tile
    let top = row * tileInc
    let bottom = top + tileInc
    let left = idx * tileInc
    let right = left + tileInc

    return [
        {u: (left), v: (1-top)}, // 0 - Top Left
        {u: (right), v: (1-top)}, // 1 - Top Right
        {u: (left), v: (1-bottom)}, // 2 - Bottom Left
        {u: (right), v: (1-bottom)}  // 3 - Bottom Right
    ]
}

// Get the tile index UVs and create a quad
function createQuadwithUV( {x, y, z}, tex, idx) {
    const geometry = new THREE.PlaneGeometry( tileScale, tileScale )

    // Set UV of geometry
    let tileUV = getTileUVByIndex(idx)
    let uvAttribute = geometry.attributes.uv
    uvAttribute.setXY( 0, tileUV[0].u, tileUV[0].v )
    uvAttribute.setXY( 1, tileUV[1].u, tileUV[1].v )
    uvAttribute.setXY( 2, tileUV[2].u, tileUV[2].v )
    uvAttribute.setXY( 3, tileUV[3].u, tileUV[3].v )

    // Make object
    const material = new THREE.MeshBasicMaterial( { map: tex/*, side: THREE.DoubleSide */ } )
    const plane = new THREE.Mesh( geometry, material )

    // Rotate and position plane
    plane.rotation.x = -Math.PI/2
    plane.position.x = x
    plane.position.y = y
    plane.position.z = z

    // Add to scene
    scene.add( plane )
}

function createBlockWithUV({x, y, z}, idx) {
    // Set UVs
    let faceUV = []
    const rows = 16
    const columns = 16
    let c = 0
    let r = 0
    for (let i = 0; i < 6; i++) {
        faceUV[i] = new BABYLON.Vector4(
            c / columns,        // U1
            (r + 1) / rows,     // V1
            (c + 1) / columns,  // U2
            r / rows            // V2
        );
    }

    // Create box
    const block = BABYLON.MeshBuilder.CreateBox("Block", {
        size: tileScale,
        faceUV: faceUV, //[new BABYLON.Vector4(0, 0, 0, 0)] // Array of 6 (one for each face)
        wrap: true
    }, scene)

    block.material = mat
}

// Creat floor using createQuadwithUV()
function createRandomFloor() {
    // Create floor
    for (let i = 0; i < worldSize; i++) {
        for (let j = 0; j < worldSize; j++) {
            // let randTile = 0
            let randTile = Math.floor(Math.random() * 8)
            if (j >= 24 && j <= 26 && i >= 24 && i <= 26) randTile = 4
            createQuadwithUV( {x: i*tileScale, y: 0, z: -j*tileScale}, texture, randTile )
        }
    }
}

////////////////////////////////////////////////////
// Basic FPS movement
////////////////////////////////////////////////////
function initMovementControls() {
    const onKeyDown = function ( event ) {

        switch ( event.code ) {

            case 'ArrowUp':
            case 'KeyW':
                moveForward = true;
                break

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = true;
                break

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true;
                break

            case 'ArrowRight':
            case 'KeyD':
                moveRight = true;
                break

            case 'Space':
                //if ( canJump === true ) velocity.y += 350;
                //canJump = false;
                break

        }
    }

    const onKeyUp = function ( event ) {

        switch ( event.code ) {

            case 'ArrowUp':
            case 'KeyW':
                moveForward = false;
                break

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = false;
                break

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false;
                break

            case 'ArrowRight':
            case 'KeyD':
                moveRight = false;
                break

        }

    };

    document.addEventListener( 'keydown', onKeyDown );
    document.addEventListener( 'keyup', onKeyUp );
}

function movementUpdate() {
    // Move controler
    let isMoving = false
    if (moveForward) {
        //controls.moveForward(moveSpeed)
        isMoving = true
    }
    if (moveBackward) {
        //controls.moveForward(-moveSpeed)
        isMoving = true
    }

    if (moveRight) {
        //controls.moveRight(moveSpeed)
        isMoving = true
    }
    if (moveLeft) {
        //controls.moveRight(-moveSpeed)
        isMoving = true
    }

    // Bob camera
    //if (isMoving) camera.position.y = (Math.sin(frame/4) * (tileScale/20)) + playerHeight
}