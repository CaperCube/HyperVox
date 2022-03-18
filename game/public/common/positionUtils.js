/**
 * Converts global position to chunk / block coordinates
 * @param position: { x, y, z }
 * @param chunkSize: number
 * @returns location: chunk: { x, y, z }, block: { x, y, z }
 */
const getArrayPos = (position, chunkSize) => {
    const location = {
        chunk: {x: Math.floor(position.x / chunkSize), y: Math.floor(position.y / chunkSize), z: Math.floor(position.z / chunkSize) },
        block: {x: Math.floor(position.x % chunkSize), y: Math.floor(position.y % chunkSize), z: Math.floor(position.z % chunkSize) }
    }
    return location
}

/**
 * Converts chunk / block position to global position
 * @param location: { chunk: { x, y, z }, block: { x, y, z } }
 * @param chunkSize: number
 * @returns position: { x, y, z }
 */
 const getGlobalPos = (location, chunkSize) => {
    const position = {
        x: ((location.block.x) + (location.chunk.x * chunkSize)),
        y: ((location.block.y) + (location.chunk.y * chunkSize)),
        z: ((location.block.z) + (location.chunk.z * chunkSize))
    }
    return position
}

export {
    getArrayPos,
    getGlobalPos
}
