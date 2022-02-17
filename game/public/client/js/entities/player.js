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
    this.moveSpeed = 0.5//tileScale/20

    // Private vars
    let moveDirection
    let moveForward, moveBackward, moveLeft, moveRight

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
        assignFunctionToInput(c.jump, ()=>{console.log('jump!')}, ()=>{})
        assignFunctionToInput(c.run, ()=>{console.log('run!')}, ()=>{})
        assignFunctionToInput(c.fire1, ()=>{console.log('shoot!')}, ()=>{})
    }

    // Update player movement
    this.movementUpdate = () => {
        // Move controler
        let isMoving = false
        if (moveForward) {
            console.log('moving')
            //controls.moveForward(moveSpeed)
            avatar.position.z += this.moveSpeed
            isMoving = true
        }
        if (moveBackward) {
            //controls.moveForward(-moveSpeed)
            avatar.position.z -= this.moveSpeed
            isMoving = true
        }
        if (moveRight) {
            //controls.moveRight(moveSpeed)
            avatar.position.x += this.moveSpeed
            isMoving = true
        }
        if (moveLeft) {
            //controls.moveRight(-moveSpeed)
            avatar.position.x -= this.moveSpeed
            isMoving = true
        }

        // Bob camera
        //if (isMoving) camera.position.y = (Math.sin(frame/4) * (tileScale/20)) + playerHeight
    }

    init()
}