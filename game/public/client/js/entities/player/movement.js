import { tileScale } from '../../../../common/commonConstants.js'
import { getArrayPos, boxIsIntersecting } from '../../../../common/positionUtils.js'
import { blockCats, blockTypes } from '../../../../common/blockSystem.js'

export function basicMovement(engine, player, movementVector) {

    ///////////////////////////////////////////////////////
    // Apply velocity
    ///////////////////////////////////////////////////////

    // Flying
    if (player.spectateMode) {
        player.playerVelocity.x += (movementVector.x * player.flySpeed)
        player.playerVelocity.y += (movementVector.y * player.flySpeed)
        player.playerVelocity.z += (movementVector.z * player.flySpeed)
    }
    // Swiming
    else {
        if (player.isInFluid) {
            player.playerVelocity.x += (movementVector.x * player.moveSpeed) / player.fluidViscosity
            player.playerVelocity.z += (movementVector.z * player.moveSpeed) / player.fluidViscosity
        }
    // Walking
        else {
            player.playerVelocity.x += (movementVector.x * player.moveSpeed)
            player.playerVelocity.z += (movementVector.z * player.moveSpeed)
        }
    }

    ///////////////////////////////////////////////////////
    // Apply movement
    ///////////////////////////////////////////////////////

    // Motion vars
    // const deltaTime = 16 // ToDo: MAKE SURE this and "clientGame.clientUpdateSpeed" are the same
    // const frameRateMult = 1000/60 // ToDo: 
    // let frameGrav = ((player.gravity/frameRateMult) * deltaTime)
    let frameGrav = player.gravity

    // Collision vars
    let playerBox = {x: player.position.x, y: player.position.y, z: player.position.z, w: 0.5, h: player.playerHeight, d: 0.5}

    let allowMoveX = true
    let allowMoveY = true
    let allowMoveZ = true
    let allowGrav = true

    // Block checks
    if (!player.spectateMode && player.world) {
        player.isInFluid = false
        // Check X
        for (let cy = -2; cy < 2; cy++) {
        for (let cx = -1; cx < 2; cx++) {
        for (let cz = -1; cz < 2; cz++) {

            // Check player block
            let blockPos = {x: player.position.x+cx, y: player.position.y+cy, z: player.position.z+cz}
            let arrayPos = getArrayPos(blockPos, player.chunkSize)
            let worldPos = arrayPos.chunk
            let chunkPos = arrayPos.block

            let blockID = player.world?.worldChunks?.[worldPos.y]?.[worldPos.x]?.[worldPos.z]?.[chunkPos.y]?.[chunkPos.x]?.[chunkPos.z]
            const blockShape = { x: blockTypes[blockID]?.shape?.x || 0, y: blockTypes[blockID]?.shape?.y || 0, z: blockTypes[blockID]?.shape?.z || 0, w: blockTypes[blockID]?.shape?.w || 1, h: blockTypes[blockID]?.shape?.h|| 1, d: blockTypes[blockID]?.shape?.d || 1 }
            // let blockHere = {x: chunkPos.x+(worldPos.x*player.chunkSize)+0.5, y: chunkPos.y+(worldPos.y*player.chunkSize)+0.5, z: chunkPos.z+(worldPos.z*player.chunkSize)+0.5, w: blockShape.w, h: blockShape.h, d: blockShape.d} // ToDo: replace size values with "tileSize"
            let blockHere = {x: chunkPos.x+(worldPos.x*player.chunkSize)+0.5 + blockShape.x, y: chunkPos.y+(worldPos.y*player.chunkSize) + blockShape.y, z: chunkPos.z+(worldPos.z*player.chunkSize)+0.5 + blockShape.z, w: blockShape.w, h: blockShape.h, d: blockShape.d} // ToDo: replace size values with "tileSize"

            // Check X
            let skipMid = (cy >= 0)
            if (skipMid && blockID > 0) {
                // let blockHere = {x: chunkPos.x+(worldPos.x*player.chunkSize)+0.5, y: chunkPos.y+(worldPos.y*player.chunkSize)+0.5, z: chunkPos.z+(worldPos.z*player.chunkSize)+0.5, w: 1, h: 1, d: 1} // ToDo: replace size values with "tileSize"
                checkXCol(blockHere, blockID, player, playerBox)
            }

            // Check Z
            if (skipMid && blockID > 0) {
                // let blockHere = {x: chunkPos.x+(worldPos.x*player.chunkSize)+0.5, y: chunkPos.y+(worldPos.y*player.chunkSize)+0.5, z: chunkPos.z+(worldPos.z*player.chunkSize)+0.5, w: 1, h: 1, d: 1}
                checkZCol(blockHere, blockID, player, playerBox)
            }

            // Check Y
            skipMid = (cy < 0 || cy > 0)
            if (skipMid && blockID > 0) {
                // let blockHere = {x: chunkPos.x+(worldPos.x*player.chunkSize)+0.5, y: chunkPos.y+(worldPos.y*player.chunkSize)+0.5, z: chunkPos.z+(worldPos.z*player.chunkSize)+0.5, w: 1, h: 1, d: 1}
                checkYCol(blockHere, (cy > 0), blockID, player, playerBox, allowGrav)
            }
        }}}
    }

    // Gravity changes
    // if (player.isInFluid) frameGrav = (((player.gravity / player.fluidViscosity)/frameRateMult) * deltaTime)
    if (player.isInFluid) frameGrav = (player.gravity / player.fluidViscosity)

    ///////////////////////////////////////////////////////
    // World bounds
    ///////////////////////////////////////////////////////

    // Y Bound (Kill Floor)
    if (((player.position.y)) < -100) {
        // Kill player
        player.clientGame.clientComs.sendObituary(player.playerID, null)
    }
    else if (!player.spectateMode && allowGrav) {
        // Apply gravity
        player.playerVelocity.y += frameGrav
    }
    keepMovingY(player)//, deltaTime, frameRateMult)

    // X & Y Bounds
    if (!player.spectateMode) {
        // World X bounds
        if (player.position.x < 0) {
            player.position.x = 0.05
        }
        else if (player.position.x > (player.worldSize * player.chunkSize * tileScale)) {
            player.position.x = (player.worldSize * player.chunkSize * tileScale) - 0.05
        }

        // World Z bounds
        if (player.position.z < 0) {
            player.position.z = 0.05
        }
        else if (player.position.z > (player.worldSize * player.chunkSize * tileScale)) {
            player.position.z = (player.worldSize * player.chunkSize * tileScale) - 0.05
        }
    }

    if (allowMoveX) keepMovingX(player)//, deltaTime, frameRateMult)
    if (allowMoveZ) keepMovingZ(player)//, deltaTime, frameRateMult)

    ///////////////////////////////////////////////////////
    // Friction
    ///////////////////////////////////////////////////////

    if (player.spectateMode) player.playerVelocity = new BABYLON.Vector3(player.playerVelocity.x * player.groundFric, player.playerVelocity.y * player.groundFric, player.playerVelocity.z * player.groundFric)
    player.playerVelocity = new BABYLON.Vector3(player.playerVelocity.x * player.groundFric, player.playerVelocity.y, player.playerVelocity.z * player.groundFric)

    ///////////////////////////////////////////////////////
    // End, now perform position update
    ///////////////////////////////////////////////////////
}

///////////////////////////////////////////////////////
// Collision checks
///////////////////////////////////////////////////////

const checkYCol = (block, bOnly, blockID, player, playerBox, allowGrav) => {

    let bounceOnly = bOnly || false
    // Check Y
    // let playerPosCheck = {x: (player.position.x - 0.5), y: player.position.y, z: (player.position.z - 0.5), w: 0.5, h: 2, d: 0.5}
    // let playerPosCheck = {x: player.position.x, y: player.position.y, z: player.position.z, w: 0.5, h: 2, d: 0.5}

    let playerPosCheck = {x: playerBox.x, y: playerBox.y, z: playerBox.z, w: playerBox.w, h: playerBox.h, d: playerBox.d}
    playerPosCheck.y += player.playerVelocity.y //+ 0.01
    // block.y += 0
    
    if (boxIsIntersecting(playerPosCheck, block)) {

        // Bouncy block
        player.bounce = blockTypes[blockID]?.bounciness || player.defaultBounce

        // Check if block is colidable
        if (!blockTypes[blockID]?.categories.includes(blockCats.noncollidable) && !blockTypes[blockID]?.categories.includes(blockCats.fluid)) {
            // Bounce
            if (!bounceOnly) {
                player.position.y = ((block.y + (block.h/2)) + (playerBox.h/2)) //+ 0.001 //+ player.moveSpeed
                allowGrav = false
            }
            else {
                // const playerIsBelow = (player.position.y + (playerBox.h/2)) < (block.y)
                // if (playerIsBelow) player.position.y = ((block.y - (block.h/2)) - (playerBox.h/2)) - 0.001
                const playerIsBelow = (player.position.y + (playerBox.h/2)) < (block.y)// - (block.h/2))
                if (playerIsBelow) player.position.y = ((block.y - (block.h/2)) - (playerBox.h/2)) - 0.001
            }
            bounceY(player)
        }
        
        // Damage player if damaging block
        if (blockTypes[blockID]?.categories.includes(blockCats.damaging)) player.takeDamage(blockTypes[blockID].damage || 0)
        // Set respawn point if respawn block
        if (blockTypes[blockID]?.categories.includes(blockCats.checkpoint) && {x: player.respawnPoint.x, y: player.respawnPoint.y, z: player.respawnPoint.z} !== {x: block.x + (block.h/2), y: block.y + player.playerHeight, z: block.z + (block.h/2)}) player.setPlayerSpawn({x: block.x + (block.h/2), y: block.y + player.playerHeight, z: block.z + (block.h/2)})
        // Teleporter block
        if (blockTypes[blockID]?.categories.includes(blockCats.teleporter)) player.teleportPlayer(player.worldDefualtSpawn)
        // Start race if starting line block
        if (blockTypes[blockID]?.categories.includes(blockCats.raceStart)) player.startRace()
        // Start race if starting line block
        if (blockTypes[blockID]?.categories.includes(blockCats.raceEnd)) player.endRace()
        // Heal player
        if (blockTypes[blockID]?.categories.includes(blockCats.healing)) player.heal(blockTypes[blockID].healAmount, blockTypes[blockID].healDelay)
        // Fluid
        if (blockTypes[blockID]?.categories.includes(blockCats.fluid)) { player.fluidViscosity = blockTypes[blockID].viscosity || 1; player.isInFluid = true }
    }
}

const checkXCol = (block, blockID, player, playerBox) => {
    // Check X
    //let playerPosCheck = {x: (player.position.x - 0.5), y: player.position.y, z: (player.position.z - 0.5), w: 0.5, h: 2, d: 0.5}
    // let playerPosCheck = {x: player.position.x, y: player.position.y, z: player.position.z, w: 0.5, h: 2, d: 0.5}

    let playerPosCheck = {x: playerBox.x, y: playerBox.y, z: playerBox.z, w: playerBox.w, h: playerBox.h, d: playerBox.d}
    playerPosCheck.x += player.playerVelocity.x
    // block.y += 0

    if (boxIsIntersecting(playerPosCheck, block)) {

        // Bouncy block
        player.bounce = blockTypes[blockID]?.bounciness || player.defaultBounce

        // Check if block is colidable
        if (!blockTypes[blockID]?.categories.includes(blockCats.noncollidable) && !blockTypes[blockID]?.categories.includes(blockCats.fluid)) {
            // Move player to contact
            // const playerIsBelow = (player.position.y + (playerBox.h/2)) < (block.y)
            // if (!playerIsBelow) {
            //     const playerIsBehind = (player.position.x + (playerBox.d/2)) < block.x
            //     if (playerIsBehind) player.position.x = ((block.x - (block.d/2)) + (playerBox.d/2)) - 0.001
            //     else player.position.x = ((block.x + (block.d)) + (playerBox.d/2)) + 0.001
            // }

            // Bounce
            bounceX(player)
            //player.position.x = block.x + (block.d/2) + (playerBox.d/2)//+ player.moveSpeed
            //allowMoveX = false
        }

        // Damage player if damaging block
        if (blockTypes[blockID]?.categories.includes(blockCats.damaging)) player.takeDamage(blockTypes[blockID].damage || 0)
        // Set respawn point if respawn block
        if (blockTypes[blockID]?.categories.includes(blockCats.checkpoint) && {x: player.respawnPoint.x, y: player.respawnPoint.y, z: player.respawnPoint.z} !== {x: block.x + (block.h/2), y: block.y + player.playerHeight, z: block.z + (block.h/2)}) player.setPlayerSpawn({x: block.x + (block.h/2), y: block.y + player.playerHeight, z: block.z + (block.h/2)})
        // Teleporter block
        if (blockTypes[blockID]?.categories.includes(blockCats.teleporter)) player.teleportPlayer(player.worldDefualtSpawn)
        // Start race if starting line block
        if (blockTypes[blockID]?.categories.includes(blockCats.raceStart)) player.startRace()
        // Start race if starting line block
        if (blockTypes[blockID]?.categories.includes(blockCats.raceEnd)) player.endRace()
        // Heal player
        if (blockTypes[blockID]?.categories.includes(blockCats.healing)) player.heal(blockTypes[blockID].healAmount, blockTypes[blockID].healDelay)
        // Fluid
        if (blockTypes[blockID]?.categories.includes(blockCats.fluid)) { player.fluidViscosity = blockTypes[blockID].viscosity || 1; player.isInFluid = true }
    }
}

const checkZCol = (block, blockID, player, playerBox) => {
    // Check Z
    // let playerPosCheck = {x: (player.position.x - 0.5), y: player.position.y, z: (player.position.z - 0.5), w: 0.5, h: 2, d: 0.5}
    // let playerPosCheck = {x: player.position.x, y: player.position.y, z: player.position.z, w: 0.5, h: 2, d: 0.5}

    let playerPosCheck = {x: playerBox.x, y: playerBox.y, z: playerBox.z, w: playerBox.w, h: playerBox.h, d: playerBox.d}
    playerPosCheck.z += player.playerVelocity.z
    // block.y += 0

    if (boxIsIntersecting(playerPosCheck, block)) {

        // Bouncy block
        player.bounce = blockTypes[blockID]?.bounciness || player.defaultBounce
        
        // Check if block is colidable
        if (!blockTypes[blockID]?.categories.includes(blockCats.noncollidable) && !blockTypes[blockID]?.categories.includes(blockCats.fluid)) {
            // Move player to contact
            // const playerIsBelow = (player.position.y + (playerBox.h/2)) < (block.y)
            // if (!playerIsBelow) {    
            //     const playerIsLeft = (player.position.z + (playerBox.w/2)) < (block.z)
            //     if (playerIsLeft) player.position.z = ((block.z - (block.w/2)) + (playerBox.w/2)) - 0.001
            //     else player.position.z = ((block.z + (block.w)) + (playerBox.w/2)) + 0.001
            // }

            // Bounce
            bounceZ(player)
            //player.position.z = block.z + (block.w/2) + (playerBox.w/2)//+ player.moveSpeed
            //allowMoveZ = false
        }

        // Damage player if damaging block
        if (blockTypes[blockID]?.categories.includes(blockCats.damaging)) player.takeDamage(blockTypes[blockID].damage || 0)
        // Set respawn point if respawn block
        if (blockTypes[blockID]?.categories.includes(blockCats.checkpoint) && {x: player.respawnPoint.x, y: player.respawnPoint.y, z: player.respawnPoint.z} !== {x: block.x + (block.h/2), y: block.y + player.playerHeight, z: block.z + (block.h/2)}) player.setPlayerSpawn({x: block.x + (block.h/2), y: block.y + player.playerHeight, z: block.z + (block.h/2)})
        // Teleporter block
        if (blockTypes[blockID]?.categories.includes(blockCats.teleporter)) player.teleportPlayer(player.worldDefualtSpawn)
        // Start race if starting line block
        if (blockTypes[blockID]?.categories.includes(blockCats.raceStart)) player.startRace()
        // Start race if starting line block
        if (blockTypes[blockID]?.categories.includes(blockCats.raceEnd)) player.endRace()
        // Heal player
        if (blockTypes[blockID]?.categories.includes(blockCats.healing)) player.heal(blockTypes[blockID].healAmount, blockTypes[blockID].healDelay)
        // Fluid
        if (blockTypes[blockID]?.categories.includes(blockCats.fluid)) { player.fluidViscosity = blockTypes[blockID].viscosity || 1; player.isInFluid = true }
    }
}

///////////////////////////////////////////////////////
// Movement helpers
///////////////////////////////////////////////////////

const bounceY = (player) => {
    if (Math.abs(player.playerVelocity.y) > 0) player.usedJumps = 0 // reset jump
    player.playerVelocity.y *= -player.bounce
}

const bounceX = (player) => {
    player.playerVelocity.x *= -player.bounce
}

const bounceZ = (player) => {
    player.playerVelocity.z *= -player.bounce
}

const keepMovingY = (player) => {//, deltaTime, frameRateMult) => {
    // Apply position 
    player.position = new BABYLON.Vector3(
        player.position.x,
        player.position.y + player.playerVelocity.y,//((player.playerVelocity.y/frameRateMult) * deltaTime),
        player.position.z
    )
}

const keepMovingX = (player) => {//, deltaTime, frameRateMult) => {
    // Apply position
    player.position = new BABYLON.Vector3(
        player.position.x + player.playerVelocity.x,//((player.playerVelocity.x/frameRateMult) * deltaTime),
        player.position.y,
        player.position.z
    )
}

const keepMovingZ = (player) => {//, deltaTime, frameRateMult) => {
    // Apply position
    player.position = new BABYLON.Vector3(
        player.position.x,
        player.position.y,
        player.position.z + player.playerVelocity.z//((player.playerVelocity.z/frameRateMult) * deltaTime)
    )
}