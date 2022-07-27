import { debug, tileScale, getRandomName, defaultChunkSize } from '../clientConstants.js'
import { getArrayPos, getGlobalPos, boxIsIntersecting } from '../../../common/positionUtils.js'
import { blockCats, blockTypes, getBlockByName } from '../../../common/blockSystem.js'
import { makeCreativeInventory, Inventory } from './player/inventory.js'
import { soundSRC, sounds } from "../resources.js"

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

// ClientPlayer object
class ClientPlayer {

    // Init player
    constructor(controls, avatar = null, playerID = 0, clientGame) {
        this.playerID = playerID
        this.playerName = 'Player'
        this.playerColor = `rgb(${55+Math.random()*200},${55+Math.random()*200},${55+Math.random()*200})`

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

        // Player vars
        this.playerHeight = tileScale * 1.75
        // The object in the scene the player will be controlling
        this.avatar = avatar? avatar : new BABYLON.TransformNode("root")
        this.itemMesh = null
        this.body = avatar? null : clientGame.meshGen.createBlockWithUV({x: 0, y: -0.875, z: 0}, getBlockByName('steel-riveted').textures.front, clientGame.scene)
        this.head = avatar? null : BABYLON.Mesh.MergeMeshes([
            // Head
            clientGame.meshGen.createQuadWithUVs({x: -0.5, y: -0.375, z: -0.5}, 'left', getBlockByName('head').textures.left, clientGame.scene),
            clientGame.meshGen.createQuadWithUVs({x: -0.5, y: -0.375, z: -0.5}, 'front', getBlockByName('head').textures.front, clientGame.scene),
            clientGame.meshGen.createQuadWithUVs({x: -0.5, y: -0.375, z: -0.5}, 'right', getBlockByName('head').textures.right, clientGame.scene),
            clientGame.meshGen.createQuadWithUVs({x: -0.5, y: -0.375, z: -0.5}, 'back', getBlockByName('head').textures.back, clientGame.scene),
            clientGame.meshGen.createQuadWithUVs({x: -0.5, y: -0.375, z: -0.5}, 'top', getBlockByName('head').textures.top, clientGame.scene),
            clientGame.meshGen.createQuadWithUVs({x: -0.5, y: -0.375, z: -0.5}, 'bottom', getBlockByName('head').textures.bottom, clientGame.scene),
            // Arms
            clientGame.meshGen.createQuadWithUVs({x: -0.51, y: -0.745, z: 0.125}, 'left', 244, clientGame.scene),
            clientGame.meshGen.createQuadWithUVs({x: -0.49, y: -0.745, z: 0.125}, 'right', 243, clientGame.scene)
        ], true)
        if (!avatar && this.avatar) {
            // No camera is present
            this.avatar.position = new BABYLON.Vector3(0, -0.5, 0)
            this.body.scaling.x = this.body.scaling.z = 0.5
            this.body.parent = this.avatar //0.125 - 1 //0.625 //0.875
            this.head.parent = this.avatar //-0.375

            // Set mesh names
            // console.log(this.body)
            this.body.name = `body_player-${this.playerID}`
            this.head.name = `head_player-${this.playerID}`
        }
        else {
            // Camera is present, so create a item mesh in front of it
            this.createItemMesh(193)
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

        // Health vars
        this.health = 100
        this.isInvincible = false
        this.canHeal = true
        this.invincibleTime = 500 // time in ms
        this.invincibilityTimer = null
        this.inventory = makeCreativeInventory(clientGame.hud)
        this.inventory.setSelected(0)
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

        this.registerControls(this.controls)

        // Selection vars
        this.blockReach = 4
        this.selectCursor = {x: 0, y: 0, z: 0}
        this.interactSelectCursor = {x: 0, y: 0, z: 0}
        this.placeInterval
        this.removeInterval

        // Name tag mesh
        this.selectMesh = this.meshGen.createBlockWithUV({x: this.position.x, y: this.position.y, z: this.position.z}, 251, this.scene)
        this.selectMesh.material = this.scene.transparentMaterial
        this.selectMesh.isPickable = false

        this.removeMesh = this.meshGen.createBlockWithUV({x: this.position.x, y: this.position.y, z: this.position.z}, 252, this.scene)
        this.removeMesh.material = this.scene.transparentMaterial
        this.removeMesh.isPickable = false

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

        this.isGrounded = false
        this.playStepSound = () => {
            const walkingSounds = [sounds.STEP_GRASS_1, sounds.STEP_GRASS_2, sounds.STEP_GRASS_3]
            const rnd = Math.floor((Math.random() * walkingSounds.length) - 0.0001)
            walkingSounds[rnd]?.play()
        }
        setInterval( ()=>{
            if (this.isGrounded && (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight)) {
                this.playStepSound()
            }
        }, 300 )
    }

    createItemMesh(texID) {
        if (this.itemMesh) this.itemMesh.dispose()
        this.itemMesh = this.clientGame.meshGen.createQuadWithUVs({x: 0.75, y: -0.9, z: 0.5}, 'left', texID, this.clientGame.scene)
        this.itemMesh.scaling.x = this.itemMesh.scaling.y = this.itemMesh.scaling.z = 0.75
        this.itemMesh.parent = this.avatar
    }

    //ToDo: move race logic to brain
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

    takeDamage = (damage, iTime = this.invincibleTime, damageDealer = null) => { // This is not networked at the moment
        if (!this.isInvincible) {
            // Apply damage
            this.health -= damage

            // Only do this for loocal player
            if (this.playerID === this.clientGame.localPlayer.playerID) {

                // Update health readout
                // Turn on the damage indicator
                this.clientGame.hud.enableDamageMarker(this.health)

                // Make the player invincible for a short interval
                this.isInvincible = true
                this.invincibilityTimer = setTimeout( ()=>{this.isInvincible = false}, iTime )

                if (this.health > 0) {
                    // Bob player's view
                    // ToDo: make screen red or something
                    this.avatarOffset.y += 0.15
                    setTimeout( ()=>{this.avatarOffset.y -= 0.15}, iTime/6 )
                }
                else {
                    // Player is dead, respawn
                    this.health = 100
                    this.clientGame.hud.enableDamageMarker(this.health)
                    this.teleportPlayer(this.respawnPoint)

                    // ToDo: Do this on server
                    // Send message to tell the server I died
                    this.clientGame.clientComs.sendObituary(this.playerID, damageDealer)
                }
            }
            else {
                // If other player, just bob
                this.avatarOffset.y += 0.15
                setTimeout( ()=>{this.avatarOffset.y -= 0.15}, iTime/6 )
            }
        }
    }

    heal = ( amount = 1, iTime = 200 ) => {
        if (this.canHeal && this.health < 100) {
            // Apply health
            this.health += amount

            // Don't allow player to heal right away again
            this.canHeal = false
            this.healTimer = setTimeout( ()=>{this.canHeal = true}, iTime )

            // Turn on the healing indicator
            this.clientGame.hud.enableDamageMarker(this.health, true)
        }
    }

    teleportPlayer = (newPosition) => {
        this.playerVelocity = BABYLON.Vector3.Zero()
        this.position = new BABYLON.Vector3(newPosition.x, newPosition.y, newPosition.z)
    }

    interact = () => {
        // Get block & blockID at this.cursor's location
        const cSize = this.world.getChunkSize()
        const block = getArrayPos(this.interactSelectCursor, cSize)
        const blockLocation = getGlobalPos(block, cSize)
        let blockID = block? this.world.worldChunks[block.chunk.y]?.[block.chunk.x]?.[block.chunk.z]?.[block.block.y]?.[block.block.x]?.[block.block.z] : 0

        // ToDo: block interaction should be a client request sent to the brain
        // Call block's interaction function
        if (typeof blockTypes[blockID].interact === "function") blockTypes[blockID].interact(this.clientGame, blockLocation, blockID)
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
            assignFunctionToInput(c.interact, ()=>{ this.interact() }, ()=>{ })
            assignFunctionToInput(c.fire1, ()=>{ this.placeInterval = setInterval(()=>{this.useInvItem()},150); this.useInvItem() }, ()=>{ clearInterval(this.placeInterval) })
            assignFunctionToInput(c.fire2, ()=>{ this.removeInterval =  setInterval(()=>{this.removeBlock()},150); this.removeBlock() }, ()=>{ clearInterval(this.removeInterval) })
            assignFunctionToInput(c.noclip, ()=>{ this.spectateMode = !this.spectateMode }, ()=>{})
            assignFunctionToInput(c.invUp, ()=>{
                this.inventory.selectPrev()
                this.createItemMesh(this.inventory.items[this.inventory.selectedIndex].getItemImage().index)
            }, ()=>{})
            assignFunctionToInput(c.invDown, ()=>{
                this.inventory.selectNext()
                this.createItemMesh(this.inventory.items[this.inventory.selectedIndex].getItemImage().index)
            }, ()=>{})
            assignFunctionToInput(c.eyedrop, ()=>{
                const thisBlockPos = getArrayPos({x: this.interactSelectCursor.x, y: this.interactSelectCursor.y, z: this.interactSelectCursor.z}, this.clientGame?.clientWorld?.worldChunks?.[0]?.[0]?.[0]?.length || defaultChunkSize)
                const cursorBlock = this.clientGame?.clientWorld?.worldChunks?.[thisBlockPos.chunk.y]?.[thisBlockPos.chunk.x]?.[thisBlockPos.chunk.z]?.[thisBlockPos.block.y]?.[thisBlockPos.block.x]?.[thisBlockPos.block.z] || null
                if (cursorBlock) {
                    const matches = this.inventory.items.filter(item => {
                        if ( item.itemType === "block" &&
                            item.itemID === cursorBlock )
                            return true
                        else return false
                    })
                    // Only eye-drop if block is found in inventory
                    if (matches.length > 0) {
                        this.inventory.setSelected(this.inventory.items.indexOf(matches[0]))
                        this.createItemMesh(this.inventory.items[this.inventory.selectedIndex].getItemImage().index)
                    }
                }
            }, ()=>{})
        }
        else {
            console.log('No controlls to register')
        }
    }

    // Update player movement
    platformMovementUpdate = (engine) => {
        /////////////////////////////////////////////////
        // Raycast for grounded
        /////////////////////////////////////////////////
        const groundDir = new BABYLON.Vector3(0, -1, 0)
        const groundRay = new BABYLON.Ray(this.avatar.position, groundDir, 2.25) // Slightly taller than the player
        const groundPick = this.clientGame.scene.pickWithRay(groundRay, (mesh) => {
            if (mesh.name.startsWith("chunk")) return true
        }, false)
        if (groundPick?.hit) {
            // If we weren't grounded, play step sound
            if (!this.isGrounded) this.playStepSound()
            this.isGrounded = true
        }
        else this.isGrounded = false
        /////////////////////////////////////////////////

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
        let playerBox = {x: this.position.x, y: this.position.y, z: this.position.z, w: 0.5, h: this.playerHeight, d: 0.5}

        // Blocks
        let allowMoveX = true
        let allowMoveY = true
        let allowMoveZ = true
        let allowGrav = true

        const checkYCol = (block, bOnly, blockID) => {

            let bounceOnly = bOnly || false
            // Check Y
            // let playerPosCheck = {x: (this.position.x - 0.5), y: this.position.y, z: (this.position.z - 0.5), w: 0.5, h: 2, d: 0.5}
            // let playerPosCheck = {x: this.position.x, y: this.position.y, z: this.position.z, w: 0.5, h: 2, d: 0.5}
            let playerPosCheck = {x: playerBox.x, y: playerBox.y, z: playerBox.z, w: playerBox.w, h: playerBox.h, d: playerBox.d}
            playerPosCheck.y += this.playerVelocity.y
            block.y += 0
            if (boxIsIntersecting(playerPosCheck, block)) {

                // Bouncy block
                this.bounce = blockTypes[blockID]?.bounciness || this.defaultBounce

                // Check if block is colidable
                if (!blockTypes[blockID]?.categories.includes(blockCats.noncollidable) && !blockTypes[blockID]?.categories.includes(blockCats.fluid)) {
                    // Bounce
                    if (!bounceOnly) {
                        this.position.y = ((block.y + (block.h/2)) + (playerBox.h/2)) //+ 0.001 //+ this.moveSpeed
                        allowGrav = false
                    }
                    else {
                        // const playerIsBelow = (this.position.y + (playerBox.h/2)) < (block.y)
                        // if (playerIsBelow) this.position.y = ((block.y - (block.h/2)) - (playerBox.h/2)) - 0.001
                        const playerIsBelow = (this.position.y + (playerBox.h/2)) < (block.y - (block.h/2))
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
                // Heal player
                if (blockTypes[blockID]?.categories.includes(blockCats.healing)) this.heal(blockTypes[blockID].healAmount, blockTypes[blockID].healDelay)
                // Fluid
                if (blockTypes[blockID]?.categories.includes(blockCats.fluid)) { this.fluidViscosity = blockTypes[blockID].viscosity || 1; this.isInFluid = true }
            }
        }

        const checkXCol = (block, blockID) => {
            // Check X
            //let playerPosCheck = {x: (this.position.x - 0.5), y: this.position.y, z: (this.position.z - 0.5), w: 0.5, h: 2, d: 0.5}
            // let playerPosCheck = {x: this.position.x, y: this.position.y, z: this.position.z, w: 0.5, h: 2, d: 0.5}
            let playerPosCheck = {x: playerBox.x, y: playerBox.y, z: playerBox.z, w: playerBox.w, h: playerBox.h, d: playerBox.d}
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
                // Heal player
                if (blockTypes[blockID]?.categories.includes(blockCats.healing)) this.heal(blockTypes[blockID].healAmount, blockTypes[blockID].healDelay)
                // Fluid
                if (blockTypes[blockID]?.categories.includes(blockCats.fluid)) { this.fluidViscosity = blockTypes[blockID].viscosity || 1; this.isInFluid = true }
            }
        }

        const checkZCol = (block, blockID) => {
            // Check Z
            // let playerPosCheck = {x: (this.position.x - 0.5), y: this.position.y, z: (this.position.z - 0.5), w: 0.5, h: 2, d: 0.5}
            // let playerPosCheck = {x: this.position.x, y: this.position.y, z: this.position.z, w: 0.5, h: 2, d: 0.5}
            let playerPosCheck = {x: playerBox.x, y: playerBox.y, z: playerBox.z, w: playerBox.w, h: playerBox.h, d: playerBox.d}
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
                // Heal player
                if (blockTypes[blockID]?.categories.includes(blockCats.healing)) this.heal(blockTypes[blockID].healAmount, blockTypes[blockID].healDelay)
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
                const blockShape = { x: blockTypes[blockID]?.shape?.x || 0, y: blockTypes[blockID]?.shape?.y || 0, z: blockTypes[blockID]?.shape?.z || 0, w: blockTypes[blockID]?.shape?.w || 1, h: blockTypes[blockID]?.shape?.h|| 1, d: blockTypes[blockID]?.shape?.d || 1 }
                // let blockHere = {x: chunkPos.x+(worldPos.x*this.chunkSize)+0.5, y: chunkPos.y+(worldPos.y*this.chunkSize)+0.5, z: chunkPos.z+(worldPos.z*this.chunkSize)+0.5, w: blockShape.w, h: blockShape.h, d: blockShape.d} // ToDo: replace size values with "tileSize"
                let blockHere = {x: chunkPos.x+(worldPos.x*this.chunkSize)+0.5 + blockShape.x, y: chunkPos.y+(worldPos.y*this.chunkSize)+0.5 + blockShape.y, z: chunkPos.z+(worldPos.z*this.chunkSize)+0.5 + blockShape.z, w: blockShape.w, h: blockShape.h, d: blockShape.d} // ToDo: replace size values with "tileSize"

                // Check X
                let skipMid = (cy >= 0)
                if (skipMid && blockID > 0) {
                    // let blockHere = {x: chunkPos.x+(worldPos.x*this.chunkSize)+0.5, y: chunkPos.y+(worldPos.y*this.chunkSize)+0.5, z: chunkPos.z+(worldPos.z*this.chunkSize)+0.5, w: 1, h: 1, d: 1} // ToDo: replace size values with "tileSize"
                    checkXCol(blockHere, blockID)
                }

                // Check Z
                if (skipMid && blockID > 0) {
                    // let blockHere = {x: chunkPos.x+(worldPos.x*this.chunkSize)+0.5, y: chunkPos.y+(worldPos.y*this.chunkSize)+0.5, z: chunkPos.z+(worldPos.z*this.chunkSize)+0.5, w: 1, h: 1, d: 1}
                    checkZCol(blockHere, blockID)
                }

                // Check Y
                skipMid = (cy < 0 || cy > 0)
                if (skipMid && blockID > 0) {
                    // let blockHere = {x: chunkPos.x+(worldPos.x*this.chunkSize)+0.5, y: chunkPos.y+(worldPos.y*this.chunkSize)+0.5, z: chunkPos.z+(worldPos.z*this.chunkSize)+0.5, w: 1, h: 1, d: 1}
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

        /////////////////////////////////////////////////
        // Perform raycast for cursor
        /////////////////////////////////////////////////

        // Defualt cursor location if no ray collision
        const avForward = this.avatar.getDirection(new BABYLON.Vector3(0, 0, 1))
        this.selectCursor = this.interactSelectCursor = {
            x: Math.floor( this.avatar.position.x + (avForward.x * this.blockReach) ) + 0.5,
            y: Math.floor( this.avatar.position.y + (avForward.y * this.blockReach) ) + 0.5,
            z: Math.floor( this.avatar.position.z + (avForward.z * this.blockReach) ) + 0.5
        }

        // Raycast
        const direction = avForward
        const ray = new BABYLON.Ray(this.avatar.position, direction, this.blockReach)
        // const rayHelper = new BABYLON.RayHelper(ray)
        // rayHelper.show(clientGame.scene, new BABYLON.Color3(1, 0, 0))
        const pick = this.clientGame.scene.pickWithRay(ray, (mesh) => {
            if (mesh.name.startsWith("chunk")) return true
        }, false)
        if (pick?.hit) {
            const newCursorPos = pick.pickedPoint
            const normal = pick.getNormal()
            const selTolerance = 0.0125
            const tolerancePos = {
                x: newCursorPos.x + (avForward.x * selTolerance),
                y: newCursorPos.y + (avForward.y * selTolerance),
                z: newCursorPos.z + (avForward.z * selTolerance)
            }
            this.selectCursor = {
                x: Math.floor( tolerancePos.x + (normal.x * tileScale) ) + 0.5,
                y: Math.floor( tolerancePos.y + (normal.y * tileScale) ) + 0.5,
                z: Math.floor( tolerancePos.z + (normal.z * tileScale) ) + 0.5
            }
            this.interactSelectCursor = {
                x: Math.floor( tolerancePos.x ) + 0.5,
                y: Math.floor( tolerancePos.y ) + 0.5,
                z: Math.floor( tolerancePos.z ) + 0.5
            }
        }
        else {
            // Hide the selection mesh if no ray collision
            this.interactSelectCursor = {
                x: -100,
                y: -100,
                z: -100
            }
        }
        
        // Position cursor meshes
        this.selectMesh.position = new BABYLON.Vector3( this.selectCursor.x, this.selectCursor.y, this.selectCursor.z )
        this.removeMesh.position = new BABYLON.Vector3( this.interactSelectCursor.x, this.interactSelectCursor.y, this.interactSelectCursor.z )

        /////////////////////////////////////////////////
        
        // Bob camera
        // ...
    }

    useInvItem = () => {
        // Get cursor location
        const cursorLocation = { x: this.selectCursor.x, y: this.selectCursor.y, z: this.selectCursor.z }
        // Use selected item
        this.inventory.useItem(this.clientGame, this, cursorLocation, this.inventory.selectedIndex)
    }

    removeBlock = () => {
        // Get cursor location
        const changeLocation = { x: this.interactSelectCursor.x, y: this.interactSelectCursor.y, z: this.interactSelectCursor.z }
        // Remove block
        this.clientGame.updateSingleBlock(changeLocation, 0)
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