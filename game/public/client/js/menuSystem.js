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

// Sprite constants
const spriteParts = {
    // Text Windows
    titleWindowL: '1',
    titleWindowM: '2',
    titleWindowR: '3',
    titleWindowClosed: '4',
    // Text Buttons
    TextButtonL: '5',
    TextButtonM: '6',
    TextButtonR: '7',
    TextButtonRSel: '8',
    TextButtonRHeart: '9',
    TextButtonRAmmo: '10',
    // TextButtonLOff: '11',
    // TextButtonMOff: '12',
    // TextButtonROff: '13',
    // Bars
    barVert: '17',
    barHorz: '18',
    barBendTR: '19',
    barBendBR: '20',
    barBendBL: '21',
    barBendTL: '22',
    barJointTRB: '23',
    // Hands
    //...
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
    constructor({position = {x: 0, y: 0}, tiles = [[]], text = '', fontIndex = 0}) {
        this.position = position
        this.tiles = tiles
        this.text = text
        this.fontIndex = fontIndex
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
    constructor(elements = [], selectableElements = []) {
        this.elements = elements
        this.selectableElements = selectableElements
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
        
        // Mouse move
        this.canvas.addEventListener('mousemove', (event) => {
            // Get mouse pos
            const rect = canvas.getBoundingClientRect()
            const mousePos = { x: event.clientX - rect.left, y: event.clientY - rect.top }

            this.elementIsSelected = false

            // Check for mouse hover
            for (let i = 0; i < this.selectedScene.selectableElements?.length; i++) {
                const thisElem = this.selectedScene.selectableElements[i]
                if (checkMenuCollide(thisElem, mousePos, this.resScale)) {
                    this.selectionIndex = i
                    this.elementIsSelected = true
                    // console.log(`${i} selected`)
                    break // This makes sure that we only select one element if overlapping
                }
            }
        })

        // Mouse down (choose selection)
        this.canvas.addEventListener('mousedown', (event) => {
            // const rect = canvas.getBoundingClientRect()
            // const mousePos = { x: event.clientX - rect.left, y: event.clientY - rect.top }

            // // Check for buttons pressed
            // for (let i = 0; i < this.selectedScene.elements?.length; i++) {
            //     const thisElem = this.selectedScene.elements[i]
            //     if (checkMenuCollide(thisElem, mousePos, this.resScale)) {
            //         thisElem.pressButton()
            //         break // This makes sure that we don't keep have click function double triggering
            //     }
            // }

            if (this.elementIsSelected && this.selectedScene?.selectableElements[this.selectionIndex]) this.selectedScene.selectableElements[this.selectionIndex].pressButton()
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

        const title = [spriteParts.titleWindowL, spriteParts.titleWindowM, spriteParts.titleWindowR]
        const titleMid = [spriteParts.titleWindowL, spriteParts.titleWindowM, spriteParts.titleWindowM, spriteParts.titleWindowR]
        const titleLong = [spriteParts.titleWindowL, spriteParts.titleWindowM, spriteParts.titleWindowM, spriteParts.titleWindowM, spriteParts.titleWindowR]
        const button = [spriteParts.TextButtonL, spriteParts.TextButtonM, spriteParts.TextButtonR]
        const buttonMid = [spriteParts.TextButtonL, spriteParts.TextButtonM, spriteParts.TextButtonM, spriteParts.TextButtonR]
        const buttonLong = [spriteParts.TextButtonL, spriteParts.TextButtonM, spriteParts.TextButtonM, spriteParts.TextButtonM, spriteParts.TextButtonR]

        // Main menu
        const bars = new UIElement({position: {x: 0, y: -menuConstants.tileSize/2}, tiles: [[spriteParts.barVert],[spriteParts.barJointTRB],[spriteParts.barVert],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barVert],[spriteParts.barBendTL]]})
        const mainMenuTitle = new UIElement({position: {x: menuConstants.tileSize, y: menuConstants.tileSize/2}, tiles: [titleMid], text: 'Main Menu'})
        const playButton = new UIElement({position: {x: menuConstants.tileSize, y: menuConstants.tileSize*2.5}, tiles: [buttonMid], text: 'Start Game'})
        const joinButton = new UIElement({position: {x: menuConstants.tileSize, y: menuConstants.tileSize*3.5}, tiles: [buttonMid], text: 'Join Online'})        
        playButton.pressButton = () => { this.setScene(this.playMenu) }
        const optionsButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*4.5)}, tiles: [button], text: 'Options'})
        optionsButton.pressButton = () => { this.setScene(this.optionsMenu) }
        
        this.mainMenu = new UIScene([bars, mainMenuTitle], [playButton, joinButton, optionsButton])

        // Options menu
        const bars2 = new UIElement({position: {x: 0, y: -menuConstants.tileSize/2}, tiles: [[spriteParts.barVert],[spriteParts.barJointTRB],[spriteParts.barVert],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barVert],[spriteParts.barJointTRB],[spriteParts.barBendTL]]})
        const optionsTitle = new UIElement({position: {x: menuConstants.tileSize, y: menuConstants.tileSize/2}, tiles: [titleMid], text: 'Options'})
        const worldSizeInput = new UIElement({position: {x: menuConstants.tileSize, y: menuConstants.tileSize*2.5}, tiles: [titleLong], text: 'Placeholder'})
        const stinkyInput = new UIElement({position: {x: menuConstants.tileSize, y: menuConstants.tileSize*3.5}, tiles: [titleLong], text: 'Placeholder'})
        const optionsBackButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*5.5)}, tiles: [button], text: 'Back'})
        optionsBackButton.pressButton = () => { this.setScene(this.mainMenu) }
        
        this.optionsMenu = new UIScene([bars2, optionsTitle, worldSizeInput, stinkyInput], [optionsBackButton])

        // Play menu
        const bars3 = new UIElement({position: {x: 0, y: -menuConstants.tileSize/2}, tiles: [[spriteParts.barVert],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barBendTL]]})
        const playMenuTitle = new UIElement({position: {x: menuConstants.tileSize, y: menuConstants.tileSize/2}, tiles: [titleMid], text: 'World Size'})
        const playLoadButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*1.5)}, tiles: [buttonMid], text: 'Load World'})
        const playSmallButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*2.5)}, tiles: [button], text: 'Small'})
        const playMedButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*3.5)}, tiles: [button], text: 'Medium'})
        const playLargeButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*4.5)}, tiles: [button], text: 'Large'})
        const playBackButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*5.5)}, tiles: [button], text: 'Back'})
        playBackButton.pressButton = () => { this.setScene(this.mainMenu) }
        
        this.playMenu = new UIScene([bars3, playMenuTitle], [playLoadButton, playSmallButton, playMedButton, playLargeButton, playBackButton])

        // Pause menu
        const bars4 = new UIElement({position: {x: 0, y: -menuConstants.tileSize/2}, tiles: [[spriteParts.barVert],[spriteParts.barJointTRB],[spriteParts.barVert],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barBendTL]]})
        const pauseTitle = new UIElement({position: {x: menuConstants.tileSize, y: menuConstants.tileSize/2}, tiles: [titleMid], text: 'Pause'})
        const pausePlayButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*2.5)}, tiles: [buttonLong], text: 'Back to Game'})
        pausePlayButton.pressButton = () => { this.hide() }
        const pauseSaveButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*3.5)}, tiles: [buttonMid], text: 'Save World'})
        const leaveButton = new UIElement({position: {x: menuConstants.tileSize, y: menuConstants.tileSize*4.5}, tiles: [buttonMid], text: 'Leave Game'})
        const pauseMainMenuButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*5.5)}, tiles: [buttonMid], text: 'Main Menu'})
        pauseMainMenuButton.pressButton = () => { this.setScene(this.mainMenu) }
        
        this.pauseMenu = new UIScene([bars4, pauseTitle], [pausePlayButton, pauseSaveButton, leaveButton, pauseMainMenuButton])

        // Selected menu
        this.selectedScene = this.mainMenu

        // The menu item that is selected
        this.selectionIndex = 0
        this.elementIsSelected = false
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
        // Reset menu selections
        this.selectionIndex = 0
        this.elementIsSelected = false

        // Set visibility
        this._visible = true
        this.canvas.style.display = menuConstants.shown

        // Redraw
        this.render()
    }

    // Used to hide the menu canvas
    hide() {
        // Reset menu selections
        this.elementIsSelected = false

        // Set visibility
        this._visible = false
        this.canvas.style.display = menuConstants.hidden
    }

    toggleVisibility() {
        if (this._visible) this.hide()
        else this.show()
    }

    setScene(newScene) {
        // Reset menu selections
        this.selectionIndex = 0
        this.elementIsSelected = false

        // Set new menu scene
        this.selectedScene = newScene
        this.render()
    }

    /////////////////////////////////////////////////////////
    // Selections
    /////////////////////////////////////////////////////////

    setSelection = (num) => {
        if (num < 0) this.selectionIndex = 0
        else if (num >= this.selectedScene.selectableElements.length) this.selectionIndex = (this.selectedScene.selectableElements.length - 1)
        else this.selectionIndex = num
        // ToDo: Redraw selected item's graphic or cursor
        //...
    }

    selectNextItem = () => {
        let num = (this.selectionIndex + 1) % this.selectedScene.selectableElements.length
        this.setSelection(num)
    }

    selectPrevItem = () => {
        let num = this.selectionIndex - 1
        if (num < 0) num = this.selectedScene.selectableElements.length - 1
        this.setSelection(num)
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
        const titleFont = {img: null, data: fontJSON.battlekourTitle, isLoaded: false}
        const smallFont = {img: null, data: fontJSON.battlekourBody, isLoaded: false}
        this.loadImage(`./client/src/textures/fonts/${titleFont.data.metaData.imgName}`, (img)=>{
            // load json
            titleFont.img = img
            titleFont.isLoaded = true

            console.log('font loaded', titleFont)

            this.fonts.push(titleFont)
            
            // Small font
            this.loadImage(`./client/src/textures/fonts/${smallFont.data.metaData.imgName}`, (img)=>{
                // load json
                smallFont.img = img
                smallFont.isLoaded = true
    
                console.log('font loaded', smallFont)
    
                this.fonts.push(smallFont)
                callback(smallFont)
            })
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
            const charSize = font.data.metrics.fontSize || 16
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

    drawElement = (thisElem) => {
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
        if (thisElem.text && this.fonts[thisElem.fontIndex]?.isLoaded) {
            const textPos = {
                x: Math.floor(thisElem.position.x + thisElem.textOffset.x),
                y: Math.floor(thisElem.position.y + thisElem.textOffset.y)
            }
            this.drawText(thisElem.text, textPos, this.fonts[thisElem.fontIndex])
        }
    }

    render() {
        // Clear the screen for redraw
        this.ctx.clearRect(0,0,this.cWidth,this.cHeight)

        // draw elements
        for (let i = 0; i < this.selectedScene.elements?.length; i++) {
            this.drawElement(this.selectedScene.elements[i])
        }

        // draw selectableElements
        for (let i = 0; i < this.selectedScene.selectableElements?.length; i++) {
            this.drawElement(this.selectedScene.selectableElements[i])
        }
    }
}

export default MenuSystem