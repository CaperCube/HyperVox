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
    this.moveSpeed = 0.05//tileScale/20

    // Private vars
    const groundFric = 0.75
    const gravity = 0//-0.1
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
        assignFunctionToInput(c.jump, ()=>{moveUp=true}, ()=>{moveUp=false})
        assignFunctionToInput(c.run, ()=>{moveDown=true}, ()=>{moveDown=false})
        assignFunctionToInput(c.fire1, ()=>{console.log('shoot!')}, ()=>{})
    }

    // Update player movement
    this.movementUpdate = () => {
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
        avatar.position = new BABYLON.Vector3( avatar.position.x + playerVelocity.x, avatar.position.y + playerVelocity.y, avatar.position.z + playerVelocity.z)

        // Dampen
        if (this.spectateMode) playerVelocity = new BABYLON.Vector3(playerVelocity.x * groundFric, playerVelocity.y * groundFric, playerVelocity.z * groundFric)
        else playerVelocity = new BABYLON.Vector3(playerVelocity.x * groundFric, playerVelocity.y + gravity, playerVelocity.z * groundFric)

        // Bob camera
        //if (isMoving) camera.position.y = (Math.sin(frame/4) * (tileScale/20)) + playerHeight
    }

    init()
}

export default ClientPlayer