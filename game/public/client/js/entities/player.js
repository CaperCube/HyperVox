import { tileScale } from '../clientConstants.js'

/* ToDo still:
    [X] Player position seperate from avatar position (i.e. avatar.position = this.position + avatarOffset)
    [ ] Iron out colission code to be more robust & efficient
    [ ] Seperate camera modes (i.e. Third-pseron, First-person, No-camera (for npcs or other))
    [ ] Camera animations (movement bobbing, tilt while wall-running, fov change when moving faster, etc...)
    [ ] Seperate into modules, (PlayerManager(for management of all player systems ), Movement(for managing movement types(spectating, platforming, vehicle, etc...) and collisions), Avatar(for managing models, animations, etc...))
        - Think through design of these systems to be efficiently but not needlesly modular.
        - Player object should also be used by NPCs
    [ ] Grapling hook
*/


// collision code
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
function ClientPlayer(controls, avatar, debugLines, thisScene){
    // Player vars
    this.playerHeight = tileScale * 1.75
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
    //     respawn: [Buttons.r]
    // }
    this.debug = false

    this.position = BABYLON.Vector3.Zero() // (This is the value that changes)
    const avatarOffset = { x: 0, y: 1, z: 0 } // This value offsets the player's avatar
    const cameraOffset = { x: 0, y: 0, z: 0 } // Not yet implemented

    // Movement vars
    this.spectateMode = true
    this.moveSpeed = tileScale/40 //0.025
    this.allowedJumps = 2

    // Private vars
    const groundFric = 0.75
    const gravity = -0.0125
    const bounce = 0.05
    let usedJumps = 0
    let playerVelocity = BABYLON.Vector3.Zero()
    let moveForward, moveBackward, moveLeft, moveRight, moveUp, moveDown

    const scene = thisScene
    //let greenMesh, blueMesh, redMesh
    // Init player
    const init = () => {
        this.registerControls(this.controls)

        // greenMesh = createBlockWithUV({x: this.position.x, y: this.position.y, z: this.position.z}, 254, scene)
        // greenMesh.material = scene.transparentMaterial
        // redMesh = createBlockWithUV({x: this.position.x, y: this.position.y, z: this.position.z}, 252, scene)
        // redMesh.material = scene.transparentMaterial
        // blueMesh = createBlockWithUV({x: this.position.x, y: this.position.y, z: this.position.z}, 253, scene)
        // blueMesh.material = scene.transparentMaterial
    }

    // Register controls with actions
    this.registerControls = (c) => {
        assignFunctionToInput(c.upAxis1, ()=>{moveForward=true}, ()=>{moveForward=false})
        assignFunctionToInput(c.downAxis1, ()=>{moveBackward=true}, ()=>{moveBackward=false})
        assignFunctionToInput(c.leftAxis1, ()=>{moveLeft=true}, ()=>{moveLeft=false})
        assignFunctionToInput(c.rightAxis1, ()=>{moveRight=true}, ()=>{moveRight=false})
        assignFunctionToInput(c.jump, ()=>{if (this.spectateMode) moveUp=true; else if (usedJumps < this.allowedJumps) {playerVelocity.y = 0.2; usedJumps++}}, ()=>{moveUp=false})
        assignFunctionToInput(c.run, ()=>{moveDown=true}, ()=>{moveDown=false})
        assignFunctionToInput(c.fire1, ()=>{console.log('shoot!')}, ()=>{})
        assignFunctionToInput(c.respawn, ()=>{this.spectateMode = !this.spectateMode}, ()=>{})
    }

    // Update player movement
    this.platformMovementUpdate = (engine, world) => {
        //const avForward = avatar.getDirection(new BABYLON.Vector3(0, 0, 1))
        //const avUp = avatar.getDirection(new BABYLON.Vector3(0, 1, 0))
        const avRight = avatar.getDirection(new BABYLON.Vector3(1, 0, 0))

        let inputVector = new BABYLON.Vector3(0,0,0)

        // Move controler
        let isMoving = false
        if (moveForward) {
            inputVector.z = 1
            isMoving = true
        }
        if (moveBackward) {
            inputVector.z = -1
            isMoving = true
        }
        if (moveRight) {
            inputVector.x = 1
            isMoving = true
        }
        if (moveLeft) {
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
        let playerBox = {x: (this.position.x - 0.5), y: this.position.y, z: (this.position.z - 0.5), w: 0.5, h: this.playerHeight, d: 0.5}

        // Blocks
        let allowMoveX = true
        let allowMoveY = true
        let allowMoveZ = true
        let allowGrav = true

        // Get player pos in chunk/block coordinates
        // TODO: This does not yet work at the edges of chunks
        // TODO: it just doesn't work well at all
        const getArrayPos = (pos, chunkSize) => {
            return {
                world: {x: Math.floor(pos.x / chunkSize), y: Math.floor(pos.y / chunkSize), z: Math.floor(pos.z / chunkSize) },
                chunk: {x: Math.floor(pos.x % chunkSize), y: Math.floor(pos.y % chunkSize), z: Math.floor(pos.z % chunkSize) }
            }
        }
        const chunkSize = world.getChunkSize()

        // Debug lines
        let pBoxOffset = {x: 0.5, y: 0.5, z: 0.5}
        let debugPath = [
            new BABYLON.Vector3(playerBox.x-(playerBox.w/2)+pBoxOffset.x, playerBox.y-(playerBox.h/2)+pBoxOffset.y, playerBox.z-(playerBox.d/2)+pBoxOffset.z),
            new BABYLON.Vector3(playerBox.x+(playerBox.w/2)+pBoxOffset.x, playerBox.y-(playerBox.h/2)+pBoxOffset.y, playerBox.z-(playerBox.d/2)+pBoxOffset.z),
            new BABYLON.Vector3(playerBox.x+(playerBox.w/2)+pBoxOffset.x, playerBox.y-(playerBox.h/2)+pBoxOffset.y, playerBox.z+(playerBox.d/2)+pBoxOffset.z),
            new BABYLON.Vector3(playerBox.x-(playerBox.w/2)+pBoxOffset.x, playerBox.y-(playerBox.h/2)+pBoxOffset.y, playerBox.z+(playerBox.d/2)+pBoxOffset.z),
            new BABYLON.Vector3(playerBox.x-(playerBox.w/2)+pBoxOffset.x, playerBox.y-(playerBox.h/2)+pBoxOffset.y, playerBox.z-(playerBox.d/2)+pBoxOffset.z),
    
            new BABYLON.Vector3(playerBox.x-(playerBox.w/2)+pBoxOffset.x, playerBox.y+(playerBox.h/2)+pBoxOffset.y, playerBox.z-(playerBox.d/2)+pBoxOffset.z),
            new BABYLON.Vector3(playerBox.x+(playerBox.w/2)+pBoxOffset.x, playerBox.y+(playerBox.h/2)+pBoxOffset.y, playerBox.z-(playerBox.d/2)+pBoxOffset.z),
            new BABYLON.Vector3(playerBox.x+(playerBox.w/2)+pBoxOffset.x, playerBox.y+(playerBox.h/2)+pBoxOffset.y, playerBox.z+(playerBox.d/2)+pBoxOffset.z),
            new BABYLON.Vector3(playerBox.x-(playerBox.w/2)+pBoxOffset.x, playerBox.y+(playerBox.h/2)+pBoxOffset.y, playerBox.z+(playerBox.d/2)+pBoxOffset.z),
            new BABYLON.Vector3(playerBox.x-(playerBox.w/2)+pBoxOffset.x, playerBox.y+(playerBox.h/2)+pBoxOffset.y, playerBox.z-(playerBox.d/2)+pBoxOffset.z)
        ]

        const checkYCol = (block, bOnly) => {

            let bounceOnly = bOnly || false
            // Check Y
            let playerPosCheck = {x: (this.position.x - 0.5), y: this.position.y, z: (this.position.z - 0.5), w: 0.5, h: 2, d: 0.5}
            playerPosCheck.y += playerVelocity.y
            block.y += 0
            if (boxIsIntersecting(playerPosCheck, block)) {
                // Bounce
                this.bounceY()
                if (!bounceOnly) {
                    this.position.y = block.y + (block.h/2) + (playerBox.h/2)//+ this.moveSpeed
                    allowGrav = false
                }
            }
        }

        const checkXCol = (block) => {
            // Check X
            let playerPosCheck = {x: (this.position.x - 0.5), y: this.position.y, z: (this.position.z - 0.5), w: 0.5, h: 2, d: 0.5}
            playerPosCheck.x += playerVelocity.x
            block.y += 0

            if (boxIsIntersecting(playerPosCheck, block)) {
                // Bounce
                this.bounceX()
                //this.position.x = block.x + (block.d/2) + (playerBox.d/2)//+ this.moveSpeed
                //allowMoveX = false
            }
        }

        const checkZCol = (block) => {
            // Check Z
            let playerPosCheck = {x: (this.position.x - 0.5), y: this.position.y, z: (this.position.z - 0.5), w: 0.5, h: 2, d: 0.5}
            playerPosCheck.z += playerVelocity.z
            block.y += 0

            if (boxIsIntersecting(playerPosCheck, block)) {
                // Bounce
                this.bounceZ()
                //this.position.z = block.z + (block.w/2) + (playerBox.w/2)//+ this.moveSpeed
                //allowMoveZ = false
            }
        }
        
        if (!this.spectateMode) {
            // Check X
            for (let cy = -2; cy < 2; cy++) {
            for (let cx = -1; cx < 2; cx++) {
            for (let cz = -1; cz < 2; cz++) {

                // Check X
                let blockPos = {x: this.position.x+cx, y: this.position.y+cy, z: this.position.z+cz}
                let arrayPos = getArrayPos(blockPos, chunkSize)
                let worldPos = arrayPos.world
                let chunkPos = arrayPos.chunk

                let blockID = world.worldChunks[worldPos.y]?.[worldPos.x]?.[worldPos.z]?.[chunkPos.y]?.[chunkPos.x]?.[chunkPos.z]
                let skipMid = (cy >= 0)
                if (skipMid && blockID > 0) {
                    let blockHere = {x: chunkPos.x+(worldPos.x*chunkSize), y: chunkPos.y+(worldPos.y*chunkSize), z: chunkPos.z+(worldPos.z*chunkSize), w: 1, h: 1, d: 1}
                    checkXCol(blockHere)
                    // redMesh.position.x = Math.floor(blockHere.x)+0.5
                    // redMesh.position.y = Math.floor(blockHere.y)+0.5
                    // redMesh.position.z = Math.floor(blockHere.z)+0.5
                }

                // Check Z
                if (skipMid && blockID > 0) {
                    let blockHere = {x: chunkPos.x+(worldPos.x*chunkSize), y: chunkPos.y+(worldPos.y*chunkSize), z: chunkPos.z+(worldPos.z*chunkSize), w: 1, h: 1, d: 1}
                    checkZCol(blockHere)
                    // greenMesh.position.x = Math.floor(blockHere.x)+0.5
                    // greenMesh.position.y = Math.floor(blockHere.y)+0.5
                    // greenMesh.position.z = Math.floor(blockHere.z)+0.5
                }

                // Check Y
                skipMid = (cy < 0 || cy > 0)
                if (skipMid && blockID > 0) {
                    let blockHere = {x: chunkPos.x+(worldPos.x*chunkSize), y: chunkPos.y+(worldPos.y*chunkSize), z: chunkPos.z+(worldPos.z*chunkSize), w: 1, h: 1, d: 1}
                    checkYCol(blockHere, (cy > 0))
                    // blueMesh.position.x = Math.floor(blockHere.x)+0.5
                    // blueMesh.position.y = Math.floor(blockHere.y)+0.5
                    // blueMesh.position.z = Math.floor(blockHere.z)+0.5
                }
            }}}
        }

        // World floor
        let frameGrav = ((gravity/frameRateMult) * deltaTime)
        if (((this.position.y)) <= 1) {
            this.bounceY()
            this.position.y = 1
        }
        else if (!this.spectateMode && allowGrav) {
            // Apply gravity
            playerVelocity.y += frameGrav
        }
        this.keepMovingY(deltaTime, frameRateMult)
        if (allowMoveX) this.keepMovingX(deltaTime, frameRateMult)
        if (allowMoveZ) this.keepMovingZ(deltaTime, frameRateMult)

        // Apply positions
        avatar.position = new BABYLON.Vector3( this.position.x + avatarOffset.x, this.position.y + avatarOffset.y, this.position.z + avatarOffset.z )

        // Dampen
        if (this.spectateMode) playerVelocity = new BABYLON.Vector3(playerVelocity.x * groundFric, playerVelocity.y * groundFric, playerVelocity.z * groundFric)
        else playerVelocity = new BABYLON.Vector3(playerVelocity.x * groundFric, playerVelocity.y, playerVelocity.z * groundFric)

        // Bob camera
        // ...

        // Debug lines
        if (this.debug) debugLines = BABYLON.Mesh.CreateLines(null, debugPath, null, true, debugLines)
    }

    this.bounceY = () => {
        if (Math.abs(playerVelocity.y) > 0) usedJumps = 0 // reset jump
        playerVelocity.y *= -bounce
    }

    this.bounceX = () => {
        playerVelocity.x *= -bounce
    }

    this.bounceZ = () => {
        playerVelocity.z *= -bounce
    }

    this.keepMovingY = (deltaTime, frameRateMult) => {
        // Apply position 
        //if (Math.abs(playerVelocity.y) > this.moveSpeed) {
            this.position = new BABYLON.Vector3(
                this.position.x,
                this.position.y + ((playerVelocity.y/frameRateMult) * deltaTime),
                this.position.z
            )
        //}
    }

    this.keepMovingX = (deltaTime, frameRateMult) => {
        // Apply position
        this.position = new BABYLON.Vector3(
            this.position.x + ((playerVelocity.x/frameRateMult) * deltaTime),
            this.position.y,
            this.position.z
        )
    }

    this.keepMovingZ = (deltaTime, frameRateMult) => {
        // Apply position
        this.position = new BABYLON.Vector3(
            this.position.x,
            this.position.y,
            this.position.z + ((playerVelocity.z/frameRateMult) * deltaTime)
        )
    }

    init()
}

export default ClientPlayer


/*
Thanks for helping out! https://github.com/grothedev

For cutting down player colission to a single boxIsColliding() call:

movementFrame(){
  if (boxIsColliding(playerboxOfNextFrame)){
    reverseComponenOfVelocityPerpindicularToPlaneOfCollision()
  }
}

boxIsColling(box){
  use code similar to current boxcollidecheck func to see if future playerbox will intersect.
  blockIndexX = box.x / motionUnitsPerBlock  //y&z etc.
  world[blockIndexX, etc.]  is either a block or nothing
  if one of the box [faces or vertices or edges idk what's best] is intersecting, the plane of intersection is that which is in between the two blocks
  return this plane
}

"i think it's probably best to check the 8 vertices. then when one has collided, you can use same vertex of current playerbox (right before collision) to find plane. at this point it doesn't matter which particular blocks are being collided with, because you only need to do  velocity.dimensionOfPlaneNormal *= -1;"

*/