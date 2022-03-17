/**
 * Converts global position to chunk / block coordinates
 * @argument position: { x, y, z }
 * @argument chunkSize: number
 
 * @returns chunk: { x, y, z }, block: { x, y, z }
 */
const getArrayPos = (position, chunkSize) => {
    return {
        chunk: {x: Math.floor(position.x / chunkSize), y: Math.floor(position.y / chunkSize), z: Math.floor(position.z / chunkSize) },
        block: {x: Math.floor(position.x % chunkSize), y: Math.floor(position.y % chunkSize), z: Math.floor(position.z % chunkSize) }
    }
}

export {
    getArrayPos
}
