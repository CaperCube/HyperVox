// Effect object
class Effect {
    constructor({
        id,
        position = { x:0, y:0, z:0 },
        lifetime = 500, // Time before destroy (in ms)
        type = 'sprite', // ToDo: move this to a constants file (const effectTypes...)
        clientGame
        }) {
        // Props
        this.effectId = id || Math.random()
        this._effectName = `effect_${this.effectId}`
        this._type = type

        this.position = position
        this.offset = { x:0, y:0, z:0 }
        this._size = 2
        this.lifetime = lifetime
        this.clientGame = clientGame

        this.myFrames = 0
        this._lifetimer = null

        this.sceneEffect = null

        // Init in scene
        this.init()
    }

    init() {
        if (this.clientGame.scene) {
            // Add to scene
            switch (this._type) {
                case 'sprite':
                    // Create mesh
                    const texId = 177
                    this.sceneEffect = this.clientGame.meshGen.createQuadWithUVs({x: -0.5, y: -0.5, z: -0.5}, 'front', texId, this.clientGame.scene),
                    this.sceneEffect.bakeCurrentTransformIntoVertices()
                    this.sceneEffect.scaling = new BABYLON.Vector3(this._size, this._size, this._size)
                    // this.sceneEffect = BABYLON.Mesh.CreatePlane(this._effectName, this._size, this.clientGame.scene, false)

                    // Create material // ToDo: move to Material setup
                    // this.sceneEffect.material = new BABYLON.StandardMaterial(`${this._effectName}_mat`)
                    // this.sceneEffect.material.specularColor = new BABYLON.Color3(0, 0, 0)

                    // this.sceneEffect.useAlphaFromDiffuseTexture = true
                    // this.sceneEffect.material.useAlphaFromDiffuseTexture = true

                    // Bake rotation
                    // this.sceneEffect.rotation.z = -Math.PI
                    // this.sceneEffect.rotation.y = -Math.PI
                    // this.sceneEffect.bakeCurrentTransformIntoVertices()

                    // Billboard Mode
                    // this.sceneEffect.material.backFaceCulling = false
                    this.sceneEffect.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL
                    this.sceneEffect.renderingGroupId = 1 // Set to render on top
                    break
                case 'muzzleflash':
                    this.sceneEffect = this.clientGame.meshGen.createQuadWithUVs({x: -0.5, y: -0.5, z: -0.5}, 'front', 211, this.clientGame.scene)
                    this.sceneEffect.bakeCurrentTransformIntoVertices()
                    this.sceneEffect.scaling = new BABYLON.Vector3(this._size, this._size, this._size)
                    this.sceneEffect.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL
                    break
                default:
                    // BABYLON.Mesh.CreatePlane(this._effectName, 1, this.clientGame.scene, false)
                    // this.sceneEffect = this.clientGame.meshGen //Mesh(this._effectName, this.position)
                    break
            }

            // Set position
            console.log(this._type)
            this.sceneEffect.position = new BABYLON.Vector3(this.position.x, this.position.y, this.position.z)

            // Add reference to glientGame
            this.clientGame.effects.push(this)

            // Play sound?
            //...

            // Set destroy timer
            this._lifetimer = setTimeout(()=>{ this.destroy() }, this.lifetime)
        }
    }

    destroy() {
        // Remove effect from scene
        if (this.sceneEffect) this.sceneEffect.dispose()

        // Remove from clientGame.effects
        delete this.clientGame.effects[this.effectId]

        // Delete self (is this needed if we're deleting from the clientGame.effects object?)
        delete this
    }

    update() {
        if (this.sceneEffect) {
            // Animate if applicable
            this.myFrames++

            // Update position
            this.sceneEffect.position = new BABYLON.Vector3(this.position.x + this.offset.x, this.position.y + this.offset.y, this.position.z + this.offset.z)
        }
    }
}

export default Effect