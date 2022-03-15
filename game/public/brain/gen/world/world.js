//import { defaultChunkSize, defaultWorldSize } from '../../../client/js/clientConstants.js'
class World {
    // Remove tileScale (this probably shouldn't be so easy to change)
    constructor({worldSeed, tileScale, chunkSize, worldSize}) {
        this.worldChunks = [[[]]]
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
}

export default World