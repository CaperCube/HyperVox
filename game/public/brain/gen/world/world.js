import { getArrayPos } from "../../../common/positionUtils.js"

//import { defaultChunkSize, defaultWorldSize } from '../../../client/js/clientConstants.js'
class World {
    // Remove tileScale (this probably shouldn't be so easy to change)
    constructor({worldSeed, tileScale = 1, chunkSize = 8, worldSize = 4} = {}) {
        this._worldFormatVersion = 'v0.1'
        this.worldChunks = [[[]]]
        this._wSeed = worldSeed || `${Math.random()}`
        
        const worldMax = (worldSize || 4) * (chunkSize || 8) * (tileScale || 1)
        this.worldSpawn = getArrayPos({ x: worldMax/2, y: worldMax, z: worldMax/2 }, chunkSize || 16)
        // bazingo
        this.embeds = {}

        this.getWorldSeed = () => { return this._wSeed }

        this._tileScale = tileScale || 1
        /**
         * Gets the scale of tiles in the world
         * @returns number
         */
        this.getTileScale = () => { return this._tileScale }

        this._chunkSize = chunkSize || 8
        /**
         * Gets the number of blocks in a chunk blocks^3 (8 = chunk size of 8x8x8)
         * @returns number
         */
        this.getChunkSize = () => { return this._chunkSize }

        this._worldSize = worldSize || 4
        /**
         * Gets the number of chunks in a chunk in chunks^3 (8 = world size of 8x8x8)
         * @returns number
         */
        this.getWorldSize = () => { return this._worldSize }

        /**
         * Get the world as a string
         * @returns json string
         */
        this.saveWorld = () => { return 'This is supposed to return the world in json format' }
    }

    loadWorldFromJSON( jsonObj ) {
        // worldFormat v0.1
        this.worldChunks = jsonObj.worldChunks
        this.worldSpawn = jsonObj.worldSpawn
        this.embeds = jsonObj.embeds // bazingo
        this._wSeed = jsonObj._wSeed
        this._tileScale = jsonObj._tileScale
        this._chunkSize = jsonObj._chunkSize
        this._worldSize = jsonObj._worldSize
    }
}

function copyWorld( world ) {
    const clone = JSON.parse(JSON.stringify(world))

    // Create new world with the same size and seed as the old one
    const newWorld = new World({
        worldSeed: clone._wSeed,
        tileScale: parseFloat(clone._tileScale),
        chunkSize: parseFloat(clone._chunkSize),
        worldSize: parseFloat(clone._worldSize)
    })

    // Set props that weren't set from constructor
    newWorld.worldChunks = clone.worldChunks
    // Spawn
    const worldMax = newWorld._worldSize * newWorld._chunkSize * newWorld._tileScale
    const defaultWorldSpawn = getArrayPos({ x: worldMax/2, y: worldMax, z: worldMax/2 }, newWorld._chunkSize)
    newWorld.worldSpawn = clone.worldSpawn || defaultWorldSpawn
    // Embeds
    // bazingo
    newWorld.embeds = clone.embeds

    return newWorld
}

export default World
export { copyWorld }