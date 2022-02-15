let playerHeight = tileScale * 1.5

let moveForward, moveBackward, moveLeft, moveRight
let moveSpeed = tileScale/20

function movementUpdate() {
    // Move controler
    let isMoving = false
    if (moveForward) {
        //controls.moveForward(moveSpeed)
        isMoving = true
    }
    if (moveBackward) {
        //controls.moveForward(-moveSpeed)
        isMoving = true
    }
    if (moveRight) {
        //controls.moveRight(moveSpeed)
        isMoving = true
    }
    if (moveLeft) {
        //controls.moveRight(-moveSpeed)
        isMoving = true
    }

    // Bob camera
    //if (isMoving) camera.position.y = (Math.sin(frame/4) * (tileScale/20)) + playerHeight
}