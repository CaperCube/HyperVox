// importScripts('../dist/babylon.js', './meshGen.js')
import '../dist/babylon.js'
import MeshGenerator from './meshGen.js'

// Using NullEngine so we don't have to define a canvas or render anything
const engine = new BABYLON.NullEngine()
const scene = new BABYLON.Scene(engine)

const meshGen = new MeshGenerator()

// Generate a mesh data for the given chunk
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
        case 'chunk-only':
            workerGenChunkMesh(event.data.chunkGroup, false)
        default:
            postMessage("doneLoadingChunks")
    }
}