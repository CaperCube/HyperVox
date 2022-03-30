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
$('#DOM_reset').onclick = () => { menu.show() }