// colission code
function boxIsIntersecting(box1 = {x: 0, y: 0, z: 0, w: 1, h: 1, d: 1}, box2 = {x: 0, y: 0, z: 0, w: 1, h: 1, d: 1}) {
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

// Player object

function ClientPlayer(controls, avatar){//, camera) {
    // Player vars
    this.playerHeight = 2//tileScale * 1.5
    // The object in the scene the player will be controlling
    this.avatar = avatar
    //this.playerCamera = camera
    // Player controls
    this.controls = controls
    // controls: {
    //     upAxis1: [Buttons.up],
    //     downAxis1: [Buttons.down],
    //     leftAxis1: [Buttons.left],
    //     rightAxis1: [Buttons.right],
    //     run: [Buttons.z],
    //     jump: [Buttons.x],
    //     fire1: [Buttons.c],
    //     invUp: [Buttons.equals],
    //     invDown: [Buttons.minus],
    //     resapwn: [Buttons.r]
    // }

    // Movement vars
    this.spectateMode = true
    this.moveSpeed = 0.025//tileScale/20

    // Private vars
    const groundFric = 0.75
    const gravity = -0.0125
    const bounce = 0.05
    let usedJump = 0
    let playerVelocity = BABYLON.Vector3.Zero()
    //let moveDirection = 0
    let moveForward, moveBackward, moveLeft, moveRight, moveUp, moveDown

    // Init player
    const init = () => {
        registerControls(this.controls)
    }

    // Register controls with actions
    const registerControls = (c) => {
        assignFunctionToInput(c.upAxis1, ()=>{moveForward=true}, ()=>{moveForward=false})
        assignFunctionToInput(c.downAxis1, ()=>{moveBackward=true}, ()=>{moveBackward=false})
        assignFunctionToInput(c.leftAxis1, ()=>{moveLeft=true}, ()=>{moveLeft=false})
        assignFunctionToInput(c.rightAxis1, ()=>{moveRight=true}, ()=>{moveRight=false})
        //assignFunctionToInput(c.jump, ()=>{moveUp=true}, ()=>{moveUp=false})
        assignFunctionToInput(c.jump, ()=>{if (this.spectateMode) moveUp=true; else {playerVelocity.y = 0.25; usedJump++}}, ()=>{moveUp=false})
        assignFunctionToInput(c.run, ()=>{moveDown=true}, ()=>{moveDown=false})
        assignFunctionToInput(c.fire1, ()=>{console.log('shoot!')}, ()=>{})
    }

    // Update player movement
    this.movementUpdate = (engine) => {
        const avForward = avatar.getDirection(new BABYLON.Vector3(0, 0, 1))
        const avUp = avatar.getDirection(new BABYLON.Vector3(0, 1, 0))
        const avRight = avatar.getDirection(new BABYLON.Vector3(1, 0, 0))

        let inputVector = new BABYLON.Vector3(0,0,0)
        //if (!(GetInput(c.upAxis1) && GetInput(c.downAxis1))) inputVector.z = 0
        // Move controler
        let isMoving = false
        if (moveForward) {
            //console.log('moving')
            //controls.moveForward(moveSpeed)
            //avatar.position.z += this.moveSpeed
            inputVector.z = 1
            //console.log(avDir)
            //avatar.position = new BABYLON.Vector3( avatar.position.x + newSpeed.x, avatar.position.y, avatar.position.z + newSpeed.z)
            isMoving = true
        }
        if (moveBackward) {
            //controls.moveForward(-moveSpeed)
            // avatar.position.z -= this.moveSpeed
            inputVector.z = -1
            isMoving = true
        }
        if (moveRight) {
            //controls.moveRight(moveSpeed)
            // avatar.position.x += this.moveSpeed
            inputVector.x = 1
            isMoving = true
        }
        if (moveLeft) {
            //controls.moveRight(-moveSpeed)
            // avatar.position.x -= this.moveSpeed
            inputVector.x = -1
            isMoving = true
        }
        if (this.spectateMode) {
            if (moveUp) {
                inputVector.y = 1
                isMoving = true
            }
            if (moveDown) {
                inputVector.y = -1
                isMoving = true
            }
        }

        // Apply Input
        // if grounded, get ground normal, use it when calculating movement on slopes
        let forwardMove = new BABYLON.Vector3( inputVector.z * avForward.x, 0, inputVector.z * avForward.z )
        let horzMove = new BABYLON.Vector3( inputVector.x * avRight.x, 0, inputVector.x * avRight.z )
        let vertMove = new BABYLON.Vector3( 0, inputVector.y, 0 )
        let movementVector = new BABYLON.Vector3( forwardMove.x + horzMove.x, vertMove.y, forwardMove.z + horzMove.z )
        
        // Apply velocity
        playerVelocity.x += (movementVector.x * this.moveSpeed)
        if (this.spectateMode) playerVelocity.y += (vertMove.y * this.moveSpeed)
        playerVelocity.z += (movementVector.z * this.moveSpeed)

        // Apply position
        const dT = engine.getDeltaTime()
        const frameRateMult = 1000/60//engine.getFps().toFixed()//1000/60  //(1 sec / fps)
        avatar.position = new BABYLON.Vector3(
            avatar.position.x + ((playerVelocity.x/frameRateMult) * dT),
            avatar.position.y + ((playerVelocity.y/frameRateMult) * dT),
            avatar.position.z + ((playerVelocity.z/frameRateMult) * dT)
        )

        // Dampen
        if (this.spectateMode) playerVelocity = new BABYLON.Vector3(playerVelocity.x * groundFric, playerVelocity.y * groundFric, playerVelocity.z * groundFric)
        else playerVelocity = new BABYLON.Vector3(playerVelocity.x * groundFric, playerVelocity.y + gravity, playerVelocity.z * groundFric)

        // Bob camera
        //if (isMoving) camera.position.y = (Math.sin(frame/4) * (tileScale/20)) + playerHeight
    }

    this.platformMovementUpdate = (engine, world) => {
        const avForward = avatar.getDirection(new BABYLON.Vector3(0, 0, 1))
        const avUp = avatar.getDirection(new BABYLON.Vector3(0, 1, 0))
        const avRight = avatar.getDirection(new BABYLON.Vector3(1, 0, 0))

        let inputVector = new BABYLON.Vector3(0,0,0)
        //if (!(GetInput(c.upAxis1) && GetInput(c.downAxis1))) inputVector.z = 0
        // Move controler
        let isMoving = false
        if (moveForward) {
            //console.log('moving')
            //controls.moveForward(moveSpeed)
            //avatar.position.z += this.moveSpeed
            inputVector.z = 1
            //console.log(avDir)
            //avatar.position = new BABYLON.Vector3( avatar.position.x + newSpeed.x, avatar.position.y, avatar.position.z + newSpeed.z)
            isMoving = true
        }
        if (moveBackward) {
            //controls.moveForward(-moveSpeed)
            // avatar.position.z -= this.moveSpeed
            inputVector.z = -1
            isMoving = true
        }
        if (moveRight) {
            //controls.moveRight(moveSpeed)
            // avatar.position.x += this.moveSpeed
            inputVector.x = 1
            isMoving = true
        }
        if (moveLeft) {
            //controls.moveRight(-moveSpeed)
            // avatar.position.x -= this.moveSpeed
            inputVector.x = -1
            isMoving = true
        }
        if (this.spectateMode) {
            if (moveUp) {
                inputVector.y = 1
                isMoving = true
            }
            if (moveDown) {
                inputVector.y = -1
                isMoving = true
            }
        }

        // Apply Input
        // if grounded, get ground normal, use it when calculating movement on slopes
        //let forwardMove = new BABYLON.Vector3( inputVector.z * avForward.x, 0, inputVector.z * avForward.z )
        let forwardMove = new BABYLON.Vector3( inputVector.z * Math.sin(avatar.rotation.y), 0, inputVector.z * Math.cos(avatar.rotation.y) )
        let horzMove = new BABYLON.Vector3( inputVector.x * avRight.x, 0, inputVector.x * avRight.z )
        let vertMove = new BABYLON.Vector3( 0, inputVector.y, 0 )
        let movementVector = new BABYLON.Vector3( forwardMove.x + horzMove.x, vertMove.y, forwardMove.z + horzMove.z )
        
        // Apply velocity
        playerVelocity.x += (movementVector.x * this.moveSpeed)
        if (this.spectateMode) playerVelocity.y += (vertMove.y * this.moveSpeed)
        playerVelocity.z += (movementVector.z * this.moveSpeed)

        // Apply movement
        const deltaTime = engine.getDeltaTime()
        const frameRateMult = 1000/60//engine.getFps().toFixed()//1000/60  //(1 sec / fps)
        //const playerBox = {x: (avatar.position.x - 0.5) + playerVelocity.x, y: avatar.position.y + playerVelocity.y, z: (avatar.position.z - 0.5) + playerVelocity.z, w: 0.5, h: 2, d: 0.5}
        const playerBox = {x: (avatar.position.x - 0.5), y: avatar.position.y, z: (avatar.position.z - 0.5), w: 0.5, h: 2, d: 0.5}

        //for (let y = -4; y < 4; y++) {
            //let checkPos = {x: Math.floor(avatar.position.x), y: Math.floor(avatar.position.y), z: Math.floor(avatar.position.z)}
            //let blockID = thisChunk[checkPos.y][checkPos.x][checkPos.z]
            //let blockToCheck = {x: checkPos.x, y: checkPos.y, z: checkPos.z, w: 1, h: 1, d: 1}
            //if (!boxIsIntersecting()) this.keepMovingY(dT, frameRateMult)
            //else this.bounceY()
        //}
        // Blocks
        let allowMoveX = true
        let allowMoveY = true
        let allowMoveZ = true
        if (!this.spectateMode && 1 === 2) {
            // Change this to check a radius around the player, not the entire world
        for (let wy = 0; wy < world.worldChunks.length; wy++) {
        for (let wx = 0; wx < world.worldChunks[wy]?.length; wx++) {
        for (let wz = 0; wz < world.worldChunks[wy]?.[wx]?.length; wz++) {
            for (let y = 0; y < world.worldChunks[wy]?.[wx]?.[wz]?.length; y++) {
            for (let x = 0; x < world.worldChunks[wy]?.[wx]?.[wz]?.[y]?.length; x++) {
            for (let z = 0; z < world.worldChunks[wy]?.[wx]?.[wz]?.[y]?.[x]?.length; z++) {
                const blockID = world.worldChunks[wy]?.[wx]?.[wz]?.[y]?.[x]?.[z]
                if (blockID > 0) {
                    const blockToCheck = {x: x+(wx*16), y: y+(wy*16), z: z+(wz*16), w: 1, h: 1, d: 1}

                    // Check Y
                    // if (boxIsIntersecting(playerBox, blockToCheck)) {
                    //     this.bounceY()
                    //     avatar.position.y = blockToCheck.y + (blockToCheck.h/2) + (playerBox.h/2) //+ this.moveSpeed
                    // }

                    // Check X
                    // let playerPosCheck = playerBox
                    // playerPosCheck.x += playerVelocity.x
                    // if (!boxIsIntersecting(playerBox, blockToCheck)) { allowMoveX = true } else { this.bounceX() }

                    // // Check Z
                    // playerPosCheck = playerBox
                    // playerPosCheck.z += playerVelocity.z
                    // if (!boxIsIntersecting(playerBox, blockToCheck)) { allowMoveZ = true } else { this.bounceZ() }

                    // // Check Y
                    // playerPosCheck = playerBox
                    // playerPosCheck.y += playerVelocity.y
                    // if (!boxIsIntersecting(playerBox, blockToCheck)) { allowMoveY = true } else { this.bounceY() }
                }
        }}}}}}
        }

        // Get player pos in chunk/block coordinates
        // TODO: This does not yet work at the edges of chunks
        // TODO: it just doesn't work well at all
        const chunkSize = world.getChunkSize()
        let worldPos = {x: Math.floor(avatar.position.x/chunkSize), y: Math.floor(avatar.position.y/chunkSize), z: Math.floor(avatar.position.z/chunkSize)}
        let chunkPos = {x: Math.floor(avatar.position.x % chunkSize), y: Math.floor(avatar.position.y % chunkSize), z: Math.floor(avatar.position.z % chunkSize)}
        //console.log(worldPos, chunkPos)

        const checkYCol = (block) => {
            // Check Y
            let playerPosCheck = playerBox
            playerPosCheck.y += playerVelocity.y
            if (boxIsIntersecting(playerPosCheck, block)) {
                // Bounce
                this.bounceY()
                avatar.position.y = block.y + (block.h/2) + (playerBox.h/2)//+ this.moveSpeed
            }
        }

        const checkXCol = (block) => {
            // Check X
            let playerPosCheck = playerBox
            playerPosCheck.x += playerVelocity.x
            //playerPosCheck.y += (playerBox.h/4)
            if (boxIsIntersecting(playerPosCheck, block)) {
                // Bounce
                this.bounceX()
                //avatar.position.x = block.x + (block.d/2) + (playerBox.d/2)//+ this.moveSpeed
            }
        }

        const checkZCol = (block) => {
            // Check Z
            let playerPosCheck = playerBox
            playerPosCheck.z += playerVelocity.z
            //playerPosCheck.y += (playerBox.h/4)
            if (boxIsIntersecting(playerPosCheck, block)) {
                // Bounce
                this.bounceZ()
                //avatar.position.z = block.z + (block.w/2) + (playerBox.w/2)//+ this.moveSpeed
            }
        }
        
        if (!this.spectateMode) {
            // Check Y
            let blockID = world.worldChunks[worldPos.y]?.[worldPos.x]?.[worldPos.z]?.[chunkPos.y]?.[chunkPos.x]?.[chunkPos.z]
            if (blockID > 0) {
                let blockHere = {x: chunkPos.x+(worldPos.x*chunkSize), y: chunkPos.y+(worldPos.y*chunkSize)+1, z: chunkPos.z+(worldPos.z*chunkSize), w: 1, h: 1, d: 1}
                checkYCol(blockHere)
            }

            blockID = world.worldChunks[worldPos.y]?.[worldPos.x]?.[worldPos.z]?.[chunkPos.y-1]?.[chunkPos.x]?.[chunkPos.z]
            if (blockID > 0) {
                let blockHere = {x: chunkPos.x+(worldPos.x*chunkSize), y: chunkPos.y+(worldPos.y*chunkSize), z: chunkPos.z+(worldPos.z*chunkSize), w: 1, h: 1, d: 1}
                checkYCol(blockHere)
            }

            blockID = world.worldChunks[worldPos.y]?.[worldPos.x]?.[worldPos.z]?.[chunkPos.y-2]?.[chunkPos.x]?.[chunkPos.z]
            if (blockID > 0) {
                let blockHere = {x: chunkPos.x+(worldPos.x*chunkSize), y: chunkPos.y+(worldPos.y*chunkSize)-1, z: chunkPos.z+(worldPos.z*chunkSize), w: 1, h: 1, d: 1}
                checkYCol(blockHere)
            }

            // Check X
            blockID = world.worldChunks[worldPos.y]?.[worldPos.x+1]?.[worldPos.z]?.[chunkPos.y]?.[chunkPos.x]?.[chunkPos.z]
            if (blockID > 0) {
                let blockHere = {x: chunkPos.x+(worldPos.x*chunkSize)+1, y: chunkPos.y+(worldPos.y*chunkSize)+1, z: chunkPos.z+(worldPos.z*chunkSize), w: 1, h: 1, d: 1}
                checkXCol(blockHere)
            }

            blockID = world.worldChunks[worldPos.y]?.[worldPos.x-1]?.[worldPos.z]?.[chunkPos.y]?.[chunkPos.x]?.[chunkPos.z]
            if (blockID > 0) {
                let blockHere = {x: chunkPos.x+(worldPos.x*chunkSize)-1, y: chunkPos.y+(worldPos.y*chunkSize)+1, z: chunkPos.z+(worldPos.z*chunkSize), w: 1, h: 1, d: 1}
                checkXCol(blockHere)
            }

            blockID = world.worldChunks[worldPos.y]?.[worldPos.x]?.[worldPos.z]?.[chunkPos.y]?.[chunkPos.x]?.[chunkPos.z]
            if (blockID > 0) {
                let blockHere = {x: chunkPos.x+(worldPos.x*chunkSize), y: chunkPos.y+(worldPos.y*chunkSize)+1, z: chunkPos.z+(worldPos.z*chunkSize), w: 1, h: 1, d: 1}
                checkXCol(blockHere)
            }

            // Check Z
            blockID = world.worldChunks[worldPos.y]?.[worldPos.x]?.[worldPos.z+1]?.[chunkPos.y]?.[chunkPos.x]?.[chunkPos.z]
            if (blockID > 0) {
                let blockHere = {x: chunkPos.x+(worldPos.x*chunkSize), y: chunkPos.y+(worldPos.y*chunkSize)+1, z: chunkPos.z+(worldPos.z*chunkSize)+1, w: 1, h: 1, d: 1}
                checkZCol(blockHere)
            }

            blockID = world.worldChunks[worldPos.y]?.[worldPos.x-1]?.[worldPos.z-1]?.[chunkPos.y]?.[chunkPos.x]?.[chunkPos.z]
            if (blockID > 0) {
                let blockHere = {x: chunkPos.x+(worldPos.x*chunkSize), y: chunkPos.y+(worldPos.y*chunkSize)+1, z: chunkPos.z+(worldPos.z*chunkSize)-1, w: 1, h: 1, d: 1}
                checkZCol(blockHere)
            }

            blockID = world.worldChunks[worldPos.y]?.[worldPos.x]?.[worldPos.z]?.[chunkPos.y]?.[chunkPos.x]?.[chunkPos.z]
            if (blockID > 0) {
                let blockHere = {x: chunkPos.x+(worldPos.x*chunkSize), y: chunkPos.y+(worldPos.y*chunkSize)+1, z: chunkPos.z+(worldPos.z*chunkSize), w: 1, h: 1, d: 1}
                checkZCol(blockHere)
            }
        }

        // World floor
        let frameGrav = ((gravity/frameRateMult) * deltaTime)
        if (((avatar.position.y)) <= 1) {
            this.bounceY()
            avatar.position.y = 1 //+ this.moveSpeed
        }
        else if (!this.spectateMode) {
            // Apply gravity
            playerVelocity.y += frameGrav
        }
        this.keepMovingY(deltaTime, frameRateMult)
        this.keepMovingX(deltaTime, frameRateMult)
        this.keepMovingZ(deltaTime, frameRateMult)
        //this.keepMoving(engine)

        // Dampen
        if (this.spectateMode) playerVelocity = new BABYLON.Vector3(playerVelocity.x * groundFric, playerVelocity.y * groundFric, playerVelocity.z * groundFric)
        else playerVelocity = new BABYLON.Vector3(playerVelocity.x * groundFric, playerVelocity.y, playerVelocity.z * groundFric)

        // Bob camera
        //if (isMoving) camera.position.y = (Math.sin(frame/4) * (tileScale/20)) + playerHeight
    }

    this.bounceY = () => {
        if (Math.abs(playerVelocity.y) > 0) usedJump = 0 // reset jump
        playerVelocity.y *= -bounce
    }

    this.bounceX = () => {
        playerVelocity.x *= -bounce
    }

    this.bounceZ = () => {
        playerVelocity.z *= -bounce
    }

    this.keepMoving = (engine) => {
        // Apply position
        const dT = engine.getDeltaTime()
        const frameRateMult = 1000/60//engine.getFps().toFixed()//1000/60  //(1 sec / fps)
        avatar.position = new BABYLON.Vector3(
            avatar.position.x + ((playerVelocity.x/frameRateMult) * dT),
            avatar.position.y + ((playerVelocity.y/frameRateMult) * dT),
            avatar.position.z + ((playerVelocity.z/frameRateMult) * dT)
        )
    }

    this.keepMovingY = (deltaTime, frameRateMult) => {
        // Apply position 
        //if (Math.abs(playerVelocity.y) > this.moveSpeed) {
            avatar.position = new BABYLON.Vector3(
                avatar.position.x,
                avatar.position.y + ((playerVelocity.y/frameRateMult) * deltaTime),
                avatar.position.z
            )
        //}
    }

    this.keepMovingX = (deltaTime, frameRateMult) => {
        // Apply position
        avatar.position = new BABYLON.Vector3(
            avatar.position.x + ((playerVelocity.x/frameRateMult) * deltaTime),
            avatar.position.y,
            avatar.position.z
        )
    }

    this.keepMovingZ = (deltaTime, frameRateMult) => {
        // Apply position
        avatar.position = new BABYLON.Vector3(
            avatar.position.x,
            avatar.position.y,
            avatar.position.z + ((playerVelocity.z/frameRateMult) * deltaTime)
        )
    }

    init()
}

export default ClientPlayer