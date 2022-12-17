import '../dist/babylon.js'
// import { tileScale } from '../../../common/commonConstants.js'
import { blockTypes, blockCats, getBlocksByCat } from '../../../common/blockSystem.js'

class MeshGenerator {
    constructor() {
        //this.scene = scene
        //this.basicMaterial = mat1
        //this.transparentMaterial = mat2
    }

    ////////////////////////////////////////////////////
    // UV generators
    ////////////////////////////////////////////////////
    
    // Return UV coordinates for a quad based on the tile index
    // Returns new Vector4
    
    // We have defined an array called faceUV with size as 6 which are the sides of the cube. This array will always have Vector4 elements. Each Vector4(x, y, z, w) will be defined as follows −
    // x = Ubottom
    // y = Vbottom
    // z = Utop
    // w = Vtop
    getQuadUVByIndex(idx, row = 16, col = 16) {
        // Calculate ID offset
        const rows = row
        const columns = col
        let c = (idx-1) % columns
        let r = Math.floor((idx-1) / columns)
    
        // Set UV
        let faceUV = new BABYLON.Vector4(
            c / columns,        // U1
            (r + 1) / rows,     // V1
            (c + 1) / columns,  // U2
            r / rows            // V2
        )
    
        return faceUV
    }
    
    // Return UV coordinates for a block based on the tile index
    // Returns new Vector4[]
    getBlockUVByIndex(idx) {
        // Calculate ID offset
        const rows = 16
        const columns = 16
        let c = (idx-1) % columns
        let r = Math.floor((idx-1) / columns)
    
        // Set UVs
        let faceUV = []
        for (let i = 0; i < 6; i++) {
            faceUV[i] = new BABYLON.Vector4(
                c / columns,        // U1
                (r + 1) / rows,     // V1
                (c + 1) / columns,  // U2
                r / rows            // V2
            )
        }
    
        return faceUV
    }
    
    ////////////////////////////////////////////////////
    // Mesh Utils
    ////////////////////////////////////////////////////
    
    // Get the tile index UVs and create a box
    // Returns new Mesh
    createBlockWithUV({x, y, z}, idx, scene, tileScale = 1) {
        // Create box
        const block = BABYLON.MeshBuilder.CreateBox("Block", {
            size: tileScale,
            faceUV: this.getBlockUVByIndex(idx),
            wrap: true
        }, scene)
    
        //block.material = scene.defaultMaterial
        block.position = new BABYLON.Vector3(x, y, z)
    
        return block
    }
    
    // Get the tile index UVs and create a quad 
    // Returns new Mesh
    createQuadWithUVs(pos = {x: 0, y: 0, z: 0}, face = 'front', idx, scene, tileScale = 1, UVSize = {rows: 16, cols: 16}, shape = { x: 0, y: 0, z: 0, w: 1, h: 1, d: 1 }) {
        // TODO: Use this method: https://babylonjsguide.github.io/advanced/Custom
        // Create quad
        const quad = BABYLON.MeshBuilder.CreatePlane("BlockSide", {
            size: tileScale,
            frontUVs: this.getQuadUVByIndex(idx, UVSize.rows, UVSize.cols),
            backUVs: this.getQuadUVByIndex(idx, UVSize.rows, UVSize.cols),
            sideOrientation: BABYLON.Mesh.DOUBLESIDE // quad.sideOrientation = BABYLON.Mesh.DEFAULTSIDE
        }, scene)
    
        // Set material, position, and rotation
        quad.material = scene.defaultMaterial
        const offsetAmmount = tileScale
        const halfOffsetAmmount = offsetAmmount/2
        let offset = {x: 0, y: 0, z: 0}
        let rot = {x: 0, y: 0, z: 0}

        const shapeWidth = (((1 - shape.w) / 2) * offsetAmmount)
        const shapeDepth = (((1 - shape.d) / 2) * offsetAmmount)
        const shapeHeight = (((1 - shape.h) / 2) * offsetAmmount)

        switch (face) {
            case 'front':
                // offset.z = offsetAmmount
                offset = {x: halfOffsetAmmount, y: halfOffsetAmmount, z:offsetAmmount - shapeWidth }
                rot.y = Math.PI
                quad.scaling = new BABYLON.Vector3(shape.w, shape.h, shape.d)
                break
            case 'back':
                // offset.z = 0//-offsetAmmount
                offset = {x: halfOffsetAmmount, y: halfOffsetAmmount, z:0 + shapeWidth }
                rot.y = 0
                quad.scaling = new BABYLON.Vector3(shape.w, shape.h, shape.d)
                break
            case 'left':
                // offset.x = 0//-offsetAmmount
                offset = {x: 0 + shapeDepth, y: halfOffsetAmmount, z:halfOffsetAmmount }
                rot.y = Math.PI/2
                quad.scaling = new BABYLON.Vector3(shape.w, shape.h, shape.d)
                break
            case 'right':
                // offset.x = offsetAmmount
                offset = {x: offsetAmmount - shapeDepth, y: halfOffsetAmmount, z:halfOffsetAmmount }
                rot.y = -Math.PI/2
                quad.scaling = new BABYLON.Vector3(shape.w, shape.h, shape.d)
                break
            case 'top':
                // offset.y = offsetAmmount
                offset = {x: halfOffsetAmmount, y: offsetAmmount - shapeHeight, z:halfOffsetAmmount }
                rot.x = Math.PI/2
                quad.scaling = new BABYLON.Vector3(shape.w, shape.d, shape.h)
                break
            case 'bottom':
                // offset.y = 0//-offsetAmmount
                offset = {x: halfOffsetAmmount, y: 0 + shapeHeight, z:halfOffsetAmmount }
                rot.x = -Math.PI/2
                quad.scaling = new BABYLON.Vector3(shape.w, shape.d, shape.h)
                break
            default:
                break
        }
        quad.position = new BABYLON.Vector3((pos.x + offset.x) + (shape.x * offsetAmmount), (pos.y + offset.y) + (shape.y * offsetAmmount), (pos.z + offset.z) + (shape.z * offsetAmmount))
        quad.rotation = new BABYLON.Vector3(rot.x, rot.y, rot.z)
    
        return quad
    }
    
    // Create chunk border
    createChunkBorder(pos = {x: 0, y: 0, z: 0}, rot = {x: 0, y: 0, z: 0}, wallSize, scene) {
        // Create quad
        const UVs = this.getQuadUVByIndex(256)
    
        const plane = BABYLON.MeshBuilder.CreateTiledPlane("ChunkBorder", {
            size: wallSize,
            tileSize: 2,
            frontUVs: UVs,
            backUVs: UVs,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE // quad.sideOrientation = BABYLON.Mesh.DEFAULTSIDE
        }, scene)
        plane.material = scene.transparentMaterial//material
    
        plane.position = new BABYLON.Vector3(pos.x, pos.y, pos.z)
        plane.rotation = new BABYLON.Vector3(rot.x, rot.y, rot.z)
    
        return plane
    }

    // Get the chunk and its neighbors from the world and coordinates
    // Returns ChunkGroup{}
    getChunkGroup(world, chunkLocation = { x: 0, y: 0, z: 0 }) {
        const wSize = world[0].length

        const xMin = ((chunkLocation.x-1) < 0)          ? null : chunkLocation.x-1
        const xMax = ((chunkLocation.x+1) > wSize-1)    ? null : chunkLocation.x+1

        const yMin = ((chunkLocation.y-1) < 0)          ? null : chunkLocation.y-1
        const yMax = ((chunkLocation.y+1) > wSize-1)    ? null : chunkLocation.y+1

        const zMin = ((chunkLocation.z-1) < 0)          ? null : chunkLocation.z-1
        const zMax = ((chunkLocation.z+1) > wSize-1)    ? null : chunkLocation.z+1
    
        return {
            chunkLocation: chunkLocation,
            thisChunk: world[chunkLocation.y][chunkLocation.x][chunkLocation.z],
            downChunk: world[yMin]?.[chunkLocation.x]?.[chunkLocation.z],
            upChunk: world[yMax]?.[chunkLocation.x]?.[chunkLocation.z],
            leftChunk: world[chunkLocation.y]?.[xMin]?.[chunkLocation.z],
            rightChunk: world[chunkLocation.y]?.[xMax]?.[chunkLocation.z],
            backChunk: world[chunkLocation.y]?.[chunkLocation.x]?.[zMin],
            frontChunk: world[chunkLocation.y]?.[chunkLocation.x]?.[zMax]
        }
    }
    
    ////////////////////////////////////////////////////
    // Mesh generators
    ////////////////////////////////////////////////////

    // Create chunk block
    // Returns new Mesh[]
    createChunkBlock(chunkGroup, blockLocation, blockID, scene, tileScale = 1) {
        // const transparentTiles = getBlocksByCat(blockCats.transparent)//[0,10,255,256]
        let meshArray = []

        // if this is not an air block, continue
        if (blockID !== 0) {
            // Get block type
            const thisBlockType = blockTypes[blockID] // ToDo: use this: getBlockType(blockID)
            const shape = thisBlockType.shape

            // Check front, back, left, right, top, bottom
            const chunk = chunkGroup.thisChunk
            const chunkSize = chunk[0].length // Get chunk size from y length of first chunk
            const offset = { x: chunkGroup.chunkLocation.x*chunkSize, y: chunkGroup.chunkLocation.y*chunkSize, z: chunkGroup.chunkLocation.z*chunkSize }
            const globalPos = { x: (blockLocation.x+offset.x)*tileScale, y: (blockLocation.y+offset.y)*tileScale, z: (blockLocation.z+offset.z)*tileScale }

            // Right
            let blockHere = chunk[blockLocation.y]?.[blockLocation.x+1]?.[blockLocation.z]
            if ((blockLocation.x+1) >= chunkSize) blockHere = chunkGroup.rightChunk?.[blockLocation.y]?.[0]?.[blockLocation.z]
            let blockTypeHere = blockTypes[blockHere]
            let otherShape = blockTypeHere?.shape || null
            // if (!blockHere || transparentTiles.includes(blockHere))
            if ((!blockHere && !shape) || (blockTypeHere?.categories?.includes(blockCats.transparent) && !thisBlockType?.categories?.includes(blockCats.transparent))){
                {const face = 'right'
                const textureID = thisBlockType?.textures[face] || 0
                if (textureID > 0) meshArray.push( this.createQuadWithUVs(globalPos, face, textureID, scene, tileScale, {rows: 16, cols: 16}, shape) )}
            }

            // Left
            blockHere = chunk[blockLocation.y]?.[blockLocation.x-1]?.[blockLocation.z]
            if ((blockLocation.x-1) < 0) blockHere = chunkGroup.leftChunk?.[blockLocation.y]?.[chunkSize-1]?.[blockLocation.z]
            blockTypeHere = blockTypes[blockHere]
            otherShape = blockTypeHere?.shape || null
            if ((!blockHere && !shape) || (blockTypeHere?.categories?.includes(blockCats.transparent) && !thisBlockType?.categories?.includes(blockCats.transparent))){
                {const face = 'left'
                const textureID = thisBlockType?.textures[face] || 0
                if (textureID > 0) meshArray.push( this.createQuadWithUVs(globalPos, face, textureID, scene, tileScale, {rows: 16, cols: 16}, shape) )}
            }

            // Front
            blockHere = chunk[blockLocation.y]?.[blockLocation.x]?.[blockLocation.z+1]
            if ((blockLocation.z+1) >= chunkSize) blockHere = chunkGroup.frontChunk?.[blockLocation.y]?.[blockLocation.x]?.[0]
            blockTypeHere = blockTypes[blockHere]
            otherShape = blockTypeHere?.shape || null
            if ((!blockHere && !shape) || (blockTypeHere?.categories?.includes(blockCats.transparent) && !thisBlockType?.categories?.includes(blockCats.transparent))){
                {const face = 'front'
                const textureID = thisBlockType?.textures[face] || 0
                if (textureID > 0) meshArray.push( this.createQuadWithUVs(globalPos, face, textureID, scene, tileScale, {rows: 16, cols: 16}, shape) )}
            }

            // Back
            blockHere = chunk[blockLocation.y]?.[blockLocation.x]?.[blockLocation.z-1]
            if ((blockLocation.z-1) < 0) blockHere = chunkGroup.backChunk?.[blockLocation.y]?.[blockLocation.x]?.[chunkSize-1]
            blockTypeHere = blockTypes[blockHere]
            otherShape = blockTypeHere?.shape || null
            if ((!blockHere && !shape) || (blockTypeHere?.categories?.includes(blockCats.transparent) && !thisBlockType?.categories?.includes(blockCats.transparent))){
                {const face = 'back'
                const textureID = thisBlockType?.textures[face] || 0
                if (textureID > 0) meshArray.push( this.createQuadWithUVs(globalPos, face, textureID, scene, tileScale, {rows: 16, cols: 16}, shape) )}
            }

            // Top
            blockHere = chunk[blockLocation.y+1]?.[blockLocation.x]?.[blockLocation.z]
            if ((blockLocation.y+1) >= chunkSize) blockHere = chunkGroup.upChunk?.[0]?.[blockLocation.x]?.[blockLocation.z]
            blockTypeHere = blockTypes[blockHere]
            otherShape = blockTypeHere?.shape || null
            if ((!blockHere && !shape) || (blockTypeHere?.categories?.includes(blockCats.transparent) && !thisBlockType?.categories?.includes(blockCats.transparent))){
                {const face = 'top'
                const textureID = thisBlockType?.textures[face] || 0
                if (textureID > 0) meshArray.push( this.createQuadWithUVs(globalPos, face, textureID, scene, tileScale, {rows: 16, cols: 16}, shape) )}
            }

            // Bottom
            blockHere = chunk[blockLocation.y-1]?.[blockLocation.x]?.[blockLocation.z]
            if ((blockLocation.y-1) < 0) blockHere = chunkGroup.downChunk?.[chunkSize-1]?.[blockLocation.x]?.[blockLocation.z]
            blockTypeHere = blockTypes[blockHere]
            otherShape = blockTypeHere?.shape || null
            if ((!blockHere && !shape) || (blockTypeHere?.categories?.includes(blockCats.transparent) && !thisBlockType?.categories?.includes(blockCats.transparent))){
                {const face = 'bottom'
                const textureID = thisBlockType?.textures[face] || 0
                if (textureID > 0) meshArray.push( this.createQuadWithUVs(globalPos, face, textureID, scene, tileScale, {rows: 16, cols: 16}, shape) )}
            }
        }

        return (meshArray.length > 0)? meshArray : null
    }

    // Create a hollow mesh from chunk
    // Returns new Mesh[]
    createChunkMesh(chunkGroup, scene, tileScale = 1) {  
        // We'll store our quads here
        let meshArray = []
        let chunkIsEmpty = true

        const chunk = chunkGroup.thisChunk

        // Step through each block in the chunk
        for (let y = 0; y < chunk.length; y++) {
        for (let x = 0; x < chunk[y].length; x++) {
        for (let z = 0; z < chunk[y][x].length; z++) {
            let blockID = chunk[y][x][z]

            // Create the visible sides of this block
            const newblock = this.createChunkBlock(chunkGroup, {x:x,y:y,z:z}, blockID, scene, tileScale)

            // If new meshes were created, add them to the mesh array
            if (newblock) {
                // If even 1 block is created, the chunk is not empty
                chunkIsEmpty = false
                newblock.forEach(m => { if (m) meshArray.push( m )})
            }
        }}}
        return chunkIsEmpty? null: meshArray
    }

    // Create world borders
    createWorldBorders(world, scene) {
        let worldBorders = []
        const tileScale = world._tileScale
        const wallSize = tileScale * world.getChunkSize() * world.getWorldSize()
        const borderOffset = (tileScale * world.getChunkSize() * world.getWorldSize())
        const borderOffsetHalf = ((tileScale * world.getChunkSize() * world.getWorldSize())/2)
        worldBorders.push(this.createChunkBorder({x: borderOffsetHalf, y: borderOffsetHalf, z: borderOffset}, {x: 0, y: Math.PI, z: 0}, wallSize, scene)) // Front
        worldBorders.push(this.createChunkBorder({x: borderOffsetHalf, y: borderOffsetHalf, z: 0}, {x: 0, y: 0, z: 0}, wallSize, scene)) // Back
        worldBorders.push(this.createChunkBorder({x: 0, y: borderOffsetHalf, z: borderOffsetHalf}, {x: 0, y: Math.PI/2, z: 0}, wallSize, scene)) // Left
        worldBorders.push(this.createChunkBorder({x: borderOffset, y: borderOffsetHalf, z: borderOffsetHalf}, {x: 0, y: -Math.PI/2, z: 0}, wallSize, scene)) // Right
        const worldBorderMeshes = BABYLON.Mesh.MergeMeshes(worldBorders, true)

        return worldBorderMeshes
    }

    ////////////////////////////////////////////////////
    // Mesh Updaters
    ////////////////////////////////////////////////////

    // Update chunk mesh
    updateChunkMesh(chunk, changePostion, removing) {
        // Check parts of chunk that have changed
        // if (removing) Remove connecting block faces
        // generate new faces
    }
}

export default MeshGenerator