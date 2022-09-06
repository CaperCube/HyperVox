import { tileScale } from '../../clientConstants.js'

export function updatePlayerCursor(player) {
    /////////////////////////////////////////////////
    // Perform raycast for cursor
    /////////////////////////////////////////////////

    // Vars
    const avForward = player.avatar.getDirection(new BABYLON.Vector3(0, 0, 1))
    const direction = avForward

    // Default cursor location if no ray collision
    player.selectCursor = player.interactSelectCursor = {
        x: Math.floor( player.avatar.position.x + (avForward.x * player.blockReach) ) + 0.5,
        y: Math.floor( player.avatar.position.y + (avForward.y * player.blockReach) ) + 0.5,
        z: Math.floor( player.avatar.position.z + (avForward.z * player.blockReach) ) + 0.5
    }

    // Raycast
    const ray = new BABYLON.Ray(player.avatar.position, direction, player.blockReach)

    // Ray helper (this renders the ray to the scene)
    // const rayHelper = new BABYLON.RayHelper(ray)
    // rayHelper.show(clientGame.scene, new BABYLON.Color3(1, 0, 0))

    // Raycast filter
    const pick = player.clientGame.scene.pickWithRay(ray, (mesh) => {
        // Only register intersections with chunks
        if (mesh.name.startsWith("chunk")) return true
    }, false)

    // If the ray hit something...
    if (pick?.hit) {
        const newCursorPos = pick.pickedPoint
        const normal = pick.getNormal()
        const selTolerance = 0.25
        const tolerancePos = {
            x: newCursorPos.x - (normal.x * selTolerance),
            y: newCursorPos.y - (normal.y * selTolerance),
            z: newCursorPos.z - (normal.z * selTolerance)
        }
        // Place block cursor
        player.selectCursor = {
            x: Math.floor( tolerancePos.x + (normal.x * tileScale) ) + 0.5,
            y: Math.floor( tolerancePos.y + (normal.y * tileScale) ) + 0.5,
            z: Math.floor( tolerancePos.z + (normal.z * tileScale) ) + 0.5
        }
        // Place interaction cursor
        player.interactSelectCursor = {
            x: Math.floor( tolerancePos.x ) + 0.5,
            y: Math.floor( tolerancePos.y ) + 0.5,
            z: Math.floor( tolerancePos.z ) + 0.5
        }
    }
    else {
        // Hide the interaction cursor if no ray collision
        player.interactSelectCursor = {
            x: -100,
            y: -100,
            z: -100
        }
    }
    
    // Position cursor meshes
    player.selectMesh.position = new BABYLON.Vector3( player.selectCursor.x, player.selectCursor.y, player.selectCursor.z )
    player.removeMesh.position = new BABYLON.Vector3( player.interactSelectCursor.x, player.interactSelectCursor.y, player.interactSelectCursor.z )
}