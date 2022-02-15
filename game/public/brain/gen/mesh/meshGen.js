////////////////////////////////////////////////////
// UV generators
////////////////////////////////////////////////////

// Return UV coordinates for a quad based on the tile index
// Returns new Vector4
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
// Returns new Vector4[]
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

////////////////////////////////////////////////////
// Mesh generators
////////////////////////////////////////////////////

// Get the tile index UVs and create a box
// Returns new Mesh
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

// Get the tile index UVs and create a quad 
// Returns new Mesh
function createQuadWithUVs(pos = {x: 0, y: 0, z: 0}, tileScale, face = 'front', idx, scene) {
    // TODO: Use this method: https://babylonjsguide.github.io/advanced/Custom
    // Create quad
    const quad = BABYLON.MeshBuilder.CreatePlane("BlockFace", {
        size: tileScale,
        frontUVs: getQuadUVByIndex(idx),
        backUVs: getQuadUVByIndex(idx),
        sideOrientation: BABYLON.Mesh.DOUBLESIDE // quad.sideOrientation = BABYLON.Mesh.DEFAULTSIDE
    }, scene)

    // Set material, position, and rotation
    quad.material = mat
    const offsetAmmount = (tileScale/2)
    let offset = {x: 0, y: 0, z: 0}
    let rot = {x: 0, y: 0, z: 0}
    switch (face) {
        case 'front':
            offset.x = offsetAmmount
            rot.y = Math.PI/2
            break
        case 'back':
            offset.x = -offsetAmmount
            rot.y = -Math.PI/2
            break
        case 'left':
            offset.z = -offsetAmmount
            rot.y = Math.PI
            break
        case 'right':
            offset.z = offsetAmmount
            rot.y = 0
            break
        case 'top':
            offset.y = offsetAmmount
            rot.x = Math.PI/2
            break
        case 'bottom':
            offset.y = -offsetAmmount
            rot.x = -Math.PI/2
            break
        default:
            break
    }
    quad.position = new BABYLON.Vector3((pos.x + offset.x), (pos.y + offset.y), (pos.z + offset.z))
    quad.rotation = new BABYLON.Vector3(rot.x, rot.y, rot.z)

    return quad
}

// Create a hollow mesh from chunk
// Returns new Mesh[]
function createChunkMesh(chunk, offset = { x: 0, y: 0, z: 0 }, tileScale, scene) {
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
            let tilePos = {x: (x+offset.x)*tileScale, y: (y+offset.y)*tileScale, z: (z+offset.z)*tileScale}
            // Front
            let blockHere = chunk[y]?.[x+1]?.[z]
            if (!blockHere || transparentTiles.includes(blockHere))
                meshArray.push( createQuadWithUVs(tilePos, tileScale, 'front', tileID, scene) )

            // Back
            blockHere = chunk[y]?.[x-1]?.[z]
            if (!blockHere || transparentTiles.includes(blockHere))
                meshArray.push( createQuadWithUVs(tilePos, tileScale, 'back', tileID, scene) )

            // Left
            blockHere = chunk[y]?.[x]?.[z-1]
            if (!blockHere || transparentTiles.includes(blockHere))
                meshArray.push( createQuadWithUVs(tilePos, tileScale, 'left', tileID, scene) )

            // Right
            blockHere = chunk[y]?.[x]?.[z+1]
            if (!blockHere || transparentTiles.includes(blockHere))
                meshArray.push( createQuadWithUVs(tilePos, tileScale, 'right', tileID, scene) )

            // Top
            blockHere = chunk[y+1]?.[x]?.[z]
            if (!blockHere || transparentTiles.includes(blockHere))
                meshArray.push( createQuadWithUVs(tilePos, tileScale, 'top', tileID, scene) )

            // Bottom
            blockHere = chunk[y-1]?.[x]?.[z]
            if (!blockHere || transparentTiles.includes(blockHere))
                meshArray.push( createQuadWithUVs(tilePos, tileScale, 'bottom', tileID, scene) )
        }
    }}}
    return meshArray
}

// (Depricated)
// Create blocks from chunk
// Returns new Mesh[]
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