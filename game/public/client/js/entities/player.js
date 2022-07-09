import { debug, tileScale, getRandomName, defaultChunkSize } from '../clientConstants.js'
import { getArrayPos } from '../../../common/positionUtils.js'
import { blockCats, blockTypes, getBlockByName } from '../../../common/blockSystem.js'
import { makeCreativeInventory, Inventory } from './player/inventory.js'

/* ToDo still:
    [X] Player position seperate from avatar position (i.e. avatar.position = this.position + avatarOffset)
    [X] Use 'class' instead of 'function'
    [ ] Clean this class up, it's very messy right now
    [ ] Iron out colission code to be more robust & efficient
    [ ] Seperate camera modes (i.e. Third-pseron, First-person, No-camera (for npcs or other))
    [ ] Camera animations (movement bobbing, tilt while wall-running, fov change when moving faster, etc...)
    [ ] Seperate into modules, (PlayerManager(for management of all player systems ), Movement(for managing movement types(spectating, platforming, vehicle, etc...) and collisions), Avatar(for managing models, animations, etc...))
        - Think through design of these systems to be efficiently but not needlesly modular.
        - Player object should also be used by NPCs
    [ ] Grapling hook
*/

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

// ClientPlayer object
class ClientPlayer {

    // Init player
    constructor(controls, avatar = null, playerID = 0, clientGame) {
        this.playerID = playerID
        this.playerName = 'Player'
        this.playerColor = `rgb(${55+Math.random()*200},${55+Math.random()*200},${55+Math.random()*200})`

        // Player vars
        this.playerHeight = tileScale * 1.75
        // The object in the scene the player will be controlling
        this.avatar = avatar? avatar : new BABYLON.TransformNode("root")
        this.body = avatar? null : clientGame.meshGen.createBlockWithUV({x: 0, y: -0.875, z: 0}, getBlockByName('steel-riveted').textures.front, clientGame.scene)
        this.head = avatar? null : BABYLON.Mesh.MergeMeshes([
            clientGame.meshGen.createQuadWithUVs({x: -0.5, y: -0.375, z: -0.5}, 'left', getBlockByName('head').textures.left, clientGame.scene),
            clientGame.meshGen.createQuadWithUVs({x: -0.5, y: -0.375, z: -0.5}, 'front', getBlockByName('head').textures.front, clientGame.scene),
            clientGame.meshGen.createQuadWithUVs({x: -0.5, y: -0.375, z: -0.5}, 'right', getBlockByName('head').textures.right, clientGame.scene),
            clientGame.meshGen.createQuadWithUVs({x: -0.5, y: -0.375, z: -0.5}, 'back', getBlockByName('head').textures.back, clientGame.scene),
            clientGame.meshGen.createQuadWithUVs({x: -0.5, y: -0.375, z: -0.5}, 'top', getBlockByName('head').textures.top, clientGame.scene),
            clientGame.meshGen.createQuadWithUVs({x: -0.5, y: -0.375, z: -0.5}, 'bottom', getBlockByName('head').textures.bottom, clientGame.scene),
            clientGame.meshGen.createQuadWithUVs({x: -0.51, y: -0.745, z: 0.125}, 'left', 244, clientGame.scene),
            clientGame.meshGen.createQuadWithUVs({x: -0.49, y: -0.745, z: 0.125}, 'right', 243, clientGame.scene)
        ], true)
        if (!avatar && this.avatar) {
            this.avatar.position = new BABYLON.Vector3(0, -0.5, 0)
            this.body.scaling.x = this.body.scaling.z = 0.5
            this.body.parent = this.avatar //0.125 - 1 //0.625 //0.875
            this.head.parent = this.avatar //-0.375
        }
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

        // Health vars
        this.health = 100
        this.isInvincible = false
        this.invincibleTime = 500 // time in ms
        this.invincibilityTimer = null // setTimeout(()={this.isInvincible = false}), this.invincibleTime)
        this.inventory = makeCreativeInventory() //new Inventory()
        console.log(this.inventory)

        // Gameplay vars
        // ToDo: a lot of these should only be stored / tracked on the brain, not on the client
        this.isRacing = false
        this.raceStartTime = 0
        this.raceEndTime = 0

        // Respawn vars
        this.respawnPoint = new BABYLON.Vector3(0,0,0)
        this.respawnMesh = clientGame.meshGen.createBlockWithUV(this.respawnPoint, 254, clientGame.scene)
        this.respawnMesh.scaling = new BABYLON.Vector3(0.5,0.5,0.5)
        BABYLON.Animation.CreateAndStartAnimation("spawnPointAnimation", this.respawnMesh, "rotation.y", 30, 120, 0, Math.PI, 1)

        // Position vars
        this.position = BABYLON.Vector3.Zero() // (This is the value that changes)
        this.avatarOffset = { x: 0, y: 1, z: 0 } // This value offsets the player's avatar
        this.cameraOffset = { x: 0, y: 0, z: 0 } // Not yet implemented

        // Movement vars
        this.spectateMode = false
        this.moveSpeed = 0.025 //tileScale/40
        this.flySpeed = 0.05
        this.jumpStength = 0.2
        this.allowedJumps = 2
        this.isInFluid = false
        this.fluidViscosity = 1

        // Private vars
        this.groundFric = 0.75
        this.gravity = -0.0125
        this.defaultBounce = 0.05
        this.bounce = this.defaultBounce
        this.usedJumps = 0
        this.playerVelocity = BABYLON.Vector3.Zero()
        this.moveForward, this.moveBackward, this.moveLeft, this.moveRight, this.moveUp, this.moveDown

        this.clientGame = clientGame
        this.meshGen = clientGame.meshGen
        this.scene = clientGame.scene
        this.world = clientGame.clientWorld
        this.chunkSize = this.world.getChunkSize() || 16
        this.worldSize = this.world.getWorldSize() || 1
        
        const worldMax = (this.worldSize * this.chunkSize * tileScale)
        this.worldDefualtSpawn = new BABYLON.Vector3(worldMax/2, worldMax, worldMax/2)

        this.registerControls(this.controls)

        // Selection vars
        this.blockReach = 4
        this.selectCursor = {x: 0, y: 0, z: 0}
        this.selectedBlock = 1
        this.placeInterval
        this.removeInterval

        this.lastEmbedBlock = null

        // Name tag mesh
        this.selectMesh = this.meshGen.createBlockWithUV({x: this.position.x, y: this.position.y, z: this.position.z}, 251, this.scene)
        this.selectMesh.material = this.scene.transparentMaterial

        this.nameMesh = null

        // If this player is not mine, create the nametag
        console.log("My player ID: ", this.playerID)
        if (this.playerID !== this.clientGame.clientID) {
            this.nameMesh = BABYLON.Mesh.CreatePlane("nameTag", 1, this.scene, false)

            // Create material
            this.nameMesh.material = new BABYLON.StandardMaterial('nameMat')
            this.nameMesh.useAlphaFromDiffuseTexture = true
            this.nameMesh.material.specularColor = new BABYLON.Color3(0, 0, 0)
            this.nameMesh.material.useAlphaFromDiffuseTexture = true

            // Bake rotation
            this.nameMesh.rotation.z = Math.PI
            this.nameMesh.rotation.y = Math.PI
            this.nameMesh.bakeCurrentTransformIntoVertices()

            // Parent mesh to player
            this.nameMesh.setParent(this.avatar)
            this.nameMesh.position = new BABYLON.Vector3(0, 1.5, 0)

            this.nameMesh.material.backFaceCulling = false
            this.nameMesh.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL

            // Set texture
            this.setPlayerName(this.playerName)
        }

        // Debug lines
        this.debugLines = BABYLON.Mesh.CreateLines("debugLines", new BABYLON.Vector3(0,0,0), this.scene, true)
    }

    //ToDo: move this logic to brain
    startRace = () => {
        if (!this.isRacing){
            this.isRacing = true
            this.raceStartTime = Date.now()
        }
    }

    endRace = () => {
        if (this.isRacing) {
            this.isRacing = false
            this.raceEndTime = Date.now()

            const diffTotal = this.raceEndTime - this.raceStartTime
            const diffMin = Math.round(diffTotal / 60000) // minutes
            const diffSec = Math.round((diffTotal % 60000) / 1000) // seconds
            const diffMs = Math.round((diffTotal % 60000) % 1000) // ms

            console.log(this.playerName)
            console.log(this.playerName)

            this.clientGame.clientComs.sendChatMessage(`<u>Finished in: ${diffMin}:${diffSec}:${diffMs}</u>`, this.playerName, this.playerColor)
        }
    }

    takeDamage = (damage) => { // This is not networked at the moment
        if (!this.isInvincible) {
            // Apply damage
            this.health -= damage

            // Turn on the damage indicator
            this.clientGame.hud.enableDamageMarker(this.health)

            // Make the player invincible for a short interval
            this.isInvincible = true
            this.invincibilityTimer = setTimeout( ()=>{this.isInvincible = false}, this.invincibleTime )

            if (this.health > 0) {
                // Bob player's view
                // ToDo: make screen red or something
                this.avatarOffset.y += 0.15
                setTimeout( ()=>{this.avatarOffset.y -= 0.15}, this.invincibleTime/6 )
            }
            else {
                // Player is dead, respawn
                this.health = 100
                this.clientGame.hud.enableDamageMarker(this.health)
                this.teleportPlayer(this.respawnPoint)
            }
            // ToDo: Update health readout
        }
    }

    teleportPlayer = (newPosition) => {
        this.playerVelocity = BABYLON.Vector3.Zero()
        this.position = new BABYLON.Vector3(newPosition.x, newPosition.y, newPosition.z)
    }

    loadEmbed = (block, blockID) => {
        const uniqueBlock = `${blockID}_${block.x}_${block.y}_${block.z}`
        if (uniqueBlock !== this.lastEmbedBlock)
        {
            console.log(uniqueBlock)
            // Get embed URL from world file based on blockID's index data
            let embedUrl = ""
            if (this.world.embeds[uniqueBlock] !== undefined) embedUrl = this.world.embeds[uniqueBlock]

            if (embedUrl) {
                // console.log(this.world.embeds)

                // Set embed
                SetEmbed(embedUrl)

                // Unlock cursor
                this.clientGame.unlockCursor()
            }

            // Remember this block so we don't get double triggering
            this.lastEmbedBlock = uniqueBlock
        }
    }

    interact = () => {
        // Get block & blockID at this.cursor's location

        console.log("Intereact")

        // ToDo: Call item's interaction function
            // Something like: blocks[BlockID].interact(BlockIDData, blockLocation)
    }

    // Set player nametag
    setPlayerName = (newName) => {
        // Set name
        this.playerName = newName

        if (this.playerID !== this.clientGame.clientID) {
            // Draw new texture from menu system bakeText()
            if (this.clientGame.menu.fonts[0])
                this.clientGame.menu.bakeText(newName, this.clientGame.menu.fonts[0], (img) => { 

                    const nameTexture = new BABYLON.Texture(img.src, this.scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE)

                    this.nameMesh.material.diffuseTexture = nameTexture
                    this.nameMesh.material.emissiveTexture = nameTexture

                    this.nameMesh.material.diffuseTexture.hasAlpha = true

                    // Rescale mesh and texture
                    this.nameMesh.scaling.y = 0.5
                    this.nameMesh.scaling.x = (img.width / img.height) / 2
                })
        }
    }

    setPlayerSpawn = (newPos = {x:0, y:0, z:0}) => {
        // Set respawn location
        this.respawnPoint = new BABYLON.Vector3(newPos.x, newPos.y, newPos.z)

        // Move graphic
        if (this.respawnMesh) this.respawnMesh.position = this.respawnPoint
        else {
            this.respawnMesh = this.clientGame.meshGen.createBlockWithUV(this.respawnPoint, 254, this.scene)
            this.respawnMesh.scaling = new BABYLON.Vector3(0.5,0.5,0.5)
            BABYLON.Animation.CreateAndStartAnimation("spawnPointAnimation", this.respawnMesh, "rotation.y", 30, 120, 0, Math.PI, 1)
        }
    }

    // Register controls with actions
    registerControls = (c) => {
        if (c) {
            // Movement
            assignFunctionToInput(c.upAxis1, ()=>{this.moveForward=true}, ()=>{this.moveForward=false})
            assignFunctionToInput(c.downAxis1, ()=>{this.moveBackward=true}, ()=>{this.moveBackward=false})
            assignFunctionToInput(c.leftAxis1, ()=>{this.moveLeft=true}, ()=>{this.moveLeft=false})
            assignFunctionToInput(c.rightAxis1, ()=>{this.moveRight=true}, ()=>{this.moveRight=false})
            // Rotation
            assignFunctionToInput(c.upAxis2, ()=>{if (this.avatar.rotation.x > -Math.PI/2) this.avatar.rotation.x -= Math.PI/4}, ()=>{})
            assignFunctionToInput(c.downAxis2, ()=>{if (this.avatar.rotation.x < Math.PI/2) this.avatar.rotation.x += Math.PI/4}, ()=>{})
            assignFunctionToInput(c.leftAxis2, ()=>{this.avatar.rotation.y -= Math.PI/4}, ()=>{})
            assignFunctionToInput(c.rightAxis2, ()=>{this.avatar.rotation.y += Math.PI/4}, ()=>{})
            // Run, Jump
            assignFunctionToInput(c.jump, ()=>{if (this.spectateMode) this.moveUp=true; else if (this.usedJumps < this.allowedJumps) {this.playerVelocity.y = this.jumpStength; this.usedJumps++}}, ()=>{this.moveUp=false})
            assignFunctionToInput(c.run, ()=>{this.moveDown=true}, ()=>{this.moveDown=false})
            // Build, Use, Shoot
            // ToDo: change fire1 and fire2 to perform the action dictated by this.inventory.selectedItem.useItem(this, 1)
            assignFunctionToInput(c.interact, ()=>{ this.interact() }, ()=>{ })
            assignFunctionToInput(c.fire1, ()=>{ this.placeInterval = setInterval(()=>{this.placeBlock()},150); this.placeBlock() }, ()=>{ clearInterval(this.placeInterval) })
            assignFunctionToInput(c.fire2, ()=>{ this.removeInterval =  setInterval(()=>{this.removeBlock()},150); this.removeBlock() }, ()=>{ clearInterval(this.removeInterval) })
            assignFunctionToInput(c.noclip, ()=>{this.spectateMode = !this.spectateMode}, ()=>{})
            assignFunctionToInput(c.invUp, ()=>{
                this.selectedBlock--
                if (this.selectedBlock < 1) this.selectedBlock = blockTypes.length-1
                this.clientGame.changeInvSlot(this.selectedBlock)
            }, ()=>{})
            assignFunctionToInput(c.invDown, ()=>{
                this.selectedBlock++
                if (this.selectedBlock > blockTypes.length-1) this.selectedBlock = 1
                this.clientGame.changeInvSlot(this.selectedBlock)
            }, ()=>{})
            assignFunctionToInput(c.eyedrop, ()=>{
                const thisBlockPos = getArrayPos({x: this.selectMesh.position.x, y: this.selectMesh.position.y, z: this.selectMesh.position.z}, this.clientGame?.clientWorld?.worldChunks?.[0]?.[0]?.[0]?.length || defaultChunkSize)
                const cursorBlock = this.clientGame?.clientWorld?.worldChunks?.[thisBlockPos.chunk.y]?.[thisBlockPos.chunk.x]?.[thisBlockPos.chunk.z]?.[thisBlockPos.block.y]?.[thisBlockPos.block.x]?.[thisBlockPos.block.z] || null
                if (cursorBlock) {
                    this.selectedBlock = cursorBlock
                    this.clientGame.changeInvSlot(this.selectedBlock)
                }
            }, ()=>{})
        }
        else {
            console.log('No controlls to register')
        }
    }

    // Update player movement
    platformMovementUpdate = (engine) => {
        //const avForward = avatar.getDirection(new BABYLON.Vector3(0, 0, 1))
        //const avUp = avatar.getDirection(new BABYLON.Vector3(0, 1, 0))
        const avRight = this.avatar.getDirection(new BABYLON.Vector3(1, 0, 0))

        let inputVector = new BABYLON.Vector3(0,0,0)

        // Move controler
        if (this.moveForward) {
            inputVector.z = 1
        }
        if (this.moveBackward) {
            inputVector.z = -1
        }
        if (this.moveRight) {
            inputVector.x = 1
        }
        if (this.moveLeft) {
            inputVector.x = -1
        }
        if (this.spectateMode) {
            if (this.moveUp) {
                inputVector.y = 1
            }
            if (this.moveDown) {
                inputVector.y = -1
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
        if (this.spectateMode) {
            this.playerVelocity.x += (movementVector.x * this.flySpeed)
            this.playerVelocity.y += (vertMove.y * this.flySpeed)
            this.playerVelocity.z += (movementVector.z * this.flySpeed)
        }
        else {
            if (this.isInFluid) {
                this.playerVelocity.x += (movementVector.x * this.moveSpeed) / this.fluidViscosity
                this.playerVelocity.z += (movementVector.z * this.moveSpeed) / this.fluidViscosity
            }
            else {
                this.playerVelocity.x += (movementVector.x * this.moveSpeed)
                this.playerVelocity.z += (movementVector.z * this.moveSpeed)
            }
        }

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

        const checkYCol = (block, bOnly, blockID) => {

            let bounceOnly = bOnly || false
            // Check Y
            let playerPosCheck = {x: (this.position.x - 0.5), y: this.position.y, z: (this.position.z - 0.5), w: 0.5, h: 2, d: 0.5}
            playerPosCheck.y += this.playerVelocity.y
            block.y += 0
            if (boxIsIntersecting(playerPosCheck, block)) {

                // Bouncy block
                this.bounce = blockTypes[blockID]?.bounciness || this.defaultBounce

                // Check if block is colidable
                if (!blockTypes[blockID]?.categories.includes(blockCats.noncollidable) && !blockTypes[blockID]?.categories.includes(blockCats.fluid)) {
                    // Bounce
                    if (!bounceOnly) {
                        this.position.y = ((block.y + (block.h/2)) + (playerBox.h/2)) + 0.001 //+ this.moveSpeed
                        allowGrav = false
                    }
                    else {
                        const playerIsBelow = (this.position.y + (playerBox.h/2)) < (block.y)
                        if (playerIsBelow) this.position.y = ((block.y - (block.h/2)) - (playerBox.h/2)) - 0.001
                    }
                    this.bounceY()
                }
                
                // Damage player if damaging block
                if (blockTypes[blockID]?.categories.includes(blockCats.damaging)) this.takeDamage(blockTypes[blockID].damage || 0)
                // Set respawn point if respawn block
                if (blockTypes[blockID]?.categories.includes(blockCats.checkpoint) && {x: this.respawnPoint.x, y: this.respawnPoint.y, z: this.respawnPoint.z} !== {x: block.x + (block.h/2), y: block.y + this.playerHeight, z: block.z + (block.h/2)}) this.setPlayerSpawn({x: block.x + (block.h/2), y: block.y + this.playerHeight, z: block.z + (block.h/2)})
                // Teleporter block
                if (blockTypes[blockID]?.categories.includes(blockCats.teleporter)) this.teleportPlayer(this.worldDefualtSpawn)
                // Start race if starting line block
                if (blockTypes[blockID]?.categories.includes(blockCats.raceStart)) this.startRace()
                // Start race if starting line block
                if (blockTypes[blockID]?.categories.includes(blockCats.raceEnd)) this.endRace()
                // Load embed on colide
                if (blockTypes[blockID]?.categories.includes(blockCats.embed)) this.loadEmbed(block, blockID)
                // Fluid
                if (blockTypes[blockID]?.categories.includes(blockCats.fluid)) { this.fluidViscosity = blockTypes[blockID].viscosity || 1; this.isInFluid = true }
            }
        }

        const checkXCol = (block, blockID) => {
            // Check X
            let playerPosCheck = {x: (this.position.x - 0.5), y: this.position.y, z: (this.position.z - 0.5), w: 0.5, h: 2, d: 0.5}
            playerPosCheck.x += this.playerVelocity.x
            block.y += 0

            if (boxIsIntersecting(playerPosCheck, block)) {

                // Bouncy block
                this.bounce = blockTypes[blockID]?.bounciness || this.defaultBounce

                // Check if block is colidable
                if (!blockTypes[blockID]?.categories.includes(blockCats.noncollidable) && !blockTypes[blockID]?.categories.includes(blockCats.fluid)) {
                    // Move player to contact
                    // const playerIsBelow = (this.position.y + (playerBox.h/2)) < (block.y)
                    // if (!playerIsBelow) {
                    //     const playerIsBehind = (this.position.x + (playerBox.d/2)) < block.x
                    //     if (playerIsBehind) this.position.x = ((block.x - (block.d/2)) + (playerBox.d/2)) - 0.001
                    //     else this.position.x = ((block.x + (block.d)) + (playerBox.d/2)) + 0.001
                    // }

                    // Bounce
                    this.bounceX()
                    //this.position.x = block.x + (block.d/2) + (playerBox.d/2)//+ this.moveSpeed
                    //allowMoveX = false
                }

                // Damage player if damaging block
                if (blockTypes[blockID]?.categories.includes(blockCats.damaging)) this.takeDamage(blockTypes[blockID].damage || 0)
                // Set respawn point if respawn block
                if (blockTypes[blockID]?.categories.includes(blockCats.checkpoint) && {x: this.respawnPoint.x, y: this.respawnPoint.y, z: this.respawnPoint.z} !== {x: block.x + (block.h/2), y: block.y + this.playerHeight, z: block.z + (block.h/2)}) this.setPlayerSpawn({x: block.x + (block.h/2), y: block.y + this.playerHeight, z: block.z + (block.h/2)})
                // Teleporter block
                if (blockTypes[blockID]?.categories.includes(blockCats.teleporter)) this.teleportPlayer(this.worldDefualtSpawn)
                // Start race if starting line block
                if (blockTypes[blockID]?.categories.includes(blockCats.raceStart)) this.startRace()
                // Start race if starting line block
                if (blockTypes[blockID]?.categories.includes(blockCats.raceEnd)) this.endRace()
                // Load embed on colide
                if (blockTypes[blockID]?.categories.includes(blockCats.embed)) this.loadEmbed(block, blockID)
                // Fluid
                if (blockTypes[blockID]?.categories.includes(blockCats.fluid)) { this.fluidViscosity = blockTypes[blockID].viscosity || 1; this.isInFluid = true }
            }
        }

        const checkZCol = (block, blockID) => {
            // Check Z
            let playerPosCheck = {x: (this.position.x - 0.5), y: this.position.y, z: (this.position.z - 0.5), w: 0.5, h: 2, d: 0.5}
            playerPosCheck.z += this.playerVelocity.z
            block.y += 0

            if (boxIsIntersecting(playerPosCheck, block)) {

                // Bouncy block
                this.bounce = blockTypes[blockID]?.bounciness || this.defaultBounce
                
                // Check if block is colidable
                if (!blockTypes[blockID]?.categories.includes(blockCats.noncollidable) && !blockTypes[blockID]?.categories.includes(blockCats.fluid)) {
                    // Move player to contact
                    // const playerIsBelow = (this.position.y + (playerBox.h/2)) < (block.y)
                    // if (!playerIsBelow) {    
                    //     const playerIsLeft = (this.position.z + (playerBox.w/2)) < (block.z)
                    //     if (playerIsLeft) this.position.z = ((block.z - (block.w/2)) + (playerBox.w/2)) - 0.001
                    //     else this.position.z = ((block.z + (block.w)) + (playerBox.w/2)) + 0.001
                    // }

                    // Bounce
                    this.bounceZ()
                    //this.position.z = block.z + (block.w/2) + (playerBox.w/2)//+ this.moveSpeed
                    //allowMoveZ = false
                }

                // Damage player if damaging block
                if (blockTypes[blockID]?.categories.includes(blockCats.damaging)) this.takeDamage(blockTypes[blockID].damage || 0)
                // Set respawn point if respawn block
                if (blockTypes[blockID]?.categories.includes(blockCats.checkpoint) && {x: this.respawnPoint.x, y: this.respawnPoint.y, z: this.respawnPoint.z} !== {x: block.x + (block.h/2), y: block.y + this.playerHeight, z: block.z + (block.h/2)}) this.setPlayerSpawn({x: block.x + (block.h/2), y: block.y + this.playerHeight, z: block.z + (block.h/2)})
                // Teleporter block
                if (blockTypes[blockID]?.categories.includes(blockCats.teleporter)) this.teleportPlayer(this.worldDefualtSpawn)
                // Start race if starting line block
                if (blockTypes[blockID]?.categories.includes(blockCats.raceStart)) this.startRace()
                // Start race if starting line block
                if (blockTypes[blockID]?.categories.includes(blockCats.raceEnd)) this.endRace()
                // Load embed on colide
                if (blockTypes[blockID]?.categories.includes(blockCats.embed)) this.loadEmbed(block, blockID)
                // Fluid
                if (blockTypes[blockID]?.categories.includes(blockCats.fluid)) { this.fluidViscosity = blockTypes[blockID].viscosity || 1; this.isInFluid = true }
            }
        }
        
        if (!this.spectateMode && this.world) {
            this.isInFluid = false
            // Check X
            for (let cy = -2; cy < 2; cy++) {
            for (let cx = -1; cx < 2; cx++) {
            for (let cz = -1; cz < 2; cz++) {

                // Check this block
                let blockPos = {x: this.position.x+cx, y: this.position.y+cy, z: this.position.z+cz}
                let arrayPos = getArrayPos(blockPos, this.chunkSize)
                let worldPos = arrayPos.chunk
                let chunkPos = arrayPos.block

                let blockID = this.world.worldChunks[worldPos.y]?.[worldPos.x]?.[worldPos.z]?.[chunkPos.y]?.[chunkPos.x]?.[chunkPos.z]

                // Check X
                let skipMid = (cy >= 0)
                if (skipMid && blockID > 0) {
                    let blockHere = {x: chunkPos.x+(worldPos.x*this.chunkSize), y: chunkPos.y+(worldPos.y*this.chunkSize), z: chunkPos.z+(worldPos.z*this.chunkSize), w: 1, h: 1, d: 1} // ToDo: replace size values with "tileSize"
                    checkXCol(blockHere, blockID)
                }

                // Check Z
                if (skipMid && blockID > 0) {
                    let blockHere = {x: chunkPos.x+(worldPos.x*this.chunkSize), y: chunkPos.y+(worldPos.y*this.chunkSize), z: chunkPos.z+(worldPos.z*this.chunkSize), w: 1, h: 1, d: 1}
                    checkZCol(blockHere, blockID)
                }

                // Check Y
                skipMid = (cy < 0 || cy > 0)
                if (skipMid && blockID > 0) {
                    let blockHere = {x: chunkPos.x+(worldPos.x*this.chunkSize), y: chunkPos.y+(worldPos.y*this.chunkSize), z: chunkPos.z+(worldPos.z*this.chunkSize), w: 1, h: 1, d: 1}
                    checkYCol(blockHere, (cy > 0), blockID)
                }
            }}}
        }

        // World floor Y lower bounds
        let frameGrav = ((this.gravity/frameRateMult) * deltaTime)
        if (this.isInFluid) frameGrav = (((this.gravity / this.fluidViscosity)/frameRateMult) * deltaTime)
        if (((this.position.y)) < 1) {
            this.bounceY()
            this.position.y = 1
        }
        else if (!this.spectateMode && allowGrav) {
            // Apply gravity
            this.playerVelocity.y += frameGrav
        }
        this.keepMovingY(deltaTime, frameRateMult)

        if (!this.spectateMode) {
            // World X bounds
            if (this.position.x < 0) {
                this.bounceX()
                this.position.x = 0
            }
            else if (this.position.x > (this.worldSize * this.chunkSize * tileScale)) {
                this.bounceX()
                this.position.x = (this.worldSize * this.chunkSize * tileScale)
            }

            // World Z bounds
            if (this.position.z < 0) {
                this.bounceZ()
                this.position.z = 0
            }
            else if (this.position.z > (this.worldSize * this.chunkSize * tileScale)) {
                this.bounceZ()
                this.position.z = (this.worldSize * this.chunkSize * tileScale)
            }
        }

        if (allowMoveX) this.keepMovingX(deltaTime, frameRateMult)
        if (allowMoveZ) this.keepMovingZ(deltaTime, frameRateMult)

        // Apply positions
        this.updatePosition()

        // Dampen
        if (this.spectateMode) this.playerVelocity = new BABYLON.Vector3(this.playerVelocity.x * this.groundFric, this.playerVelocity.y * this.groundFric, this.playerVelocity.z * this.groundFric)
        this.playerVelocity = new BABYLON.Vector3(this.playerVelocity.x * this.groundFric, this.playerVelocity.y, this.playerVelocity.z * this.groundFric)

        // Position selector
        const avForward = this.avatar.getDirection(new BABYLON.Vector3(0, 0, 1))
        this.selectCursor = {
            // x: Math.floor( avatar.position.x ) + Math.round( (avForward.x * this.blockReach) ) + 0.5,
            // y: Math.floor( avatar.position.y ) + Math.round( (avForward.y * this.blockReach) ) + 0.5,
            // z: Math.floor( avatar.position.z ) + Math.round( (avForward.z * this.blockReach) ) + 0.5
            x: Math.floor( this.avatar.position.x + (avForward.x * this.blockReach) ) + 0.5,
            y: Math.floor( this.avatar.position.y + (avForward.y * this.blockReach) ) + 0.5,
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
            // ToDo: Use Raycaster instead
            
            // const testWorldPos = getArrayPos(testPos, this.chunkSize)
            // const testID = world.worldChunks[testWorldPos.chunk.y]?.[testWorldPos.chunk.x]?.[testWorldPos.chunk.z]?.[testWorldPos.block.y]?.[testWorldPos.block.x]?.[testWorldPos.block.z]
            // if (testID === 0) { // Change to `if (testID !==null || !unselectable.includes(testID))`
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
        if (this.debug) this.debugLines = BABYLON.Mesh.CreateLines(null, debugPath, null, true, debugLines)
    }

    placeBlock = () => {
        this.clientGame.updateSingleBlock({x: this.selectMesh.position.x, y: this.selectMesh.position.y, z: this.selectMesh.position.z}, this.selectedBlock)
    }

    removeBlock = () => {
        this.clientGame.updateSingleBlock({x: this.selectMesh.position.x, y: this.selectMesh.position.y, z: this.selectMesh.position.z}, 0)
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

    updatePosition() {
        this.avatar.position = new BABYLON.Vector3( this.position.x + this.avatarOffset.x, this.position.y + this.avatarOffset.y, this.position.z + this.avatarOffset.z )
    }
}

export default ClientPlayer