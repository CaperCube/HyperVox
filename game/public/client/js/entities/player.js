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
    this.spectateMode = false
    this.moveSpeed = 0.05//tileScale/20

    // Private vars
    const groundFric = 0.75
    const gravity = -0.015
    const bounce = 0.1
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
        assignFunctionToInput(c.jump, ()=>{playerVelocity.y = 0.25; usedJump++}, ()=>{})
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

    this.platformMovementUpdate = (engine) => {
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

        // Apply movement
        const deltaTime = engine.getDeltaTime()
        const frameRateMult = 1000/60//engine.getFps().toFixed()//1000/60  //(1 sec / fps)
        const playerBox = {x: avatar.position.x, y: avatar.position.y, z: avatar.position.z, w: 1, h: 1, d: 1}
        //for (let y = -4; y < 4; y++) {
            //let checkPos = {x: Math.floor(avatar.position.x), y: Math.floor(avatar.position.y), z: Math.floor(avatar.position.z)}
            //let blockID = thisChunk[checkPos.y][checkPos.x][checkPos.z]
            //let blockToCheck = {x: checkPos.x, y: checkPos.y, z: checkPos.z, w: 1, h: 1, d: 1}
            //if (!boxIsIntersecting()) this.keepMovingY(dT, frameRateMult)
            //else this.bounceY()
        //}
        // World floor
        if ((avatar.position.y - (playerBox.h/2)) < 0) {
            if (playerVelocity.y < 0) this.bounceY()
            avatar.position.y = (playerBox.h/2)
        }
        else this.keepMovingY(deltaTime, frameRateMult)
        this.keepMovingX(deltaTime, frameRateMult)
        this.keepMovingZ(deltaTime, frameRateMult)
        //this.keepMoving(engine)

        // Dampen
        let frameGrav = ((gravity/frameRateMult) * deltaTime)
        if (this.spectateMode) playerVelocity = new BABYLON.Vector3(playerVelocity.x * groundFric, playerVelocity.y * groundFric, playerVelocity.z * groundFric)
        else playerVelocity = new BABYLON.Vector3(playerVelocity.x * groundFric, playerVelocity.y + frameGrav, playerVelocity.z * groundFric)

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
        avatar.position = new BABYLON.Vector3(
            avatar.position.x,
            avatar.position.y + ((playerVelocity.y/frameRateMult) * deltaTime),
            avatar.position.z
        )
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