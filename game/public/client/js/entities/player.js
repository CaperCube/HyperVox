import { tileScale } from '../clientConstants.js'

/* ToDo still:
    [X] Player position seperate from avatar position (i.e. avatar.position = this.position + avatarOffset)
    [X] Use 'class' instead of 'function'
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

// ToDo: Clean-p a bunch of these object references from CleintPlayer
// We don't want the player to have access to all this garbage

// Player object
class ClientPlayer {

    // Init player
    constructor(controls, avatar, debugLines, world, meshGen, thisScene) {
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
        //     fire1: [Buttons.lmb],
        //     invUp: [Buttons.equals],
        //     invDown: [Buttons.minus],
        //     respawn: [Buttons.r]
        // }
        this.debug = false

        this.position = BABYLON.Vector3.Zero() // (This is the value that changes)
        this.avatarOffset = { x: 0, y: 1, z: 0 } // This value offsets the player's avatar
        this.cameraOffset = { x: 0, y: 0, z: 0 } // Not yet implemented

        // Movement vars
        this.spectateMode = true
        this.moveSpeed = tileScale/40 //0.025
        this.allowedJumps = 2

        // Private vars
        this.groundFric = 0.75
        this.gravity = -0.0125
        this.bounce = 0.05
        this.usedJumps = 0
        this.playerVelocity = BABYLON.Vector3.Zero()
        this.moveForward, this.moveBackward, this.moveLeft, this.moveRight, this.moveUp, this.moveDown

        this.meshGen = meshGen
        this.scene = thisScene
        this.world = world
        this.chunkSize = world.getChunkSize() || 16
        this.worldSize = world.getWorldSize() || 1
        // let greenMesh, blueMesh, redMesh

        this.registerControls(this.controls)

        // Selection vars
        this.blockReach = 4
        this.selectCursor = {x: 0, y: 0, z: 0}
        this.selectedBlock = 1

        this.selectMesh = this.meshGen.createBlockWithUV({x: this.position.x, y: this.position.y, z: this.position.z}, 251, this.scene)
        this.selectMesh.material = this.scene.transparentMaterial
        // greenMesh = createBlockWithUV({x: this.position.x, y: this.position.y, z: this.position.z}, 254, scene)
        // greenMesh.material = scene.transparentMaterial
        // redMesh = createBlockWithUV({x: this.position.x, y: this.position.y, z: this.position.z}, 252, scene)
        // redMesh.material = scene.transparentMaterial
        // blueMesh = createBlockWithUV({x: this.position.x, y: this.position.y, z: this.position.z}, 253, scene)
        // blueMesh.material = scene.transparentMaterial
    }

    // Register controls with actions
    registerControls = (c) => {
        assignFunctionToInput(c.upAxis1, ()=>{this.moveForward=true}, ()=>{this.moveForward=false})
        assignFunctionToInput(c.downAxis1, ()=>{this.moveBackward=true}, ()=>{this.moveBackward=false})
        assignFunctionToInput(c.leftAxis1, ()=>{this.moveLeft=true}, ()=>{this.moveLeft=false})
        assignFunctionToInput(c.rightAxis1, ()=>{this.moveRight=true}, ()=>{this.moveRight=false})
        assignFunctionToInput(c.jump, ()=>{if (this.spectateMode) this.moveUp=true; else if (this.usedJumps < this.allowedJumps) {this.playerVelocity.y = 0.2; this.usedJumps++}}, ()=>{this.moveUp=false})
        assignFunctionToInput(c.run, ()=>{this.moveDown=true}, ()=>{this.moveDown=false})
        assignFunctionToInput(c.fire1, ()=>{this.placeBlock()}, ()=>{})
        assignFunctionToInput(c.fire2, ()=>{this.removeBlock()}, ()=>{})
        assignFunctionToInput(c.respawn, ()=>{this.spectateMode = !this.spectateMode}, ()=>{})
        assignFunctionToInput(c.invUp, ()=>{this.selectedBlock++; if (this.selectedBlock > 9) this.selectedBlock = 1; console.log(this.selectedBlock);}, ()=>{})
        assignFunctionToInput(c.invDown, ()=>{this.selectedBlock--; if (this.selectedBlock < 1) this.selectedBlock = 9; console.log(this.selectedBlock);}, ()=>{})
    }

    // Update player movement
    platformMovementUpdate = (engine) => {
        //const avForward = avatar.getDirection(new BABYLON.Vector3(0, 0, 1))
        //const avUp = avatar.getDirection(new BABYLON.Vector3(0, 1, 0))
        const avRight = this.avatar.getDirection(new BABYLON.Vector3(1, 0, 0))

        let inputVector = new BABYLON.Vector3(0,0,0)

        // Move controler
        let isMoving = false
        if (this.moveForward) {
            inputVector.z = 1
            isMoving = true
        }
        if (this.moveBackward) {
            inputVector.z = -1
            isMoving = true
        }
        if (this.moveRight) {
            inputVector.x = 1
            isMoving = true
        }
        if (this.moveLeft) {
            inputVector.x = -1
            isMoving = true
        }
        if (this.spectateMode) {
            if (this.moveUp) {
                inputVector.y = 1
                isMoving = true
            }
            if (this.moveDown) {
                inputVector.y = -1
                isMoving = true
            }
        }

        // Apply Input
        // if grounded, get ground normal, use it when calculating movement on slopes
        //let forwardMove = new BABYLON.Vector3( inputVector.z * avForward.x, 0, inputVector.z * avForward.z )
        let forwardMove = new BABYLON.Vector3( inputVector.z * Math.sin(this.avatar.rotation.y), 0, inputVector.z * Math.cos(this.avatar.rotation.y) )
        let horzMove = new BABYLON.Vector3( inputVector.x * avRight.x, 0, inputVector.x * avRight.z )
        let vertMove = new BABYLON.Vector3( 0, inputVector.y, 0 )
        let movementVector = new BABYLON.Vector3( forwardMove.x + horzMove.x, vertMove.y, forwardMove.z + horzMove.z )
        
        // Apply velocity
        this.playerVelocity.x += (movementVector.x * this.moveSpeed)
        if (this.spectateMode) this.playerVelocity.y += (vertMove.y * this.moveSpeed)
        this.playerVelocity.z += (movementVector.z * this.moveSpeed)

        // Apply movement
        const deltaTime = engine.getDeltaTime()
        const frameRateMult = 1000/60//engine.getFps().toFixed()//1000/60  //(1 sec / fps)
        let playerBox = {x: (this.position.x - 0.5), y: this.position.y, z: (this.position.z - 0.5), w: 0.5, h: this.playerHeight, d: 0.5}

        // Blocks
        let allowMoveX = true
        let allowMoveY = true
        let allowMoveZ = true
        let allowGrav = true

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
            playerPosCheck.y += this.playerVelocity.y
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
            playerPosCheck.x += this.playerVelocity.x
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
            playerPosCheck.z += this.playerVelocity.z
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
                let arrayPos = this.getArrayPos(blockPos)
                let worldPos = arrayPos.world
                let chunkPos = arrayPos.chunk

                let blockID = this.world.worldChunks[worldPos.y]?.[worldPos.x]?.[worldPos.z]?.[chunkPos.y]?.[chunkPos.x]?.[chunkPos.z]
                let skipMid = (cy >= 0)
                if (skipMid && blockID > 0) {
                    let blockHere = {x: chunkPos.x+(worldPos.x*this.chunkSize), y: chunkPos.y+(worldPos.y*this.chunkSize), z: chunkPos.z+(worldPos.z*this.chunkSize), w: 1, h: 1, d: 1}
                    checkXCol(blockHere)
                    // redMesh.position.x = Math.floor(blockHere.x)+0.5
                    // redMesh.position.y = Math.floor(blockHere.y)+0.5
                    // redMesh.position.z = Math.floor(blockHere.z)+0.5
                }

                // Check Z
                if (skipMid && blockID > 0) {
                    let blockHere = {x: chunkPos.x+(worldPos.x*this.chunkSize), y: chunkPos.y+(worldPos.y*this.chunkSize), z: chunkPos.z+(worldPos.z*this.chunkSize), w: 1, h: 1, d: 1}
                    checkZCol(blockHere)
                    // greenMesh.position.x = Math.floor(blockHere.x)+0.5
                    // greenMesh.position.y = Math.floor(blockHere.y)+0.5
                    // greenMesh.position.z = Math.floor(blockHere.z)+0.5
                }

                // Check Y
                skipMid = (cy < 0 || cy > 0)
                if (skipMid && blockID > 0) {
                    let blockHere = {x: chunkPos.x+(worldPos.x*this.chunkSize), y: chunkPos.y+(worldPos.y*this.chunkSize), z: chunkPos.z+(worldPos.z*this.chunkSize), w: 1, h: 1, d: 1}
                    checkYCol(blockHere, (cy > 0))
                    // blueMesh.position.x = Math.floor(blockHere.x)+0.5
                    // blueMesh.position.y = Math.floor(blockHere.y)+0.5
                    // blueMesh.position.z = Math.floor(blockHere.z)+0.5
                }
            }}}
        }

        // World floor
        let frameGrav = ((this.gravity/frameRateMult) * deltaTime)
        if (((this.position.y)) <= 1) {
            this.bounceY()
            this.position.y = 1
        }
        else if (!this.spectateMode && allowGrav) {
            // Apply gravity
            this.playerVelocity.y += frameGrav
        }
        this.keepMovingY(deltaTime, frameRateMult)
        if (allowMoveX) this.keepMovingX(deltaTime, frameRateMult)
        if (allowMoveZ) this.keepMovingZ(deltaTime, frameRateMult)

        // Apply positions
        this.avatar.position = new BABYLON.Vector3( this.position.x + this.avatarOffset.x, this.position.y + this.avatarOffset.y, this.position.z + this.avatarOffset.z )

        // Dampen
        if (this.spectateMode) this.playerVelocity = new BABYLON.Vector3(this.playerVelocity.x * this.groundFric, this.playerVelocity.y * this.groundFric, this.playerVelocity.z * this.groundFric)
        else this.playerVelocity = new BABYLON.Vector3(this.playerVelocity.x * this.groundFric, this.playerVelocity.y, this.playerVelocity.z * this.groundFric)

        // Position selector
        const avForward = this.avatar.getDirection(new BABYLON.Vector3(0, 0, 1))
        this.selectCursor = {
            // x: Math.floor( avatar.position.x ) + Math.round( (avForward.x * this.blockReach) ) + 0.5,
            // y: Math.floor( avatar.position.y ) + Math.round( (avForward.y * this.blockReach) ) + 0.5,
            // z: Math.floor( avatar.position.z ) + Math.round( (avForward.z * this.blockReach) ) + 0.5
            x: Math.floor( this.avatar.position.x + (avForward.x * this.blockReach) ) + 0.5,
            y: Math.floor( this.avatar.position.y  + (avForward.y * this.blockReach) ) + 0.5,
            z: Math.floor( this.avatar.position.z + (avForward.z * this.blockReach) ) + 0.5
        }

        let isObstructed = false
        for (let i = this.blockReach; i > 0; i--) {
            let testPos = {
                // x: Math.floor( avatar.position.x ) + Math.round( (avForward.x * i) ) + 0.5,
                // y: Math.floor( avatar.position.y ) + Math.round( (avForward.y * i) ) + 0.5,
                // z: Math.floor( avatar.position.z ) + Math.round( (avForward.z * i) ) + 0.5
                x: Math.floor( this.avatar.position.x + (avForward.x * i) ) + 0.5,
                y: Math.floor( this.avatar.position.y + (avForward.y * i) ) + 0.5,
                z: Math.floor( this.avatar.position.z + (avForward.z * i) ) + 0.5
            }
            // ToDo: refine this to allow for better selection accuracy
            // const testWorldPos = this.getArrayPos(testPos, chunkSize)
            // const testID = world.worldChunks[testWorldPos.world.y]?.[testWorldPos.world.x]?.[testWorldPos.world.z]?.[testWorldPos.chunk.y]?.[testWorldPos.chunk.x]?.[testWorldPos.chunk.z]
            // if (testID === 0) { // ToDo: change to `if (testID !==null || !unselectable.includes(testID))`
            //     if (isObstructed) {
            //         this.selectCursor = testPos
            //         break
            //     }
            // }
            // else isObstructed = true
        }
        this.selectMesh.position = new BABYLON.Vector3( this.selectCursor.x, this.selectCursor.y, this.selectCursor.z )

        // Bob camera
        // ...

        // Debug lines
        if (this.debug) debugLines = BABYLON.Mesh.CreateLines(null, debugPath, null, true, debugLines)
    }

    // Get player pos in chunk/block coordinates
    getArrayPos = (pos) => {
        return {
            world: {x: Math.floor(pos.x / this.chunkSize), y: Math.floor(pos.y / this.chunkSize), z: Math.floor(pos.z / this.chunkSize) },
            chunk: {x: Math.floor(pos.x % this.chunkSize), y: Math.floor(pos.y % this.chunkSize), z: Math.floor(pos.z % this.chunkSize) }
        }
    }

    placeBlock = () => {
        // Get world position
        const newBlockWorldPos = this.getArrayPos(this.selectCursor)
        const isWithinExsitingChunk = (
            newBlockWorldPos.world.z < this.worldSize && newBlockWorldPos.world.z >= 0 &&
            newBlockWorldPos.world.x < this.worldSize && newBlockWorldPos.world.x >= 0 &&
            newBlockWorldPos.world.y < this.worldSize && newBlockWorldPos.world.y >= 0
        )
        if (isWithinExsitingChunk) {
            // Update chunk
            const worldOffset = {x: newBlockWorldPos.world.x, y: newBlockWorldPos.world.y, z: newBlockWorldPos.world.z}
            const changePostion = {x: newBlockWorldPos.chunk.x, y: newBlockWorldPos.chunk.y, z: newBlockWorldPos.chunk.z}
            let updatedChunk = this.world.worldChunks[worldOffset.y][worldOffset.x][worldOffset.z]
            updatedChunk[changePostion.y][changePostion.x][changePostion.z] = this.selectedBlock

            // Send event to brain to update the chunk
            //...

            // Update mesh (this will happen once the brain sends back an event)
            this.meshGen.createBlockWithUV({x: this.selectMesh.position.x, y: this.selectMesh.position.y, z: this.selectMesh.position.z}, this.selectedBlock, this.scene)
            // meshGen.updateChunkMesh(worldChunkMeshes, updatedChunk, changePostion, worldOffset, false)
        }
    }

    removeBlock = () => {
        // Get world position
        const newBlockWorldPos = this.getArrayPos(this.selectCursor)
        const isWithinExsitingChunk = (
            newBlockWorldPos.world.z < this.worldSize && newBlockWorldPos.world.z >= 0 &&
            newBlockWorldPos.world.x < this.worldSize && newBlockWorldPos.world.x >= 0 &&
            newBlockWorldPos.world.y < this.worldSize && newBlockWorldPos.world.y >= 0
        )
        if (isWithinExsitingChunk) {
            // Update chunk
            const worldOffset = {x: newBlockWorldPos.world.x, y: newBlockWorldPos.world.y, z: newBlockWorldPos.world.z}
            const changePostion = {x: newBlockWorldPos.chunk.x, y: newBlockWorldPos.chunk.y, z: newBlockWorldPos.chunk.z}
            let updatedChunk = this.world.worldChunks[worldOffset.y][worldOffset.x][worldOffset.z]
            updatedChunk[changePostion.y][changePostion.x][changePostion.z] = 0

            // Send event to brain to update the chunk
            //...

            // Update mesh (this will happen once the brain sends back an event)
            // meshGen.updateChunkMesh(worldChunkMeshes, updatedChunk, changePostion, worldOffset, true)
        }
    }

    bounceY = () => {
        if (Math.abs(this.playerVelocity.y) > 0) this.usedJumps = 0 // reset jump
        this.playerVelocity.y *= -this.bounce
    }

    bounceX = () => {
        this.playerVelocity.x *= -this.bounce
    }

    bounceZ = () => {
        this.playerVelocity.z *= -this.bounce
    }

    keepMovingY = (deltaTime, frameRateMult) => {
        // Apply position 
        //if (Math.abs(playerVelocity.y) > this.moveSpeed) {
            this.position = new BABYLON.Vector3(
                this.position.x,
                this.position.y + ((this.playerVelocity.y/frameRateMult) * deltaTime),
                this.position.z
            )
        //}
    }

    keepMovingX = (deltaTime, frameRateMult) => {
        // Apply position
        this.position = new BABYLON.Vector3(
            this.position.x + ((this.playerVelocity.x/frameRateMult) * deltaTime),
            this.position.y,
            this.position.z
        )
    }

    keepMovingZ = (deltaTime, frameRateMult) => {
        // Apply position
        this.position = new BABYLON.Vector3(
            this.position.x,
            this.position.y,
            this.position.z + ((this.playerVelocity.z/frameRateMult) * deltaTime)
        )
    }
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