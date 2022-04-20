// importScripts('../dist/babylon.js', './meshGen.js')
import '../dist/babylon.js'
import MeshGenerator from './meshGen.js'

// Using NullEngine so we don't have to define a canvas or render anything
const engine = new BABYLON.NullEngine()
const scene = new BABYLON.Scene(engine)

const meshGen = new MeshGenerator()

// Generate a mesh for each chunk in the world data
function workerGenMeshesFromChunks(world) {
    for (let y = 0; y < world?.length; y++) {
    for (let x = 0; x < world?.[y]?.length; x++) {
    for (let z = 0; z < world?.[y]?.[x]?.length; z++) {

        // Create a collection of only the effected chunks
        const chunkGroup = meshGen.getChunkGroup( world, { x: x, y: y, z: z } )

        // Generate chunk
        workerGenChunkMesh( chunkGroup, true )
    }}}

    // When all chunk meshes have been sent, tell the main thread that we're done
    postMessage("doneLoadingChunks")
}

function workerGenChunkMesh( chunkGroup, isPartOfBatch = false ) {
    if (chunkGroup?.thisChunk) {

        const myChunkMeshes = meshGen.createChunkMesh(chunkGroup, scene)

        if (myChunkMeshes !== null) {
            const chunkMesh = BABYLON.Mesh.MergeMeshes(myChunkMeshes, true)
            if (chunkMesh) {
                // Convert data to vertex arrays so it can be sent to the main thread
                let data = {
                    normal: chunkMesh.geometry.getVertexBuffers().normal.getData(),
                    position: chunkMesh.geometry.getVertexBuffers().position.getData(),
                    uv: chunkMesh.geometry.getVertexBuffers().uv.getData(),
                    indices: chunkMesh.geometry.getIndices(),
                    chunkPosition: chunkGroup.chunkLocation
                }

                // Send back to the main thread
                postMessage(data)
            }
        }
        else {
            // Send back to the main thread
            postMessage({ chunkEmpty: true, chunkPosition: chunkGroup.chunkLocation })
        }
    }
    if (!isPartOfBatch) postMessage("doneLoadingChunks")
}

// Listen for event from main thread to start
onmessage = function(event) {
    switch (event.data.type) {
        case 'full':
            workerGenMeshesFromChunks(event.data.world)
        case 'chunk-only':
            workerGenChunkMesh(event.data.chunkGroup, false)
        default:
            postMessage("doneLoadingChunks")
    }
}