/**
 * Converts global position to chunk / block coordinates
 * @param position: { x, y, z }
 * @param chunkSize: number
 * @returns location: chunk: { x, y, z }, block: { x, y, z }
 */
const getArrayPos = (position, chunkSize, tileScale = 1) => {
    const p = {
        x: position.x / tileScale,
        y: position.y / tileScale,
        z: position.z / tileScale
    }
    const location = {
        chunk: {x: Math.floor(p.x / chunkSize), y: Math.floor(p.y / chunkSize), z: Math.floor(p.z / chunkSize) },
        block: {x: Math.floor(p.x % chunkSize), y: Math.floor(p.y % chunkSize), z: Math.floor(p.z % chunkSize) }
    }
    return location
}

/**
 * Converts chunk / block position to global position
 * @param location: { chunk: { x, y, z }, block: { x, y, z } }
 * @param chunkSize: number
 * @returns position: { x, y, z }
 */
 const getGlobalPos = (location, chunkSize, tileScale = 1) => {
    const position = {
        x: ((location.block.x) + (location.chunk.x * chunkSize)) * tileScale,
        y: ((location.block.y) + (location.chunk.y * chunkSize)) * tileScale,
        z: ((location.block.z) + (location.chunk.z * chunkSize)) * tileScale
    }
    return position
}

/**
 * Checks for intersections between two boxes
 * @param box1: { x, y, z, width, height, depth }
 * @param box2: { x, y, z, width, height, depth }
 * @returns bool
 */
const boxIsIntersecting = (box1 = {x: 0, y: 0, z: 0, w: 1, h: 1, d: 1}, box2 = {x: 0, y: 0, z: 0, w: 1, h: 1, d: 1}) => {
    // Box origin is in center
    var a = {
        minX : box1.x - (box1.w/2),
        maxX : box1.x + (box1.w/2),
        minZ : box1.z - (box1.d/2),
        maxZ : box1.z + (box1.d/2),
        minY : box1.y - (box1.h/2),
        maxY : box1.y + (box1.h/2),
    }
    var b = {
        minX : box2.x - (box2.w/2),
        maxX : box2.x + (box2.w/2),
        minZ : box2.z - (box2.d/2),
        maxZ : box2.z + (box2.d/2),
        minY : box2.y - (box2.h/2),
        maxY : box2.y + (box2.h/2),
    }
    return (a.minX <= b.maxX && a.maxX >= b.minX) &&
           (a.minY <= b.maxY && a.maxY >= b.minY) &&
           (a.minZ <= b.maxZ && a.maxZ >= b.minZ)
}

export {
    getArrayPos,
    getGlobalPos,
    boxIsIntersecting
}
