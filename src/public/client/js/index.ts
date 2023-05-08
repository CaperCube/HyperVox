import BABYLON, { Engine, Scene } from "babylonjs"

const $ = (query) => document.querySelector(query)
const $$ = (query) => document.querySelectorAll(query)

const gameCanvas: HTMLCanvasElement = $('#main-canvas')

const engine: Engine = new Engine(gameCanvas, true)

function createScene(): Scene {
    const scene: Scene = new Scene(engine)

    // new shit here
    //...

    return scene
}

const newScene: Scene = createScene()

engine.runRenderLoop(()=>{
    newScene.render()
})
