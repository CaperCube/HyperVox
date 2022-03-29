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

let resolution = 32
let pixelSize = menu.canvas.width/resolution
let pattern = [[]]


////////////////////////////////////////////////////////
// DOM functions
////////////////////////////////////////////////////////
//...

////////////////////////////////////////////////////////
// Drawing
////////////////////////////////////////////////////////

function drawTileHere(x, y, size, id) {
    // Calculate ID offset
    const rows = 16
    const columns = 16
    let c = (id-1) % columns
    let r = Math.floor((id-1) / columns)
    // Draw
    ctx.drawImage(textureSheet, c*32, r*32, 32, 32, x*size, y*size, size, size)
}

function animate() {
    // Draw all tiles
}

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
        this.state = 'idle'
        this.animations = {
            idle: {}
        }
    }

    bakeAnimations() {
        // render animations and store frames as single images (this reduces the number of draw calls)
        // Store images in `this.animations[this.state].bakedFrames`
    }
}