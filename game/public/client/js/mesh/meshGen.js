import '../dist/babylon.max.js'
import { tileScale } from '../clientConstants.js'

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
    getQuadUVByIndex(idx) {
        // Calculate ID offset
        const rows = 16
        const columns = 16
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
    createBlockWithUV({x, y, z}, idx, scene) {
        // Create box
        const block = BABYLON.MeshBuilder.CreateBox("Block", {
            size: 1,
            faceUV: this.getBlockUVByIndex(idx),
            wrap: true
        }, scene)
    
        //block.material = scene.defaultMaterial
        block.position = new BABYLON.Vector3(x, y, z)
    
        return block
    }
    
    // Get the tile index UVs and create a quad 
    // Returns new Mesh
    createQuadWithUVs(pos = {x: 0, y: 0, z: 0}, face = 'front', idx, scene) {
        // TODO: Use this method: https://babylonjsguide.github.io/advanced/Custom
        // Create quad
        const quad = BABYLON.MeshBuilder.CreatePlane("BlockSide", {
            size: tileScale,
            frontUVs: this.getQuadUVByIndex(idx),
            backUVs: this.getQuadUVByIndex(idx),
            sideOrientation: BABYLON.Mesh.DOUBLESIDE // quad.sideOrientation = BABYLON.Mesh.DEFAULTSIDE
        }, scene)
    
        // Set material, position, and rotation
        quad.material = scene.defaultMaterial
        const offsetAmmount = tileScale
        const halfOffsetAmmount = offsetAmmount/2
        let offset = {x: 0, y: 0, z: 0}
        let rot = {x: 0, y: 0, z: 0}
        switch (face) {
            case 'front':
                // offset.z = offsetAmmount
                offset = {x: halfOffsetAmmount, y: halfOffsetAmmount, z:offsetAmmount }
                rot.y = Math.PI
                break
            case 'back':
                // offset.z = 0//-offsetAmmount
                offset = {x: halfOffsetAmmount, y: halfOffsetAmmount, z:0 }
                rot.y = 0
                break
            case 'left':
                // offset.x = 0//-offsetAmmount
                offset = {x: 0, y: halfOffsetAmmount, z:halfOffsetAmmount }
                rot.y = Math.PI/2
                break
            case 'right':
                // offset.x = offsetAmmount
                offset = {x: offsetAmmount, y: halfOffsetAmmount, z:halfOffsetAmmount }
                rot.y = -Math.PI/2
                break
            case 'top':
                // offset.y = offsetAmmount
                offset = {x: halfOffsetAmmount, y: offsetAmmount, z:halfOffsetAmmount }
                rot.x = Math.PI/2
                break
            case 'bottom':
                // offset.y = 0//-offsetAmmount
                offset = {x: halfOffsetAmmount, y: 0, z:halfOffsetAmmount }
                rot.x = -Math.PI/2
                break
            default:
                break
        }
        quad.position = new BABYLON.Vector3((pos.x + offset.x), (pos.y + offset.y), (pos.z + offset.z))
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
    
    ////////////////////////////////////////////////////
    // Mesh generators
    ////////////////////////////////////////////////////

    // Create a hollow mesh from chunk
    // Returns new Mesh[]
    createChunkMesh(chunk, offset = { x: 0, y: 0, z: 0 }, scene) {
        // Step through each block in the chunk
        // if the surrounding blocks are transparent / air blocks, add the indexed face
    
        // We'll store our quads here
        let meshArray = []
        const transparentTiles = [0,255,256]
        let chunkIsEmpty = true
    
        for (let y = 0; y < chunk.length; y++) {
        for (let x = 0; x < chunk[y].length; x++) {
        for (let z = 0; z < chunk[y][x].length; z++) {
            let tileID = chunk[y][x][z]
            // if this is not an air block, continue
            if (tileID !== 0) {
    
                // If even 1 block is created, the chunk is not empty
                chunkIsEmpty = false
    
                // ToDo: also check neigboring chunk blocks
                // Check front, back, left, right, top, bottom
                let tilePos = {x: (x+offset.x)*tileScale, y: (y+offset.y)*tileScale, z: (z+offset.z)*tileScale}
                // Right
                let blockHere = chunk[y]?.[x+1]?.[z]
                if (!blockHere || transparentTiles.includes(blockHere))
                    meshArray.push( this.createQuadWithUVs(tilePos, 'right', tileID, scene) )
    
                // Left
                blockHere = chunk[y]?.[x-1]?.[z]
                if (!blockHere || transparentTiles.includes(blockHere))
                    meshArray.push( this.createQuadWithUVs(tilePos, 'left', tileID, scene) )
    
                // Back
                blockHere = chunk[y]?.[x]?.[z-1]
                if (!blockHere || transparentTiles.includes(blockHere))
                    meshArray.push( this.createQuadWithUVs(tilePos, 'back', tileID, scene) )
    
                // Front
                blockHere = chunk[y]?.[x]?.[z+1]
                if (!blockHere || transparentTiles.includes(blockHere))
                    meshArray.push( this.createQuadWithUVs(tilePos, 'front', tileID, scene) )
    
                // Top
                blockHere = chunk[y+1]?.[x]?.[z]
                if (!blockHere || transparentTiles.includes(blockHere))
                    meshArray.push( this.createQuadWithUVs(tilePos, 'top', tileID, scene) )
    
                // Bottom
                blockHere = chunk[y-1]?.[x]?.[z]
                if (!blockHere || transparentTiles.includes(blockHere))
                    meshArray.push( this.createQuadWithUVs(tilePos, 'bottom', tileID, scene) )
            }
        }}}
        return chunkIsEmpty? null: meshArray
    }

    // Create world borders
    createWorldBorders(world, scene) {
        let worldBorders = []
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