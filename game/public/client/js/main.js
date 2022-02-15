// `var block = 0x00000000` A single hex value to represent the block ID, orientation, damage value, and state (open/closed, other)
// 0x 0000      00      0       0
//    BlockID   Rot     Damage  State
// `var chunk = [[[]]]` A 16x16x16 array to hold the current chunk's blocks
// `chunk = [ [ [ 0x010000, 0x010000, 0x010000, ... ], ... ], ... ]` Example chunk
// `var visibleChunks = [[[]]]` A 5x5x5 array to hold the visible chunks
// `var world.chunks = [[[]]]` A _x_x_ array to hold the chunks for the whole world
// `var visibleMesh = FlattenChunks(visibleChunks)`

////////////////////////////////////////////////////
// Vars
////////////////////////////////////////////////////
// Chunk coordinate format: chunk[y][x][z]
const testChunk = [
    [ [-1,-1,-1,-1,-1],     [-1,-1,-1,-1,-1],   [-1,-1,3,-1,-1],    [-1,-1,-1,-1,-1],   [-1,-1,-1,-1,-1] ],    // Top Y layer
    [ [-1,-1,-1,-1,-1],     [-1,-1,-1,-1,-1],   [-1,-1,3,-1,-1],    [-1,-1,-1,-1,-1],   [-1,-1,-1,-1,-1] ],
    [ [-1,-1,6,-1,-1],      [-1,-1,6,-1,-1],    [4,4,-1,4,4],       [-1,-1,6,-1,-1],    [-1,-1,6,-1,-1] ],
    [ [-1,-1,-1,-1,-1],     [-1,-1,-1,-1,-1],   [-1,-1,3,-1,-1],    [-1,-1,-1,-1,-1],   [-1,-1,-1,-1,-1] ],
    [ [-1,-1,-1,-1,-1],     [-1,-1,-1,-1,-1],   [-1,-1,3,-1,-1],    [-1,-1,-1,-1,-1],   [-1,-1,-1,-1,-1] ]     // Bottom Y layer
]

let genChunk = [[[]]]
let genY = 0, genX = 0, genZ = 0

// Noise vars
const seed = '0000'
const noiseScale = 0.1
const noiseTolerance = 0.5
const genNoise = new perlinNoise3d()
genNoise.noiseSeed(seed) // changing the seed will change the value of `genNoise.get(x,y,z)`
console.log(genNoise)

// Material for most blocks
let mat, texture
let frame = 0
//let controls;

let renderScale = 1

const tileScale = 1
const worldSize = 1//4 // In num of chunks
const chunkSize = 16
const fogDist = 1000//tileScale*chunkSize*2
let middle = ((worldSize * chunkSize) / 2) - (tileScale/2)
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
    let middleTarget = new BABYLON.Vector3(middle, middle, middle)
    var camera = new BABYLON.ArcRotateCamera('camera1', Math.PI/4, Math.PI/4, 40, middleTarget, scene)
    //var camera = new BABYLON.UniversalCamera('playerCamera', middleTarget, scene)
    camera.minZ = tileScale/5
    camera.maxZ = fogDist
    camera.attachControl(canvas, true)

    // Create light in scene
    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0))
    //light.intensity = 1
    //const light2 = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(1, -1, 0), scene);

    // Create block material
    mat = new BABYLON.StandardMaterial('mat')
    texture = new BABYLON.Texture(imageSRC.Tiles, scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE)
    mat.diffuseTexture = texture
    //mat.backFaceCulling = true;
    mat.specularColor = new BABYLON.Color3(0, 0, 0)

    // Fog
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP
    scene.fogDensity = 0//0.15
    scene.fogStart = fogDist/2//tileScale*5
    scene.fogEnd = fogDist
    scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR//FOGMODE_EXP
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
// createRandomFloor(worldSize)
// let blockMeshes = createBlocksFromChunk(testChunk)
// console.log(blockMeshes)
//createQuadWithUVs({x: 0, y: 0, z: 0}, 'front', 0)
createChunkMesh(generatePerlinChunk())
/*
let combinedMesh = []
for (let y = 0; y < worldSize; y++) {
    for (let x = 0; x < worldSize; x++) {
        for (let z = 0; z < worldSize; z++) {
            let chunkOffset = { x: x*chunkSize, y: y*chunkSize, z: z*chunkSize }
            let myChunkMeshes = createBlocksFromChunk(generatePerlinChunk(chunkOffset), chunkOffset)
            combinedMesh.push(BABYLON.Mesh.MergeMeshes(myChunkMeshes, true))

            // let thisMesh = combinedMesh[combinedMesh.length-1]
            // if (thisMesh) {
            //     //console.log(combinedMesh)
            //     //combinedMesh.simplify([{quality:0.75, distance: 0, }])//optimizeMesh: true}])
            //     //combinedMesh.convertToUnIndexedMesh()
            //     //combinedMesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY
            // }
        }
    }
}
*/
//BABYLON.Mesh.MergeMeshes(combinedMesh, true)


//scene.freezeActiveMeshes()
initMovementControls()

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
    frame++
    //movementUpdate()
    // Update scene

    // generate new blocks
    // animateGeneratePerlinChunk()

    // render scene
    scene.render()
})

////////////////////////////////////////////////////
// Basic mesh creation
////////////////////////////////////////////////////
// Return UV coordinates for a quad based on the tile index
function getQuadUVByIndex(idx) {
    // Calculate ID offset
    const rows = 16
    const columns = 16
    let c = idx % columns
    let r = Math.floor(idx / columns)

    // Set UV
    let faceUV = new BABYLON.Vector4(
        c / columns,        // U1
        (r + 1) / rows,     // V1
        (c + 1) / columns,  // U2
        r / rows            // V2
    );

    return faceUV
}

// Return UV coordinates for a block based on the tile index
function getBlockUVByIndex(idx) {
    // Calculate ID offset
    const rows = 16
    const columns = 16
    let c = idx % columns
    let r = Math.floor(idx / columns)

    // Set UVs
    let faceUV = []
    for (let i = 0; i < 6; i++) {
        faceUV[i] = new BABYLON.Vector4(
            c / columns,        // U1
            (r + 1) / rows,     // V1
            (c + 1) / columns,  // U2
            r / rows            // V2
        );
    }

    return faceUV
}

// Get the tile index UVs and create a box
function createBlockWithUV({x, y, z}, idx) {
    // Create box
    const block = BABYLON.MeshBuilder.CreateBox("Block", {
        size: tileScale,
        faceUV: getBlockUVByIndex(idx),
        wrap: true
    }, scene)

    block.material = mat
    block.position = new BABYLON.Vector3(x, y, z)

    return block
}

// TODO: Remove this
// Create floor using createBlockWithUV()
function createRandomFloor(floorSize) {
    // Create floor
    for (let i = 0; i < floorSize; i++) {
        for (let j = 0; j < floorSize; j++) {
            // let randTile = 0
            let randTile = Math.floor(Math.random() * 8)
            if (j >= 24 && j <= 26 && i >= 24 && i <= 26) randTile = 4
            createBlockWithUV( {x: i*tileScale, y: 0, z: -j*tileScale}, randTile )
            //createQuadwithUV( {x: i*tileScale, y: 0, z: -j*tileScale}, texture, randTile )
        }
    }
}

function createQuadWithUVs(pos = {x: 0, y: 0, z: 0}, face = 'front', idx) {
    // TODO: Use this method: https://babylonjsguide.github.io/advanced/Custom
    // Create quad
    const quad = BABYLON.MeshBuilder.CreatePlane("Quad", {
        size: tileScale,
        frontUVs: getQuadUVByIndex(idx),
        backUVs: getQuadUVByIndex(idx),
        sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, scene)

    // Set material, position, and rotation
    // quad.sideOrientation = BABYLON.Mesh.DEFAULTSIDE
    quad.material = mat
    let offset = {x: 0, y: 0, z: 0}
    let rot = {x: 0, y: 0, z: 0}
    switch (face) {
        case 'front':
            offset.x = 0.5
            rot.y = Math.PI/2
            break
        case 'back':
            offset.x = -0.5
            rot.y = -Math.PI/2
            break
        case 'left':
            offset.z = -0.5
            rot.y = Math.PI
            break
        case 'right':
            offset.z = 0.5
            rot.y = 0
            break
        case 'top':
            offset.y = 0.5
            rot.x = Math.PI/2
            break
        case 'bottom':
            offset.y = -0.5
            rot.x = -Math.PI/2
            break
        default:
            break
    }
    quad.position = new BABYLON.Vector3((pos.x + offset.x)*tileScale, (pos.y + offset.y)*tileScale, (pos.z + offset.z)*tileScale)
    quad.rotation = new BABYLON.Vector3(rot.x, rot.y, rot.z)

    return quad
}

// Create a hollow mesh from chunk
function createChunkMesh(chunk, offset = { x: 0, y: 0, z: 0 }) {
    // Step through each block in the chunk
    // if the surrounding blocks are transparent / air blocks, add the indexed face

    // We'll store our quads here
    let meshArray = []
    const transparentTiles = [-1]

    for (let y = 0; y < chunk.length; y++) {
    for (let x = 0; x < chunk[y].length; x++) {
    for (let z = 0; z < chunk[y][x].length; z++) {
        let tileID = chunk[y][x][z]
        // if this is not an air block, continue
        if (!transparentTiles.includes(tileID)) {
            // Check front, back, left, right, top, bottom
            // Front
            let checkSpot = chunk[y]?.[x+1]?.[z]
            if (!checkSpot) createQuadWithUVs({x:x,y:y,z:z}, 'front', tileID)

            // Back
            checkSpot = chunk[y]?.[x-1]?.[z]
            if (!checkSpot) createQuadWithUVs({x:x,y:y,z:z}, 'back', tileID)

            // Left
            checkSpot = chunk[y]?.[x]?.[z-1]
            if (!checkSpot) createQuadWithUVs({x:x,y:y,z:z}, 'left', tileID)

            // Right
            checkSpot = chunk[y]?.[x]?.[z+1]
            if (!checkSpot) createQuadWithUVs({x:x,y:y,z:z}, 'right', tileID)

            // Top
            checkSpot = chunk[y+1]?.[x]?.[z]
            if (!checkSpot) createQuadWithUVs({x:x,y:y,z:z}, 'top', tileID)

            // Bottom
            checkSpot = chunk[y-1]?.[x]?.[z]
            if (!checkSpot) createQuadWithUVs({x:x,y:y,z:z}, 'bottom', tileID)
        }
    }}}
    return meshArray
}

// Create blocks from chunk (returns mesh array)
function createBlocksFromChunk(chunk, offset = { x: 0, y: 0, z: 0 }) {
    // Create chunk blocks
    let meshArray = []
    for (let y = 0; y < chunk.length; y++) {
    for (let x = 0; x < chunk[y].length; x++) {
    for (let z = 0; z < chunk[y][x].length; z++) {
        let tileID = chunk[y][x][z]
        if (tileID >= 0) {
            const newBlock = createBlockWithUV( {x: (x+offset.x)*tileScale, y: (y+offset.y)*tileScale, z: (z+offset.z)*tileScale}, tileID )
            meshArray.push(newBlock)
        }
    }}}
    return meshArray
}

// Perlin generate chunk (render loop function that lets us see it happen)
function animateGeneratePerlinChunk() {
    if (frame % 1 === 0) {
        if (genY < chunkSize) {
            if (genZ < chunkSize) {
                genZ++
                // Create block
                const noiseVal = genNoise.get(genX*noiseScale, genY*noiseScale, genZ*noiseScale)
                if (noiseVal > noiseTolerance) {
                    // Create mesh
                    let randTile = Math.floor(Math.random() * 8)
                    createBlockWithUV({x: genX*tileScale, y: genY*tileScale, z: genZ*tileScale}, randTile)
                    // Put new ID into stored chunk
                    genChunk[genY][genX][genZ] = randTile
                }
            }
            else {
                genZ = 0
                if (genX < chunkSize-1) {
                    genX++
                    // Extend the chunk
                    genChunk[genY][genX] = []
                }
                else {
                    genX = 0
                    genY++
                    // Extend the chunk
                    genChunk[genY] = [[]]
                }
            }
        }
    }
}

// Perlin generate chunk
function generatePerlinChunk(offset = {x: 0, y: 0, z: 0}) {
    let newChunk = [[[]]]

    for (let y = 0; y < 16; y++) { // Y
        newChunk[y] = []
        for (let x = 0; x < 16; x++) { // X
            newChunk[y][x] = []
            for (let z = 0; z < 16; z++) { // Z
                // Generate block ID
                const noiseVal = genNoise.get((x+offset.x)*noiseScale, (y+offset.y)*noiseScale, (z+offset.z)*noiseScale)
                let randTile = -1
                if (noiseVal > noiseTolerance) randTile = Math.floor(Math.random() * 9)

                // Put new ID into stored chunk
                newChunk[y][x][z] = randTile
            }
        }
    }

    return newChunk
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