////////////////////////////////////////////////////
// Chunk generators
////////////////////////////////////////////////////

// Noise vars
//const seed = '0000'
const noiseScale = 0.09
const noiseTolerance = 0.5
const genNoise = new perlinNoise3d()

// Perlin generate chunk
// Returns new Chunk[[[]]]
function generatePerlinChunk(offset = {x: 0, y: 0, z: 0}, chunkSize) {
    let newChunk = [[[]]]
    let chunkEmpty = true

    for (let y = 0; y < chunkSize; y++) { // Y
    newChunk[y] = []
    for (let x = 0; x < chunkSize; x++) { // X
    newChunk[y][x] = []
    for (let z = 0; z < chunkSize; z++) { // Z
        // Generate block ID
        //let pos = { x: (x+offset.x)*noiseScale, y: (y+offset.y)*noiseScale, z: (z+offset.z)*noiseScale }
        let pos = { x: (x+offset.x), y: (y+offset.y), z: (z+offset.z) }
        //const noiseVal = genNoise.get((x+offset.x)*noiseScale, (y+offset.y)*noiseScale, (z+offset.z)*noiseScale)
        // const noiseVal = customNoise(pos.x, pos.y, pos.z)
        let randTile = customNoise(pos.x, pos.y, pos.z)
        if (randTile > 0) chunkEmpty = false
        // if (noiseVal > noiseTolerance) {
        //     randTile = 1 + Math.floor(Math.random() * 9)
        //     chunkEmpty = false
        // }
        if (pos.y === 0) randTile = 6

        // Put new ID into stored chunk
        newChunk[y][x][z] = randTile
    }}}

    if (!chunkEmpty) return newChunk
    else return null
}

// Generate world (This should be changed to return a full world chunk array, which will be stored in the currently open `World` object)
// Returns new Mesh[]
function generateSimpleWorld({seed, tileScale = 1, chunkSize, worldSize, scene}) {
    const stringToSeed = (s) => { return s.split('').map(x=>x.charCodeAt(0)).reduce((a,b)=>a+b) }
    if (seed) genNoise.noiseSeed(stringToSeed(seed)) // changing the seed will change the value of `genNoise.get(x,y,z)`

    let worldChunkMeshes = []
    for (let y = 0; y < worldSize; y++) {
    for (let x = 0; x < worldSize; x++) {
    for (let z = 0; z < worldSize; z++) {
        let chunkOffset = { x: x*chunkSize, y: y*chunkSize, z: z*chunkSize }
        let chunk = generatePerlinChunk(chunkOffset, chunkSize)
        // Only create mesh if chunk is empty
        if (chunk) {
            let myChunkMeshes = createChunkMesh(chunk, chunkOffset, tileScale, scene)
            worldChunkMeshes.push(BABYLON.Mesh.MergeMeshes(myChunkMeshes, true))
        }
    }}}
    return worldChunkMeshes
}

function World({worldSeed, tileScale, chunkSize, worldSize}) {
    const wSeed = worldSeed || `${Math.random()}`
    this.getWorldSeed = () => { return wSeed }

    const _tileScale = tileScale || 1
    /**
     * Gets the scale of tiles in the world
     * @returns number
     */
    this.getTileScale = () => { return _tileScale }

    const _chunkSize = chunkSize || 16
    /**
     * Gets the number of blocks in a chunk blocks^3 (16 = chunk size of 16x16x16)
     * @returns number
     */
    this.getChunkSize = () => { return _chunkSize }

    const _worldSize = worldSize || 3
    /**
     * Gets the number of chunks in a chunk in chunks^3 (16 = world size of 16x16x16)
     * @returns number
     */
    this.getWorldSize = () => { return _worldSize }

    /**
     * Get the world as a string
     * @returns json string
     */
    this.saveWorld = () => { return 'This is supposed to return the world in json format' }
}

////////////////////////////////////////////////////
// Noise functions
////////////////////////////////////////////////////
//include block type in the noise generator
//noiseVal = customNoise(pos.x, pos.y, pos.z)
//e.g `customNoise()` returns `{value, block}`

// Used to clamp the generated values between 0 and 1
const clamp = function(val, min, max) { return Math.min(Math.max(val, min), max) }

// Example custom noise function
// function customNoise( x, y, z ) {
//     // Return noise
//     let noise = genNoise.get( x, y*2, z )
//     noise += 1 / ((y+1)*2)
//     noise -= 0.25

//     return clamp(noise, 0, 1)
// }

function customNoise( x, y, z ) {
    // Return noise
    function getNoiseVal( x, y, z ) {
        x=x*noiseScale
        y=y*noiseScale
        z=z*noiseScale
        let noise = genNoise.get( x, y, z )
        noise += 1 / ((y+1)*2)
        noise -= 0.25
        return noise
    }
    
    const baseNoise = getNoiseVal( x, y, z )
    const blockAbove = getNoiseVal( x, y+1, z )
    const blockBelow = getNoiseVal( x, y-1, z )
    const blockMuchAbove = getNoiseVal( x, y+3, z )

    // gen blockID
    let blockID = 0
    if (baseNoise > noiseTolerance) {
        if (blockAbove <= noiseTolerance) blockID = 4
        else if (blockMuchAbove > noiseTolerance) blockID = 3
        else blockID = 2

        if (blockBelow <= noiseTolerance) blockID = 3
    }

    return blockID
}