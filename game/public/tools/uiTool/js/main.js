import MenuSystem from "../../../client/js/menuSystem.js"

// Canvas vars
const menu = new MenuSystem($("#main-canvas"))
menu.loadFonts(`../../../client/src/textures/fonts/`, ()=>{menu.show()})

// const canvas = $('#main-canvas')
// const ctx = canvas.getContext('2d')
// canvas.width = canvas.height = 512
const textureSheet = new Image(512,512)
textureSheet.src = '../../../client/src/textures/ui_parts.png'

// Menu
let pattern = [[]]


////////////////////////////////////////////////////////
// DOM functions
////////////////////////////////////////////////////////
//...

////////////////////////////////////////////////////////
// Classes
////////////////////////////////////////////////////////

class Animation {
    constructor() {
        this.name = "element"
        this.state = "idle"
    }
}

// ToDo: move this class to "./client/"
class UIElement {
    constructor() {
        this.frame = 0
        this.state = 'idle' // 'none' or null will not animate
        this.animations = {
            idle: {}
        }
    }

    bakeAnimations() {
        // render animations and store frames as single images (this reduces the number of draw calls)
        // Store images in `this.animations[this.state].bakedFrames`
    }
}