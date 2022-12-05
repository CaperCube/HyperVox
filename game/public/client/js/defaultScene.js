import './dist/babylon.js'
import { imageSRC } from './resources.js'

// Material for most blocks
let mat, mat2, texture
let skybox, stars, stars2
let light

const DefaultScene = (engine) => {
    // Create new scene
    const scene = new BABYLON.Scene(engine)
    scene.clearColor = new BABYLON.Color3.Black()

    ////////////////////////////////////////////////////
    // Materials
    ////////////////////////////////////////////////////

    // Create block materials
    mat = new BABYLON.StandardMaterial('mat')
    texture = new BABYLON.Texture(imageSRC.Tiles, scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE)
    mat.diffuseTexture = texture
    mat.specularColor = new BABYLON.Color3(0, 0, 0)
    scene.defaultMaterial = mat
    
    mat2 = new BABYLON.StandardMaterial('mat')
    mat2.diffuseTexture = texture
    mat2.emissiveTexture = texture
    mat2.specularColor = new BABYLON.Color3(0, 0, 0)
    mat2.diffuseTexture.hasAlpha = true
    mat2.useAlphaFromDiffuseTexture = true
    mat2.alpha = 0.5
    scene.transparentMaterial = mat2
    mat2.zOffset = -1 // Gives this material depth prioraty

    // This is an attempt to include blocks that have alpha
    // const comboMaterial = new BABYLON.MultiMaterial("multiMat", scene)
    // comboMaterial.subMaterials.push(mat)
    // comboMaterial.subMaterials.push(mat2)
    // scene.combinedMaterial = comboMaterial

    ////////////////////////////////////////////////////
    // Skybox
    ////////////////////////////////////////////////////
    
    skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene)
    skybox.infiniteDistance = true
    skybox.ignoreCameraMaxZ = true
    skybox.renderingGroupId = 0

    let skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMat", scene)
    skyboxMaterial.backFaceCulling = false
    // suffixes for sides: +x, +y, +z, -x, -y, -z
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(imageSRC.Skybox1, scene, [`right.png`, `bottom.png`, `back.png`, `left.png`, `top.png`, `front.png`], false)
    skyboxMaterial.reflectionTexture.onLoadObservable.add(() => {
        skyboxMaterial.reflectionTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE)
    })
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0)
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0)

    skybox.material = skyboxMaterial
    skybox.applyFog = false

    // Stars
    stars = BABYLON.MeshBuilder.CreateSphere("stars", { diameter: 200.0 }, scene)
    stars.infiniteDistance = true
    stars.ignoreCameraMaxZ = true
    stars.renderingGroupId = 0

    stars.scaling = new BABYLON.Vector3 (1, 5, 1)
    stars.rotation.z = Math.PI/2

    let starMaterial = new BABYLON.StandardMaterial("starsMat", scene)
    starMaterial.backFaceCulling = false
    starMaterial.diffuseTexture = new BABYLON.Texture(imageSRC.Stars, scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE)
    starMaterial.specularColor = new BABYLON.Color3(0, 0, 0)
    starMaterial.diffuseTexture.hasAlpha = true
    starMaterial.useAlphaFromDiffuseTexture = true
    starMaterial.alpha = 0.75

    BABYLON.Animation.CreateAndStartAnimation("u", starMaterial.diffuseTexture, "vOffset", 30, 240, 0, 1, 1)
    BABYLON.Animation.CreateAndStartAnimation("u", starMaterial.diffuseTexture, "uOffset", 30, 800, 0, 1, 1)
    stars.material = starMaterial
    stars.applyFog = false

    // Stars 2
    stars2 = BABYLON.MeshBuilder.CreateSphere("stars", { diameter: 400.0 }, scene)
    stars2.infiniteDistance = true
    stars2.ignoreCameraMaxZ = true
    stars2.renderingGroupId = 0

    stars2.scaling = new BABYLON.Vector3 (1, 1, 1)
    stars2.rotation.z = Math.PI/2

    let starMaterial2 = new BABYLON.StandardMaterial("starsMat", scene)
    starMaterial2.backFaceCulling = false
    starMaterial2.diffuseTexture = new BABYLON.Texture(imageSRC.Stars, scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE)
    starMaterial2.specularColor = new BABYLON.Color3(0, 0, 0)
    starMaterial2.diffuseTexture.hasAlpha = true
    starMaterial2.useAlphaFromDiffuseTexture = true
    starMaterial2.alpha = 0.25
    BABYLON.Animation.CreateAndStartAnimation("u", starMaterial2.diffuseTexture, "vOffset", 30, 800, 0, 1, 1)
    BABYLON.Animation.CreateAndStartAnimation("u", starMaterial2.diffuseTexture, "uOffset", 30, 4000, 0, 1, 1)
    stars2.material = starMaterial2
    stars2.applyFog = false

    ////////////////////////////////////////////////////
    // Lighting and fog
    ////////////////////////////////////////////////////

    // Create light in scene
    light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0))
    // light.intensity = 1
    light.diffuse = new BABYLON.Color3(203/255, 219/255, 252/255) // Light Blue
    light.groundColor = new BABYLON.Color3(69/255, 40/255, 60/255) // Dark Purple
    // light.groundColor = new BABYLON.Color3(0/255, 6/255, 34/255) // Dark Blue
    // light.groundColor = new BABYLON.Color3(25/255, 9/255, 19/255) // Dark Blue

    // Fog
    scene.fogDensity = 0.02
    scene.fogStart = 8//fogDist/2
    scene.fogEnd = 128
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP//BABYLON.Scene.FOGMODE_LINEAR
    scene.fogColor = new BABYLON.Color3(0, 0, 0)

    ////////////////////////////////////////////////////
    // Load models
    // ToDo: Put this in a seperate file in charge of setting up default assets (models, materials, sounds, etc.)
    ////////////////////////////////////////////////////
    // Player Mat
    scene.playerMaterial = new BABYLON.StandardMaterial('mat')
    scene.playerMaterial.diffuseTexture = new BABYLON.Texture(imageSRC.Character, scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE)
    scene.playerMaterial.specularColor = new BABYLON.Color3(0, 0, 0)

    console.log("Loading models...")
    // BABYLON.SceneLoader.Append("./client/src/", "CC_Char1_v1_rigged.gltf", scene, (importedScene) => {
    BABYLON.SceneLoader.LoadAssetContainer("./client/src/models/char/", "CC_Char1_v1_rigged.gltf", scene, (container) => {
        scene.characterSystem = container
        // container.addAllToScene()
    })

    ////////////////////////////////////////////////////
    // Return scene
    ////////////////////////////////////////////////////

    // Return the scene to the renderer
    return scene
}

export default DefaultScene