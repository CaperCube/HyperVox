import { IntersectionInfo } from "babylonjs"

// Effect object
export class Effect {
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
        this.lifetime = lifetime
        this.clientGame = clientGame

        this._lifetimer = null

        this.sceneEffect = null

        // Init in scene
        this.init()
    }

    init() {
        if (this.clientGame.scene) {
            // Add to scene
            switch (this.type) {
                case 'sprite':
                    //...
                    // Create mesh
                    // this.nameMesh = BABYLON.Mesh.CreatePlane("nameTag", 1, this.scene, false)
                    // // Create material
                    // this.nameMesh.material = new BABYLON.StandardMaterial('nameMat')
                    // this.nameMesh.useAlphaFromDiffuseTexture = true
                    // this.nameMesh.material.specularColor = new BABYLON.Color3(0, 0, 0)
                    // this.nameMesh.material.useAlphaFromDiffuseTexture = true

                    // // Bake rotation
                    // this.nameMesh.rotation.z = Math.PI
                    // this.nameMesh.rotation.y = Math.PI
                    // this.nameMesh.bakeCurrentTransformIntoVertices()

                    // // Parent mesh to player
                    // this.nameMesh.setParent(this.avatar)
                    // this.nameMesh.position = new BABYLON.Vector3(0, 1.5, 0)

                    // this.nameMesh.material.backFaceCulling = false
                    // this.nameMesh.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL
                    break
                default:
                    BABYLON.Mesh.CreatePlane("hoverText", 1, this.scene, false)
                    // this.sceneEffect = this.clientGame.meshGen //Mesh(this._effectName, this.position)
                    break
            }

            // Add reference to glientGame
            this.clientGame.effects[this.effectId] = this

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
        // delete this
    }
}