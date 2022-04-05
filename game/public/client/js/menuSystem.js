import { imageSRC, fontJSON } from "./resources.js"

// Mouse collision
function checkMenuCollide(element, mousePos, screenScale) {
    let r1W = 0
    let r1H = element.tiles.length * menuConstants.tileSize
    for (let i = 0; i < element.tiles.length; i++) {
        const tilesWidth = element.tiles[i].length * menuConstants.tileSize
        if (tilesWidth > r1W) r1W = tilesWidth
    }
    const rect1 = {
        x: element.position.x * screenScale,
        y: element.position.y * screenScale,
        w: r1W * screenScale,
        h: r1H * screenScale
    }

    const rect2 = {
        x: mousePos.x,
        y: mousePos.y,
        w: 1,
        h: 1
    }
    if (rect1.x < rect2.x + rect2.w &&
        rect1.x + rect1.w > rect2.x &&
        rect1.y < rect2.y + rect2.h &&
        rect1.h + rect1.y > rect2.y) {
        // collision detected!
        return true
    }
    else return false
}

// Constants
const menuConstants = {
    hidden: 'none',
    shown: 'inline-block',
    tileSize: 32,
    states: {
        none: 'none',       // Not animating & not visible
        still: 'still',     // Not animating (is this needed?)
        animIn: 'in',       // Animating into visibility
        animOut: 'out',     // Animating out of visibility
        idle: 'idle',       // Looping idle
        hover: 'hover',     // Cursor hover
        down: 'down'        // Cursor being pressed
    }
}

// ToDo: move this class to "./menu/UIAnimation.js"
class UIAnimation {
    constructor() {
        this.name = "animation_1"
        this.frames = [
            {
                position: {x: 0, y: 0}, // relative to UIElement's position
                tiles: [[]]
            }
        ]
    }
}

// ToDo: move this class to "./menu/UIElement.js"
class UIElement {
    constructor({position = {x: 0, y: 0}, tiles = [[]], text = ''}) {
        this.position = position
        this.tiles = tiles
        this.text = text
        this.textOffset = { x: 19, y: 24 }

        //this.pressButton = () => { console.log(`clicked ${this.text}`) }
        this.pressButton = () => { }

        this.frame = 0
        this.state = menuConstants.states.idle
        this.animations = {
            [menuConstants.states.idle]: {},
            [menuConstants.states.hover]: {}
        }
    }

    bakeAnimations() {
        // render animations and store frames as single images (this reduces the number of draw calls)
        // Store images in `this.animations[this.state].bakedFrames`
    }
}

// ToDo: move this class to "./menu/UIScene.js"
class UIScene {
    constructor(elements = []) {
        this.elements = elements
    }
}

class MenuSystem {
    constructor(canvas) {
        // Canvas vars
        this.resScale = 2
        this.canvas = canvas
        this.ctx = this.canvas.getContext("2d")
        this.cWidth = this.canvas.width = this.canvas.parentElement.clientWidth / this.resScale
        this.cHeight = this.canvas.height = this.canvas.parentElement.clientHeight / this.resScale
        
        this.canvas.style.width = '100%'
        this.canvas.style.height = '100%'

        this.canvas.style.display = menuConstants.shown

        // Render vars
        this._visible = false

        // Resize listener

        // Event Listeners
        this.canvas.addEventListener('mousedown', (event) => {
            // this.hide()
            const rect = canvas.getBoundingClientRect()
            const mousePos = { x: event.clientX - rect.left, y: event.clientY - rect.top }

            // Check for buttons pressed
            for (let i = 0; i < this.selectedScene.elements?.length; i++) {
                const thisElem = this.selectedScene.elements[i]
                if (checkMenuCollide(thisElem, mousePos, this.resScale)) thisElem.pressButton()
            }
        })

        window.addEventListener('resize', (event) => {
            this.resizeCanvas()
            this.render()
        })

        // Font vars
        this.fonts = []

        // UI vars
        this.uiTiles
        this.loadImage(imageSRC.UI, (img)=>{this.uiTiles = img})

        // Main menu
        const bars = new UIElement({position: {x: 0, y: -menuConstants.tileSize/2}, tiles: [[13],[12],[13],[12],[13],[12],[13],[14]]})
        const mainMenuTitle = new UIElement({position: {x: menuConstants.tileSize, y: menuConstants.tileSize/2}, tiles: [[1,2,2,3]], text: 'Main Menu'})
        const playButton = new UIElement({position: {x: menuConstants.tileSize, y: menuConstants.tileSize*2.5}, tiles: [[5,6,6,6,6,7]], text: 'New Offline Game'})
        playButton.pressButton = () => { this.setScene(this.playMenu) }
        const optionsButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*4.5)}, tiles: [[5,6,7]], text: 'Options'})
        optionsButton.pressButton = () => { this.setScene(this.optionsMenu) }
        this.mainMenu = new UIScene([bars, mainMenuTitle, playButton, optionsButton])

        // Options menu
        const bars2 = new UIElement({position: {x: 0, y: -menuConstants.tileSize/2}, tiles: [[13],[12],[13],[12],[12],[13],[12],[14]]})
        const optionsTitle = new UIElement({position: {x: menuConstants.tileSize, y: menuConstants.tileSize/2}, tiles: [[1,2,2,3]], text: 'Options'})
        const worldSizeInput = new UIElement({position: {x: menuConstants.tileSize, y: menuConstants.tileSize*2.5}, tiles: [[1,2,2,2,3]], text: 'Placeholder'})
        const stinkyInput = new UIElement({position: {x: menuConstants.tileSize, y: menuConstants.tileSize*3.5}, tiles: [[1,2,2,2,3]], text: 'Placeholder'})
        const optionsBackButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*5.5)}, tiles: [[5,6,7]], text: 'Back'})
        optionsBackButton.pressButton = () => { this.setScene(this.mainMenu) }
        this.optionsMenu = new UIScene([bars2, optionsTitle, worldSizeInput, stinkyInput, optionsBackButton])

        // Play menu
        const bars3 = new UIElement({position: {x: 0, y: -menuConstants.tileSize/2}, tiles: [[13],[12],[13],[12],[12],[12],[12],[14]]})
        const playMenuTitle = new UIElement({position: {x: menuConstants.tileSize, y: menuConstants.tileSize/2}, tiles: [[1,2,2,3]], text: 'World Size'})
        const playLoadButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*1.5)}, tiles: [[5,6,6,7]], text: 'Load World'})
        const playSmallButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*2.5)}, tiles: [[5,6,7]], text: 'Small'})
        const playMedButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*3.5)}, tiles: [[5,6,7]], text: 'Medium'})
        const playLargeButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*4.5)}, tiles: [[5,6,7]], text: 'Large'})
        const playBackButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*5.5)}, tiles: [[5,6,7]], text: 'Back'})
        playBackButton.pressButton = () => { this.setScene(this.mainMenu) }
        this.playMenu = new UIScene([bars3, playMenuTitle, playLoadButton, playSmallButton, playMedButton, playLargeButton, playBackButton])

        // Pause menu
        const bars4 = new UIElement({position: {x: 0, y: -menuConstants.tileSize/2}, tiles: [[13],[12],[13],[12],[12],[13],[12],[14]]})
        const pauseTitle = new UIElement({position: {x: menuConstants.tileSize, y: menuConstants.tileSize/2}, tiles: [[1,2,2,3]], text: 'Pause'})
        const pausePlayButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*2.5)}, tiles: [[5,6,6,6,7]], text: 'Back to Game'})
        pausePlayButton.pressButton = () => { this.hide() }
        const pauseSaveButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*3.5)}, tiles: [[5,6,6,7]], text: 'Save World'})
        pauseSaveButton.pressButton = () => { alert('Sorry, This is not yet implemented') }
        const pauseMainMenuButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*5.5)}, tiles: [[5,6,6,7]], text: 'Main Menu'})
        pauseMainMenuButton.pressButton = () => { this.setScene(this.mainMenu) }
        this.pauseMenu = new UIScene([bars4, pauseTitle, pauseMainMenuButton, pauseSaveButton, pausePlayButton])

        // Selected menu
        this.selectedScene = this.mainMenu
    }

    /////////////////////////////////////////////////////////
    // Listener Events
    /////////////////////////////////////////////////////////

    // This should happen on window resize
    resizeCanvas() {
        //...
        this.render()
        this.cWidth = this.canvas.width = this.canvas.parentElement.clientWidth / this.resScale
        this.cHeight = this.canvas.height = this.canvas.parentElement.clientHeight / this.resScale
    }

    /////////////////////////////////////////////////////////
    // Methods
    /////////////////////////////////////////////////////////

    // Used to show the menu canvas
    show() {
        this._visible = true
        this.canvas.style.display = menuConstants.shown
        this.render()
    }

    // Used to hide the menu canvas
    hide() {
        this._visible = false
        this.canvas.style.display = menuConstants.hidden
    }

    toggleVisibility() {
        if (this._visible) this.hide()
        else this.show()
    }

    setScene(newScene) {
        this.selectedScene = newScene
        this.render()
    }

    ////////////////////////////////////////////////////////
    // Drawing
    ////////////////////////////////////////////////////////

    drawTileHere(x, y, offset, tileSize, id) {
        // Calculate ID offset
        const rows = 16
        const columns = 16
        const c = (id-1) % columns
        const r = Math.floor((id-1) / columns)
        // Draw
        if (this.uiTiles) this.ctx.drawImage(this.uiTiles, c*tileSize, r*tileSize, tileSize, tileSize, (x*tileSize) + offset.x, (y*tileSize) + offset.y, tileSize, tileSize)
    }

    animate() {
        // Draw all tiles in current frame / state
            // this.render()
                // this.drawScene(this.activeScene)
                    // this.drawFrame(menuElement)

        // Progress frame for actively animating objects (i.e. 'idle' state elements or 'hover' state elements)
            // menuElement.frame++
    }

    /////////////////////////////////////////////////////////
    // Loaders
    /////////////////////////////////////////////////////////

    // Used to load images into the scene
    loadImage(src, callback) {
        const img = new Image()
        img.src = src
        img.onload = () => {
            // Callback here
            callback(img)
            // Rerender the canvas after performing callback
            this.render()
            if ($('#loading-basic')) $('#loading-basic').style.display = 'none' // ToDo: replace this with a more robust loading indicator
        }
    }

    // Loads font based on .json files
    loadFonts(path, callback = ()=>{}) {
        const font = {img: null, data: fontJSON.battlekourTitle, isLoaded: false}
        this.loadImage(`./client/src/textures/fonts/${font.data.metaData.imgName}`, (img)=>{
            // load json
            font.img = img
            font.isLoaded = true

            console.log('font loaded', font)

            this.fonts.push(font)
            callback(font)
        })
    }

    /////////////////////////////////////////////////////////
    // Drawing and Rendering
    /////////////////////////////////////////////////////////

    drawText(string, position, font) {
        // position = {x: x, y: y}
        // font = {img: img, data: fontJson}
        let addedX = 0
        for (let i = 0; i < string.length; i++) {

            // Get character index
            const charCode = string.charCodeAt(i)
            let index = charCode - 33
            if (charCode < 32 || charCode > 126) index = 126
            const charSize = 16
            const columns = 32

            // Crop the image
            const crop = {
                sx: (index % columns) * charSize,
                sy: Math.floor(index / columns) * charSize,
                sw: font.data.charData[`${charCode}`]?.width || font.data.metrics.defaultWidth || charSize,
                sh: charSize
            }

            // Set position
            const shift = font.data.charData[`${charCode}`]?.shift ? font.data.charData[`${charCode}`].shift : 0
            const xPos = (addedX + position.x) + shift
            const yPos = (position.y - crop.sh) + font.data.metrics.baseline
            
            if (charCode !== 32) {
                // Draw character
                this.ctx.drawImage(font.img, crop.sx, crop.sy, crop.sw, crop.sh, xPos, yPos, crop.sw, crop.sh)

                // Add to next X position
                const tracking = font.data.charData[`${charCode}`]?.tracking ? font.data.charData[`${charCode}`].tracking : 0
                addedX += crop.sw + tracking + font.data.metrics.letterSpacing
            }
            else {
                // Add space to next X position
                addedX += (font.data.metrics.spaceSize || charSize) + font.data.metrics.letterSpacing
            }
        }
    }

    render() {
        // Clear the screen for redraw
        this.ctx.clearRect(0,0,this.cWidth,this.cHeight)

        // Temp draw tiles
        for (let i = 0; i < this.selectedScene.elements?.length; i++) {
            const thisElem = this.selectedScene.elements[i]
            // console.log(thisElem)
            for (let y = 0; y < thisElem.tiles?.length; y++) {
            for (let x = 0; x < thisElem.tiles[y]?.length; x++) {
                const thisTile = thisElem.tiles[y][x]
                const tilePos = {
                    x: Math.floor(thisElem.position.x),
                    y: Math.floor(thisElem.position.y)
                }
                this.drawTileHere(x, y, tilePos, menuConstants.tileSize, thisTile)
            }}
            if (thisElem.text && this.fonts[0]?.isLoaded) {
                const textPos = {
                    x: Math.floor(thisElem.position.x + thisElem.textOffset.x),
                    y: Math.floor(thisElem.position.y + thisElem.textOffset.y)
                }
                this.drawText(thisElem.text, textPos, this.fonts[0])
            }
        }
    }
}

export default MenuSystem