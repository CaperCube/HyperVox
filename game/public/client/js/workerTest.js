importScripts('./dist/babylon.max.js', '../../brain/gen/mesh/meshGen.js')

// Using NullEngine so we don't have to define a canvas or render anything
const engine = new BABYLON.NullEngine()
const scene = new BABYLON.Scene(engine)

// Generate a mesh for each chunk in the world data
function workerGenMeshesFromChunks(world) {
    for (let y = 0; y < world.length; y++) {
    for (let x = 0; x < world[y]?.length; x++) {
    for (let z = 0; z < world[y]?.[x]?.length; z++) {
        if (world[y]?.[x]?.[z]) {
            const chunkSize = 16 // ToDo: get a message from the main thread to set this value
            const chunkOffset = { x: x*chunkSize, y: y*chunkSize, z: z*chunkSize }
            const myChunkMeshes = createChunkMesh(world[y][x][z], chunkOffset, 1, scene)
            const chunkMesh = BABYLON.Mesh.MergeMeshes(myChunkMeshes, true)

            // Convert data to vertex arrays so it can be sent to the main thread
            let data = {
                normal: chunkMesh.geometry.getVertexBuffers().normal.getData(),
                position: chunkMesh.geometry.getVertexBuffers().position.getData(),
                uv: chunkMesh.geometry.getVertexBuffers().uv.getData(),
                indices: chunkMesh.geometry.getIndices()
            }

            // Send back to the main thread
            postMessage(data)
        }
    }}}

    // When all chunk meshes have been sent, tell the main thread that we're done
    postMessage("doneLoadingChunks")
}

// Listen for event from main thread to start
onmessage = function(event) {
    //console.log('data: ', event.data)
    workerGenMeshesFromChunks(event.data.world)
}