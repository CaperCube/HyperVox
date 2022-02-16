////////////////////////////////////////////////////
// Chunk generators
////////////////////////////////////////////////////

// Noise vars
//const seed = '0000'
const noiseScale = 0.1
const noiseTolerance = 0.5
const genNoise = new perlinNoise3d()

// Perlin generate chunk
// Returns new Chunk[[[]]]
function generatePerlinChunk(offset = {x: 0, y: 0, z: 0}, chunkSize) {
    let newChunk = [[[]]]

    for (let y = 0; y < chunkSize; y++) { // Y
    newChunk[y] = []
    for (let x = 0; x < chunkSize; x++) { // X
    newChunk[y][x] = []
    for (let z = 0; z < chunkSize; z++) { // Z
        // Generate block ID
        const noiseVal = genNoise.get((x+offset.x)*noiseScale, (y+offset.y)*noiseScale, (z+offset.z)*noiseScale)
        let randTile = -1
        if (noiseVal > noiseTolerance) randTile = Math.floor(Math.random() * 9)

        // Put new ID into stored chunk
        newChunk[y][x][z] = randTile
    }}}

    return newChunk
}

// Generate world
// Returns new Mesh[]
// String to number
function generateSimpleWorld({seed, tileScale = 1, chunkSize, worldSize, scene}) {
    const stringToSeed = (s) => { return s.split('').map(x=>x.charCodeAt(0)).reduce((a,b)=>a+b) }
    if (seed) genNoise.noiseSeed(stringToSeed(seed)) // changing the seed will change the value of `genNoise.get(x,y,z)`

    let combinedMesh = []
    for (let y = 0; y < worldSize; y++) {
    for (let x = 0; x < worldSize; x++) {
    for (let z = 0; z < worldSize; z++) {
        let chunkOffset = { x: x*chunkSize, y: y*chunkSize, z: z*chunkSize }
        let myChunkMeshes = createChunkMesh(generatePerlinChunk(chunkOffset, chunkSize), chunkOffset, tileScale, scene)
        combinedMesh.push(BABYLON.Mesh.MergeMeshes(myChunkMeshes, true))
    }}}
    return combinedMesh
}

function World({worldSeed, tileScale, chunkSize, worldSize}) {
    const wSeed = worldSeed || Math.random()
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