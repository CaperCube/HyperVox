import { getBlockByName } from '../../../common/blockSystem.js'

// This class is in charge of the models rendered for players and their animations
class PlayerAvatar {
    constructor(clientGame) {
        // Graphics
        this.root = new BABYLON.TransformNode("root")
        this.body = clientGame.meshGen.createBlockWithUV({x: 0, y: -0.875, z: 0}, getBlockByName('steel-riveted').textures.front, clientGame.scene)
        this.head = BABYLON.Mesh.MergeMeshes([
            clientGame.meshGen.createQuadWithUVs({x: -0.5, y: -0.375, z: -0.5}, 'left', getBlockByName('head').textures.left, clientGame.scene),
            clientGame.meshGen.createQuadWithUVs({x: -0.5, y: -0.375, z: -0.5}, 'front', getBlockByName('head').textures.front, clientGame.scene),
            clientGame.meshGen.createQuadWithUVs({x: -0.5, y: -0.375, z: -0.5}, 'right', getBlockByName('head').textures.right, clientGame.scene),
            clientGame.meshGen.createQuadWithUVs({x: -0.5, y: -0.375, z: -0.5}, 'back', getBlockByName('head').textures.back, clientGame.scene),
            clientGame.meshGen.createQuadWithUVs({x: -0.5, y: -0.375, z: -0.5}, 'top', getBlockByName('head').textures.top, clientGame.scene),
            clientGame.meshGen.createQuadWithUVs({x: -0.5, y: -0.375, z: -0.5}, 'bottom', getBlockByName('head').textures.bottom, clientGame.scene),
            clientGame.meshGen.createQuadWithUVs({x: -0.51, y: -0.745, z: 0.125}, 'left', 244, clientGame.scene),
            clientGame.meshGen.createQuadWithUVs({x: -0.49, y: -0.745, z: 0.125}, 'right', 243, clientGame.scene)
        ], true)
        if (this.root) {
            this.root.position = new BABYLON.Vector3(0, -0.5, 0)
            this.body.scaling.x = this.body.scaling.z = 0.5
            this.body.parent = this.root
            this.head.parent = this.root
        }
    }
}

export default PlayerAvatar