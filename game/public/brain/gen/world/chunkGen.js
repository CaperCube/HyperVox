import perlinNoise3d from "../../../client/js/dist/pnoise3d.js"

////////////////////////////////////////////////////
// Chunk generators
////////////////////////////////////////////////////
class ChunkGenerator {
    constructor() {
        this.noiseScale = 0.09
        this.noiseTolerance = 0.5
        this.noiseAlgorithm = new perlinNoise3d()
    }

    ////////////////////////////////////////////////////
    // Chunk / Block generators
    ////////////////////////////////////////////////////

    // Perlin generate chunk
    // Returns new Chunk[[[]]]
    generateChunk(offset = {x: 0, y: 0, z: 0}, chunkSize) {
        let newChunk = [[[]]]
        let chunkEmpty = true
    
        for (let y = 0; y < chunkSize; y++) { // Y
        newChunk[y] = []
        for (let x = 0; x < chunkSize; x++) { // X
        newChunk[y][x] = []
        for (let z = 0; z < chunkSize; z++) { // Z

            // Generate block ID
            let pos = { x: (x+offset.x), y: (y+offset.y), z: (z+offset.z) }
            // ToDo: at some point we can expose the world gen function here in a drop-down list or something
            let randTile = this.basicPattern(pos.x, pos.y, pos.z)
            if (randTile > 0) chunkEmpty = false
            if (pos.y === 0) randTile = 6
    
            // Put new ID into stored chunk
            newChunk[y][x][z] = randTile
        }}}
    
        return newChunk
    }

    // Generate world (This should be changed to return a full world chunk array, which will be stored in the currently open `World` object)
    // Returns new Mesh[]
    generateWorld({seed, chunkSize, worldSize}) {
        // Set the seed from the world data
        const stringToSeed = (s) => { return s.split('').map(x=>x.charCodeAt(0)).reduce((a,b)=>a+b) } // Converts the seed from a string to a useable number
        if (seed) this.noiseAlgorithm.noiseSeed(stringToSeed(seed)) // Changing the seed will change the value of `this.noiseAlgorithm.get(x,y,z)`

        // Generate the chunk data
        let worldChunks = [[[]]]
        for (let y = 0; y < worldSize; y++) {
            worldChunks[y] = []
        for (let x = 0; x < worldSize; x++) {
            worldChunks[y][x] = []
        for (let z = 0; z < worldSize; z++) {
            // Generate chunk with a position offset
            const chunkOffset = { x: x*chunkSize, y: y*chunkSize, z: z*chunkSize }
            const chunk = this.generateChunk(chunkOffset, chunkSize)
            worldChunks[y][x][z] = chunk
        }}}

        // This only returns the world chunk data, not the meshes
        return worldChunks
    }

    ////////////////////////////////////////////////////
    // Noise functions (all should return 0 or some valid block ID)
    ////////////////////////////////////////////////////

    // Used to clamp the generated values between 0 and 1
    clamp = (val, min, max) => { return Math.min(Math.max(val, min), max) }

    // Basic world generation pattern
    basicPattern = ( x, y, z ) => {
        // Return noise
        const getNoiseVal = ( x, y, z ) => {
            x=x*this.noiseScale
            y=y*this.noiseScale
            z=z*this.noiseScale
            let noise = this.noiseAlgorithm.get( x, y, z )
            noise += 1 / ((y+1)*2)
            noise -= 0.25
            return noise
        }
        
        // Check surrounding blocks
        const baseNoise = getNoiseVal( x, y, z )
        const blockAbove = getNoiseVal( x, y+1, z )
        const blockBelow = getNoiseVal( x, y-1, z )
        const blockMuchAbove = getNoiseVal( x, y+3, z )
    
        // Set blockID
        let blockID = 0
        if (baseNoise > this.noiseTolerance) {
            if (blockAbove <= this.noiseTolerance) blockID = 4
            else if (blockMuchAbove > this.noiseTolerance) blockID = 3
            else blockID = 2
    
            if (blockBelow <= this.noiseTolerance) blockID = 3
        }
    
        return blockID
    }
}

export default ChunkGenerator