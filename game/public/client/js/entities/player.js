import { debug } from '../clientConstants.js'
import { tileScale, defaultChunkSize, teams, faceEmotes } from '../../../common/commonConstants.js'
import { getArrayPos, getGlobalPos, boxIsIntersecting } from '../../../common/positionUtils.js'
import { blockCats, blockTypes, getBlockByName } from '../../../common/blockSystem.js'
import { makeCreativeInventory, Inventory } from './player/inventory.js'
import { soundSRC, sounds } from "../resources.js"
import { updatePlayerCursor } from './player/playerCursor.js'
import { basicMovement } from './player/movement.js'

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
        //////////////////////////////////////////////////
        // Player IDs
        //////////////////////////////////////////////////
        this.playerID = playerID
        this.playerName = 'Player'
        this.playerColor = `rgb(${55+Math.random()*200},${55+Math.random()*200},${55+Math.random()*200})`

        //////////////////////////////////////////////////
        // Player stats
        //////////////////////////////////////////////////
        this.stats = {
            kills: 0,
            deaths: 0,
            score: 0,
            team: teams.none
        }

        //////////////////////////////////////////////////
        // Private vars
        //////////////////////////////////////////////////
        this.groundFric = 0.75
        this.gravity = 8.5 //-0.0085//-0.0125
        this.defaultBounce = 0.05
        this.bounce = this.defaultBounce
        this.usedJumps = 0
        this.playerVelocity = BABYLON.Vector3.Zero()
        this.moveForward, this.moveBackward, this.moveLeft, this.moveRight, this.moveUp, this.moveDown
        this.zoneBlockId = 0 // Only trigger zone interaction if this Id is different
        this.zoneBlock = null

        // Player controls
        this.controls = controls // The buttons

        //////////////////////////////////////////////////
        // Health & Inv vars
        //////////////////////////////////////////////////
        this.health = 100
        this.isInvincible = false
        this.canHeal = true
        this.invincibleTime = 500 // time in ms
        this.invincibilityTimer = null
        this.inventory = makeCreativeInventory(clientGame.hud)
        this.inventory.setSelected(0)
        console.log(this.inventory)
        // Don't allow use until next interval
        this.itemUseIsBlocked = false

        //////////////////////////////////////////////////
        // System vars
        //////////////////////////////////////////////////
        this.clientGame = clientGame
        this.meshGen = clientGame.meshGen
        this.scene = clientGame.scene
        this.world = clientGame.clientWorld
        this.chunkSize = this.world.getChunkSize() || 16
        this.worldSize = this.world.getWorldSize() || 1
        
        const worldMax = (this.worldSize * this.chunkSize * tileScale)
        this.worldDefualtSpawn = new BABYLON.Vector3(worldMax/2, worldMax, worldMax/2)

        //////////////////////////////////////////////////
        // Player vars
        //////////////////////////////////////////////////
        this.playerHeight = tileScale * 1.75
        // The object in the scene the player will be controlling
        this.avatar = avatar? avatar : new BABYLON.TransformNode("player_root")
        this.itemMesh = null
        this.muzzleFlashMesh = null
        this.muzzleFlashLight = null
        // Impact Mesh
        this.impactMesh = this.clientGame.meshGen.createQuadWithUVs({x: 0, y: 0, z: 0}, 'front', 211, this.clientGame.scene)
        this.impactMesh.scaling.x = this.impactMesh.scaling.y = this.impactMesh.scaling.z = 0.75
        this.impactMesh.setEnabled(false)
        this.impactMesh.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL

        //////////////////////////////////////////////////
        // Avatar
        //////////////////////////////////////////////////
        // console.log(clientGame.scene.playerRig, clientGame.scene.playerSkeleton)
        // this.body = avatar? null : clientGame.meshGen.createBlockWithUV({x: 0, y: -0.875, z: 0}, getBlockByName('steel-riveted').textures.front, clientGame.scene)
        // console.log(clientGame.scene.characterSystem)

        // This is the skeleton transform node (we can translate these to modify bone offsets)
        this.avatarNode = null
        // This is the actual skeleton for animating the player
        this.skeleton = null
        this.avatarMesh = null
        this.faceEmoteNode = null
        this.faceEmoteMesh = null
        this.blinkInterval = null

        this.body = null //clientGame.scene.playerMesh.clone().makeGeometryUnique()
        this.head = null
        this.arm = null
        this.hand = null
        this.handNode = null

        this.restingFace = faceEmotes.normal
        this.currentAnimation = "idle"
        this.nextAnimation = "idle"
        this.animations = {
            "idle": null,
            "run": null
        }

        if (!avatar && this.avatar) {
            // Clone player skeleton and mesh
            clientGame.scene.characterSystem.instantiateModelsToScene(name => "" + name)

            // Rename nodes so we can instantiate another one
            this.skeleton = clientGame.scene.getSkeletonByName("Char_Rig")
            this.avatarNode = clientGame.scene.getNodeByName("Char_Rig")
            this.avatarMesh = clientGame.scene.getMeshByName("Char_Model")
            this.skeleton.name = "player_skeleton"
            this.avatarNode.name = "player_rig"
            this.avatarMesh.name = "player_mesh"
            clientGame.scene.getNodeByName("__root__").name = "player_model_root"

            // Get animations
            this.animations["idle"] = clientGame.scene.getAnimationGroupByName("Idle")//clientGame.scene.animationGroups[0]
            this.animations["run"] = clientGame.scene.getAnimationGroupByName("Run")//clientGame.scene.animationGroups[1]
            this.animations["jump"] = clientGame.scene.getAnimationGroupByName("Jump")
            this.animations["idle"].name = "playerAnim_idle"
            this.animations["run"].name = "playerAnim_run"
            this.animations["jump"].name = "playerAnim_jump"
            // this.animations["idle"].isAdditive = true
            // this.animations["run"].isAdditive = true
            
            console.log(this.animations["run"])

            // Assign material
            // ToDo: Create this material in the default scene, and use that
            this.avatarMesh.material = clientGame.scene.playerMaterial

            // Orient mesh
            this.avatarMesh.makeGeometryUnique()
            this.avatarNode.parent = this.avatar
            this.avatarNode.rotation = new BABYLON.Vector3(0, -Math.PI/2, 0)
            this.avatarNode.position = new BABYLON.Vector3(0, -0.875, 0)

            // Set important references
            this.body = this.avatarMesh
            this.head = this.avatarNode.getChildren()[1].getChildren()[0].getChildren()[0]
            this.arm = this.avatarNode.getChildren()[1].getChildren()[0].getChildren()[1]
            this.hand = this.avatarNode.getChildren()[1].getChildren()[0].getChildren()[1].getChildren()[0].getChildren()[0]

            this.handNode = new BABYLON.TransformNode("hand_root")
            this.handNode.position = this.hand.position
            this.handNode.parent = this.hand

            // Face emote
            this.faceEmoteNode = new BABYLON.TransformNode("face_root")
            this.faceEmoteNode.position = new BABYLON.Vector3(-0.499, -0.5, 0.5)
            this.faceEmoteNode.rotation.y = (Math.PI/2)
            this.faceEmoteNode.parent = this.head

            // Face animation
            this.blinkInterval = setInterval(()=>{
                this.setFaceEmote(faceEmotes.blink)
                setTimeout(()=>{this.setFaceEmote(this.restingFace)}, 175)
            }, 5000)

            // Set mesh names
            this.body.name = `body_player-${this.playerID}`
            // this.head.name = `head_player-${this.playerID}`

            // Set overlay color
            this.body.overlayColor = new BABYLON.Color3.Red()
            this.body.renderOverlay = false

            // Remove empty root node and material
            // clientGame.scene.getNodeByName("__root__").dispose()
            // clientGame.scene.getMaterialByName("__GLTFLoader._default").dispose()
        }
        else {
            // Camera is present, so create a item mesh in front of it
            // this.createItemMesh(blockTypes[1], "item")
            const startItem = this.inventory.items[this.inventory.selectedIndex]
            this.createItemMesh(startItem, startItem.itemType)
            this.createMuzzleFlash(209)
        }

        //this.playerCamera = camera

        //////////////////////////////////////////////////
        // Gameplay vars
        // ToDo: a lot of these should only be stored / tracked on the brain, not on the client
        //////////////////////////////////////////////////
        this.isRacing = false
        this.raceStartTime = 0
        this.raceEndTime = 0

        //////////////////////////////////////////////////
        // Position vars
        //////////////////////////////////////////////////
        this.position = BABYLON.Vector3.Zero() // (This is the value that changes)
        this.lookDir = { x: 0, y: 0, z: 0 } // ToDo: make this also control the camera
        this.avatarOffset = { x: 0, y: 1, z: 0 } // This value offsets the player's avatar
        this.cameraOffset = { x: 0, y: 0, z: 0 } // Not yet implemented

        //////////////////////////////////////////////////
        // Respawn vars
        //////////////////////////////////////////////////
        this.respawnPoint = new BABYLON.Vector3(0,0,0)

        //////////////////////////////////////////////////
        // Respawn and cursor meshes
        //////////////////////////////////////////////////
        this.respawnMesh = null
        this.selectMesh = null
        this.removeMesh = null
        
        if (avatar) { // Don't create if no camera
            this.respawnMesh = clientGame.meshGen.createBlockWithUV(this.respawnPoint, 254, clientGame.scene)
            this.respawnMesh.scaling = new BABYLON.Vector3(0.5,0.5,0.5)
            BABYLON.Animation.CreateAndStartAnimation("spawnPointAnimation", this.respawnMesh, "rotation.y", 30, 120, 0, Math.PI, 1)

            this.selectMesh = this.meshGen.createBlockWithUV({x: this.position.x, y: this.position.y, z: this.position.z}, 251, this.scene)
            this.selectMesh.material = this.scene.transparentMaterial
            this.selectMesh.isPickable = false

            this.removeMesh = this.meshGen.createBlockWithUV({x: this.position.x, y: this.position.y, z: this.position.z}, 252, this.scene)
            this.removeMesh.material = this.scene.transparentMaterial
            this.removeMesh.isPickable = false
        }

        //////////////////////////////////////////////////
        // Movement vars
        //////////////////////////////////////////////////
        this.spectateMode = false
        this.moveSpeed = 0.018//0.025 //tileScale/40
        this.flySpeed = 0.05
        this.jumpStength = 0.15//0.2
        this.allowedJumps = 2
        this.isInFluid = false
        this.fluidViscosity = 1

        this.registerControls(this.controls)

        //////////////////////////////////////////////////
        // Selection vars
        //////////////////////////////////////////////////
        this.blockReach = 5
        this.selectCursor = {x: 0, y: 0, z: 0}
        this.interactSelectCursor = {x: 0, y: 0, z: 0}
        this.useInterval
        this.removeInterval

        //////////////////////////////////////////////////
        // Name tag mesh
        //////////////////////////////////////////////////
        this.nameMesh = null
        this.hoverTextMesh = BABYLON.Mesh.CreatePlane("hoverText", 1, this.scene, false)
        this.hoverText = ""

        ///////////////////////////////////////////////////////
        // Hover Text
        ///////////////////////////////////////////////////////
        // Create material
        this.hoverTextMesh.material = new BABYLON.StandardMaterial('nameMat')
        this.hoverTextMesh.useAlphaFromDiffuseTexture = true
        this.hoverTextMesh.material.specularColor = new BABYLON.Color3(0, 0, 0)
        this.hoverTextMesh.material.useAlphaFromDiffuseTexture = true

        // Bake rotation
        this.hoverTextMesh.rotation.z = Math.PI
        this.hoverTextMesh.rotation.y = Math.PI
        this.hoverTextMesh.bakeCurrentTransformIntoVertices()

        // Parent mesh to player
        this.hoverTextMesh.position = new BABYLON.Vector3(0, 0, 0)

        this.hoverTextMesh.material.backFaceCulling = false
        this.hoverTextMesh.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL
        this.hoverTextMesh.renderingGroupId = 1

        // Set texture
        this.setHoverText("")

        ///////////////////////////////////////////////////////
        // Name Tag
        ///////////////////////////////////////////////////////

        // ToDo: Refactor this / move this to another location (world text should not be a Player function)
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

        ///////////////////////////////////////////////////////
        // Walking sound
        ///////////////////////////////////////////////////////

        this.isGrounded = false
        this.playStepSound = () => {
            const walkingSounds = [sounds.STEP_GRASS_1, sounds.STEP_GRASS_2, sounds.STEP_GRASS_3]
            const rnd = Math.floor((Math.random() * walkingSounds.length) - 0.0001)
            walkingSounds[rnd]?.play()
        }
        this.walkingSoundsInterval = setInterval( ()=>{
            if (this.isGrounded && (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight)) {
                this.playStepSound()
            }
        }, 300 )
    }

    ///////////////////////////////////////////////////////
    // Held Item Mesh
    ///////////////////////////////////////////////////////

    createItemMesh(item, itemType = "item", isMyPlayer = true) {
        if (this.itemMesh) this.itemMesh.dispose()
        const img = item.getItemImage()
        switch (itemType) {
            case "block":
                if (isMyPlayer) {
                    let cubeFaces = []
                    const posBlock = {x: 1, y: -1.5, z: 1.75}
                    cubeFaces.push( this.clientGame.meshGen.createQuadWithUVs(posBlock, "left", img.textures.left, this.clientGame.scene) )
                    cubeFaces.push( this.clientGame.meshGen.createQuadWithUVs(posBlock, "top", img.textures.top, this.clientGame.scene) )
                    cubeFaces.push( this.clientGame.meshGen.createQuadWithUVs(posBlock, "back", img.textures.back, this.clientGame.scene) )
                    this.itemMesh = BABYLON.Mesh.MergeMeshes(cubeFaces, true)
                    
                    this.itemMesh.scaling.x = this.itemMesh.scaling.y = this.itemMesh.scaling.z = 0.25
                }
                else {
                    let cubeFaces = []
                    const posBlock = {x: 0, y: 0, z: 0} // const posBlock = {x: 0.5, y: -1.5, z: -1.75}
                    cubeFaces.push( this.clientGame.meshGen.createQuadWithUVs(posBlock, "left", img.textures.left, this.clientGame.scene) )
                    cubeFaces.push( this.clientGame.meshGen.createQuadWithUVs(posBlock, "right", img.textures.right, this.clientGame.scene) )
                    cubeFaces.push( this.clientGame.meshGen.createQuadWithUVs(posBlock, "top", img.textures.top, this.clientGame.scene) )
                    cubeFaces.push( this.clientGame.meshGen.createQuadWithUVs(posBlock, "bottom", img.textures.bottom, this.clientGame.scene) )
                    cubeFaces.push( this.clientGame.meshGen.createQuadWithUVs(posBlock, "back", img.textures.back, this.clientGame.scene) )
                    cubeFaces.push( this.clientGame.meshGen.createQuadWithUVs(posBlock, "front", img.textures.front, this.clientGame.scene) )
                    this.itemMesh = BABYLON.Mesh.MergeMeshes(cubeFaces, true)
                    
                    this.itemMesh.scaling.x = this.itemMesh.scaling.y = this.itemMesh.scaling.z = 0.5

                    // Rotate if not my player
                    this.itemMesh.rotation.x = -(Math.PI/2)
                    this.itemMesh.position = new BABYLON.Vector3(0,-0.125,0.25)
                }
                // this.itemMesh.setScale(new BABYLON.Vector3(0.25, 0.25, 0.25))
                break
            default:
                const texID = img.index
                const posItem = {x: 0.75, y: -0.9, z: 0.5}//{x: 0.25, y: -0.75, z: -0.125}
                this.itemMesh = this.clientGame.meshGen.createQuadWithUVs(posItem, "left", texID, this.clientGame.scene)
                this.itemMesh.scaling.x = this.itemMesh.scaling.y = this.itemMesh.scaling.z = 0.75//0.25

                // Rotate if not my player
                if (!isMyPlayer) {
                    this.itemMesh.rotation.z = (-Math.PI/2)
                    this.itemMesh.position = new BABYLON.Vector3(0,0.125,-0.25)
                }
                break
        }
        // Disable raycasting for this mesh
        this.itemMesh.isPickable = false
        // Render above other items
        this.itemMesh.renderingGroupId = isMyPlayer? 1 : 0
        this.itemMesh.parent = isMyPlayer? this.avatar : this.handNode
    }

    createMuzzleFlash(texID) {
        // Mesh
        if (this.muzzleFlashMesh) this.muzzleFlashMesh.dispose()
        this.muzzleFlashMesh = this.clientGame.meshGen.createQuadWithUVs({x: 0.751, y: -0.875, z: 1.225}, 'left', texID, this.clientGame.scene)
        this.muzzleFlashMesh.scaling.x = this.muzzleFlashMesh.scaling.y = this.muzzleFlashMesh.scaling.z = 0.75
        this.muzzleFlashMesh.parent = this.avatar
        this.muzzleFlashMesh.setEnabled(false)

        // Disable raycasting for this mesh
        this.muzzleFlashMesh.isPickable = false
        // Render above other items
        this.muzzleFlashMesh.renderingGroupId = 1

        // Light
        if (this.muzzleFlashLight) this.muzzleFlashLight.dispose()
        this.muzzleFlashLight = new BABYLON.PointLight("gunPointLight", new BABYLON.Vector3(0.6, -0.5, 1.4), this.clientGame.scene)
        this.muzzleFlashLight.parent = this.avatar
        this.muzzleFlashLight.intensity = 1
        this.muzzleFlashLight.range = 10
        this.muzzleFlashLight.setEnabled(false)
    }

    ///////////////////////////////////////////////////////
    // Face animations
    ///////////////////////////////////////////////////////

    setFaceEmote(frame) {
        if (this.head && this.faceEmoteNode) {
            // Remove the old mesh
            if (this.faceEmoteMesh) this.faceEmoteMesh.dispose()

            // Create mesh
            const meshIndex = frame || this.restingFace
            this.faceEmoteMesh = this.clientGame.meshGen.createQuadWithUVs(this.head.position, "front", meshIndex, this.clientGame.scene, {rows: 4, cols: 4})
            this.faceEmoteMesh.material = this.clientGame.scene.playerMaterial
            this.faceEmoteMesh.parent = this.faceEmoteNode
            this.faceEmoteMesh.isPickable = false

            // Set overlay color
            this.faceEmoteMesh.overlayColor = new BABYLON.Color3.Red()
            this.faceEmoteMesh.renderOverlay = false
        }
    }

    ///////////////////////////////////////////////////////
    // Player functions (ToDo: move some of these)
    ///////////////////////////////////////////////////////

    useInvItem = () => {

        // Function to use item
        const doUse = () => {
            // Block item use for an interval
            this.itemUseIsBlocked = true
            setTimeout(()=>{ this.itemUseIsBlocked = false }, this.inventory?.items?.[this.inventory.selectedIndex]?.useTime || 150)
            // Get cursor location
            const cursorLocation = { x: this.selectCursor.x, y: this.selectCursor.y, z: this.selectCursor.z }
            // Use selected item
            this.inventory.useItem(this.clientGame, this, cursorLocation, this.inventory.selectedIndex)
        }

        // Do first use
        if (!this.itemUseIsBlocked) doUse()

        // Set the interval for auto items
        if (this.inventory?.items?.[this.inventory.selectedIndex].useAuto)
        {
            this.useInterval = setInterval( ()=>{ doUse() }, this.inventory?.items?.[this.inventory.selectedIndex]?.useTime || 150 )
        }
    }

    removeBlock = () => {
        // Get cursor location
        const changeLocation = { x: this.interactSelectCursor.x, y: this.interactSelectCursor.y, z: this.interactSelectCursor.z }
        // Remove block
        this.clientGame.updateSingleBlock(changeLocation, 0)
    }

    //ToDo: move race logic to brain
    startRace = () => {
        if (!this.isRacing){
            this.isRacing = true
            this.clientGame.clientComs.genericToBrain( 'startRace', {} )
        }
    }

    endRace = () => {
        if (this.isRacing) {
            this.isRacing = false
            this.clientGame.clientComs.genericToBrain( 'endRace', {} )
        }
    }

    // ToDo: Do Damage / Healing on brain, and refactor this to just be the animations
    takeDamage = (damage, iTime = this.invincibleTime, damageDealer = null) => {
        if (!this.isInvincible) {
            // Apply damage
            this.health -= damage

            // Only do this for local player
            if (this.playerID === this.clientGame.localPlayer.playerID) {

                // Update health readout
                // Turn on the damage indicator
                this.clientGame.hud.enableDamageMarker(this.health)

                // Make the player invincible for a short interval
                this.isInvincible = true
                this.invincibilityTimer = setTimeout( ()=>{this.isInvincible = false}, iTime )

                if (this.health > 0) {
                    // Bob player's view
                    this.avatarOffset.y += 0.15
                    setTimeout( ()=>{ this.avatarOffset.y -= 0.15 }, iTime/6 )
                }
                else {
                    // Player is dead, respawn
                    // this.health = 100
                    // this.clientGame.hud.enableDamageMarker(this.health)
                    // this.teleportPlayer(this.respawnPoint)

                    // ToDo: Do this on server
                    // Send message to tell the server I died
                    this.clientGame.clientComs.sendObituary(this.playerID, damageDealer)
                }
            }
            else {
                // If other player, just bob
                this.avatarOffset.y += 0.15
                if (this.body) this.body.renderOverlay = true
                if (this.faceEmoteMesh) this.faceEmoteMesh.renderOverlay = true
                setTimeout( ()=>{
                    this.avatarOffset.y -= 0.15
                    if (this.body) this.body.renderOverlay = false
                    if (this.faceEmoteMesh) this.faceEmoteMesh.renderOverlay = false
                }, iTime/6 )

                // Set pain face
                this.setFaceEmote(faceEmotes.pain)
                setTimeout(()=>{this.setFaceEmote(this.restingFace)}, iTime)
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

    // ToDo: This should be on brain
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

        // Call block's interaction function
        if (typeof blockTypes[blockID]?.interact === "function") blockTypes[blockID].interact(this.clientGame, blockLocation, blockID)
    }

    zoneInteract = (blockID, blockLocation) => {
        // Only trigger if zoneBlockId is different
        if (this.zoneBlockId !== blockID) {
            this.zoneBlockId = blockID
            
            if (typeof blockTypes[blockID]?.interact === "function") {
                blockTypes[blockID].interact(this.clientGame, blockLocation, blockID)
            }
        }
    }

    // ToDo: this is mostly redundant, merge this code with "setPlayerName"
    setHoverText = (newText = "", pos = { x:0, y:0, z:0 }) => {
        // Set the current text
        this.hoverText = newText

        // If blank, turn off
        if (!newText) {
            this.hoverTextMesh.setEnabled(false)
        }
        else {
            // Turn text on
            this.hoverTextMesh.setEnabled(true)

            // Only do this for me!!
            if (this.playerID === this.clientGame.clientID) {
                // Draw new texture from menu system bakeText()
                if (this.clientGame.menu.fonts[0])
                    this.clientGame.menu.bakeText(newText, this.clientGame.menu.fonts[0], (img) => { 
                        const textTexture = new BABYLON.Texture(img.src, this.scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE)

                        this.hoverTextMesh.material.diffuseTexture = textTexture
                        this.hoverTextMesh.material.emissiveTexture = textTexture

                        this.hoverTextMesh.material.diffuseTexture.hasAlpha = true

                        // Rescale mesh and texture
                        this.hoverTextMesh.scaling.y = 0.25
                        this.hoverTextMesh.scaling.x = (img.width / img.height) / 4
                })
            }

            // Set position
            this.hoverTextMesh.position = new BABYLON.Vector3(pos.x, pos.y + 1, pos.z)
        }
    }

    // ToDo: rename this to be more clear this is just for the nametag
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

    // ToDo: This should be stored per-player on the brain
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
    
    ///////////////////////////////////////////////////////
    // Register controls with actions
    ///////////////////////////////////////////////////////

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
            assignFunctionToInput(c.fire1, ()=>{ this.useInvItem() }, ()=>{ clearInterval(this.useInterval) })
            assignFunctionToInput(c.fire2, ()=>{ this.removeInterval =  setInterval(()=>{this.removeBlock()}, 150); this.removeBlock() }, ()=>{ clearInterval(this.removeInterval) })
            assignFunctionToInput(c.noclip, ()=>{ this.spectateMode = !this.spectateMode }, ()=>{})
            assignFunctionToInput(c.invUp, ()=>{
                this.inventory.selectPrev()
                this.createItemMesh(this.inventory.items[this.inventory.selectedIndex], this.inventory.items[this.inventory.selectedIndex].itemType)
                clearInterval(this.useInterval) // Makes sure we can't glitch the fire-rate
            }, ()=>{})
            assignFunctionToInput(c.invDown, ()=>{
                this.inventory.selectNext()
                this.createItemMesh(this.inventory.items[this.inventory.selectedIndex], this.inventory.items[this.inventory.selectedIndex].itemType)
                clearInterval(this.useInterval) // Makes sure we can't glitch the fire-rate
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
                        this.createItemMesh(this.inventory.items[this.inventory.selectedIndex], this.inventory.items[this.inventory.selectedIndex].itemType)
                    }
                }
                clearInterval(this.useInterval) // Makes sure we can't glitch the fire-rate
            }, ()=>{})
        }
        else {
            console.log('No controlls to register')
        }
    }

    ///////////////////////////////////////////////////////
    // Player movement (ToDo: Make this it's own file so we can support different movement types)
    ///////////////////////////////////////////////////////

    movementUpdate = (engine) => {
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
        
        /////////////////////////////////////////////////
        // Movement
        /////////////////////////////////////////////////

        basicMovement(engine, this, movementVector)

        /////////////////////////////////////////////////
        // Set animation (this only happens on the local player, we then tell the brain which will update the other players)
        /////////////////////////////////////////////////
        if (this.usedJumps > 0) this.nextAnimation = "jump"
        else if (movementVector.length() > 0) this.nextAnimation = "run"
        else this.nextAnimation = "idle"

        /////////////////////////////////////////////////
        // Apply positions
        /////////////////////////////////////////////////

        this.updatePosition()

        /////////////////////////////////////////////////
        // Update cursor
        /////////////////////////////////////////////////

        if (this.selectMesh) updatePlayerCursor(this)
        
        /////////////////////////////////////////////////
        // Bob camera
        /////////////////////////////////////////////////
        // ...
    }

    ///////////////////////////////////////////////////////
    // Player Pos update (called inside movement loops)
    ///////////////////////////////////////////////////////

    updatePosition() {
        // Animate
        if (this.nextAnimation !== this.currentAnimation) {
            // Set animation
            this.currentAnimation = this.nextAnimation

            // Stop all animations
            const allKeys = Object.keys(this.animations)
            for (let i = 0; i < allKeys.length; i++) {
                if (this.animations[allKeys[i]]) this.animations[allKeys[i]].stop()
            }

            // Start new animation
            if (this.animations[this.currentAnimation]) this.animations[this.currentAnimation].play(true)
        }

        // Set position
        this.avatar.position = new BABYLON.Vector3( this.position.x + this.avatarOffset.x, this.position.y + this.avatarOffset.y, this.position.z + this.avatarOffset.z )
        
        // Update body rotation
        if (this.avatarNode && this.head && this.arm) {
            // Get angle snap
            const angleSnap = (Math.PI/4) //(Math.PI/2)
            const roundedAngle = Math.round(this.lookDir.y / angleSnap) * angleSnap

            // Rotate Rig
            this.avatarNode.rotation.y = roundedAngle - (Math.PI/2) // Offset rotation by 90*

            // Rotate Head
            this.head.rotation = new BABYLON.Vector3(this.lookDir.z, this.lookDir.y - roundedAngle, -this.lookDir.x)
            
            // Rotate Arm
            this.arm.rotation = BABYLON.Vector3.Zero()
            this.arm.rotate(BABYLON.Axis.Z, -(this.lookDir.x) + (Math.PI/2), BABYLON.Space.LOCAL)
            this.arm.rotate(BABYLON.Axis.X, (this.lookDir.y - roundedAngle) + (Math.PI), BABYLON.Space.LOCAL)
            this.arm.rotate(BABYLON.Axis.Y, -(Math.PI/2), BABYLON.Space.LOCAL)
        }
    }

    ///////////////////////////////////////////////////////
    // Cleanup (for resetting / removing players)
    ///////////////////////////////////////////////////////

    clearIntervals() {
        if (this.walkingSoundsInterval) clearInterval(this.walkingSoundsInterval)
        if (this.blinkInterval) clearInterval(this.blinkInterval)
    }
}

export default ClientPlayer