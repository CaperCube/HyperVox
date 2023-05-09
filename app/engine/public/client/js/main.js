import { Engine, Scene } from "babylonjs";
const $ = (query) => document.querySelector(query);
const $$ = (query) => document.querySelectorAll(query);
const gameCanvas = $('#main-canvas');
const engine = new Engine(gameCanvas, true);
function createScene() {
    const scene = new Scene(engine);
    // new shit here
    //...
    return scene;
}
const scene = createScene();
engine.runRenderLoop(() => {
    scene.render();
});
//# sourceMappingURL=main.js.map