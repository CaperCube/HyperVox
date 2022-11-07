import TileRenderer from "../tileRenderer.js"
import UIScene from "./uiScene.js"
import UIElement from "./uiElement.js"
import UISlider from "./uiSlider.js"
import { lsKeys } from "../../clientConstants.js"
import { localStorageIsAllowed } from "../../../../common/localStorageUtils.js"

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
}

class MenuSystem extends TileRenderer {
    constructor(canvas) {
        // Do parent constructor
        super(canvas)

        // Default slider
        const SliderDefaults = {
            tiles: [[2,2,2,2]],
        
            upButtonOffset: {x: menuConstants.tileSize*5, y: 0},
            upTiles: [[41]],
        
            downButtonOffset: {x: 0, y: 0},
            downTiles: [[39]],
        
            sliderOffset: {x: (-menuConstants.tileSize/2) + 2, y: 0},
            sliderTiles: [[42]],
        
            valRange: [0,10],
            posRange: [0, (menuConstants.tileSize*4)-4],
        
            renderfunction: ()=>{this.render()},
        }

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
                this.selectedElement = null
                if (thisElem instanceof UISlider) {
                    // check collision for each button
                    if (thisElem.upButton && checkMenuCollide(thisElem.upButton, mousePos, this.resScale)) {
                        this.selectionIndex = i
                        this.elementIsSelected = true
                        this.selectedElement = thisElem.upButton
                        break // This makes sure that we only select one element if overlapping
                    }
                    else if (thisElem.downButton && checkMenuCollide(thisElem.downButton, mousePos, this.resScale)) {
                        this.selectionIndex = i
                        this.elementIsSelected = true
                        this.selectedElement = thisElem.downButton
                        break // This makes sure that we only select one element if overlapping
                    }
                }
                else {
                    if (checkMenuCollide(thisElem, mousePos, this.resScale)) {
                        this.selectionIndex = i
                        this.elementIsSelected = true
                        this.selectedElement = thisElem
                        break // This makes sure that we only select one element if overlapping
                    }
                }
            }
        })

        // Mouse down (choose selection)
        this.canvas.addEventListener('mousedown', (event) => {
            //if (this.elementIsSelected && this.selectedScene?.selectableElements[this.selectionIndex]) this.selectedScene.selectableElements[this.selectionIndex].pressButton()
            if (this.selectedElement) this.selectedElement.pressButton()
        })

        // UI vars
        const title = [spriteParts.titleWindowL, spriteParts.titleWindowM, spriteParts.titleWindowR]
        const titleMid = [spriteParts.titleWindowL, spriteParts.titleWindowM, spriteParts.titleWindowM, spriteParts.titleWindowR]
        const titleLong = [spriteParts.titleWindowL, spriteParts.titleWindowM, spriteParts.titleWindowM, spriteParts.titleWindowM, spriteParts.titleWindowR]
        const titleExLong = [spriteParts.titleWindowL, spriteParts.titleWindowM, spriteParts.titleWindowM, spriteParts.titleWindowM, spriteParts.titleWindowM, spriteParts.titleWindowR]
        const button = [spriteParts.TextButtonL, spriteParts.TextButtonM, spriteParts.TextButtonR]
        const buttonMid = [spriteParts.TextButtonL, spriteParts.TextButtonM, spriteParts.TextButtonM, spriteParts.TextButtonR]
        const buttonLong = [spriteParts.TextButtonL, spriteParts.TextButtonM, spriteParts.TextButtonM, spriteParts.TextButtonM, spriteParts.TextButtonR]

        /////////////////////////////////////////////////////////
        // Main menu
        /////////////////////////////////////////////////////////
        const bars = new UIElement({position: {x: 0, y: -menuConstants.tileSize/2}, tiles: [[spriteParts.barVert],[spriteParts.barJointTRB],[spriteParts.barVert],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barVert],[spriteParts.barBendTL]]})
        const mainMenuTitle = new UIElement({position: {x: menuConstants.tileSize, y: menuConstants.tileSize/2}, tiles: [titleMid], text: 'Main Menu'})
        const playButton = new UIElement({position: {x: menuConstants.tileSize, y: menuConstants.tileSize*2.5}, tiles: [buttonMid], text: 'Start Game'})
        const joinButton = new UIElement({position: {x: menuConstants.tileSize, y: menuConstants.tileSize*3.5}, tiles: [buttonMid], text: 'Join Online'})        
        playButton.pressButton = () => { this.setScene(this.playMenu) }
        const optionsButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*4.5)}, tiles: [button], text: 'Options'})
        optionsButton.pressButton = () => { this.setScene(this.optionsMenu) }

        this.mainMenu = new UIScene([bars, mainMenuTitle], [playButton, joinButton, optionsButton])

        /////////////////////////////////////////////////////////
        // Options menu
        /////////////////////////////////////////////////////////
        // const bars2 = new UIElement({position: {x: 0, y: -menuConstants.tileSize/2}, tiles: [[spriteParts.barVert],[spriteParts.barJointTRB],[spriteParts.barVert],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barVert],[spriteParts.barJointTRB],[spriteParts.barBendTL]]})
        const bars3 = new UIElement({position: {x: 0, y: -menuConstants.tileSize/2}, tiles: [[spriteParts.barVert],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barBendTL]]})
        const optionsTitle = new UIElement({position: {x: menuConstants.tileSize, y: menuConstants.tileSize/2}, tiles: [titleMid], text: 'Options'})
        // Mouse speed
        // GUI scale
        // FOV
        // Controls
        // Defaults
        const settingsLoaded = (localStorageIsAllowed())? JSON.parse(localStorage.getItem(lsKeys.clientSettings)) : null // Load settings if the exist
        const lookSlider = new UISlider({
            ...SliderDefaults,
            text: 'Look Speed',
            position: { x: menuConstants.tileSize, y: menuConstants.tileSize*1.5 },
            increment: 100,
            defaultValue: (settingsLoaded?.mouseSensitivity)? (1100 - settingsLoaded?.mouseSensitivity) : 400,
            valRange: [100,1000],
        })

        const guiScaleSlider = new UISlider({
            ...SliderDefaults,
            text: 'GUI Scale',
            position: { x: menuConstants.tileSize, y: menuConstants.tileSize*3.5 },
            increment: 1,
            defaultValue: 2,
            valRange: [1,4],
        })

        const fovSlider = new UISlider({
            ...SliderDefaults,
            text: 'FoV',
            position: { x: menuConstants.tileSize, y: menuConstants.tileSize*2.5 },
            increment: 0.1,
            defaultValue: settingsLoaded?.fov || 1.35,
            valRange: [0.55,2.15],
        })

        const chunkDistSlider = new UISlider({
            ...SliderDefaults,
            text: `Chunk Dist`,
            position: { x: menuConstants.tileSize, y: menuConstants.tileSize*4.5 },
            increment: 1,
            defaultValue: settingsLoaded?.chunkDist || 5,
            valRange: [1,10],
        })
        const defaultsButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*5.5)}, tiles: [buttonMid], text: 'Defaults'})
        // Back
        const optionsBackButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*6.5)}, tiles: [button], text: 'Back'})
        optionsBackButton.pressButton = () => { this.setScene(this.mainMenu) }
        
        this.optionsMenu = new UIScene([bars3, optionsTitle], [lookSlider, fovSlider, guiScaleSlider, chunkDistSlider, defaultsButton, optionsBackButton])

        /////////////////////////////////////////////////////////
        // Play menu
        /////////////////////////////////////////////////////////
        // const bars3 = new UIElement({position: {x: 0, y: -menuConstants.tileSize/2}, tiles: [[spriteParts.barVert],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barBendTL]]})
        const playMenuTitle = new UIElement({position: {x: menuConstants.tileSize, y: menuConstants.tileSize/2}, tiles: [titleMid], text: 'World Size'})
        const playLoadButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*1.5)}, tiles: [buttonMid], text: 'Load World'})
        const playSmallButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*2.5)}, tiles: [button], text: 'Small'})
        const playMedButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*3.5)}, tiles: [button], text: 'Medium'})
        const playLargeButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*4.5)}, tiles: [button], text: 'Large'})
        const playBackButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*5.5)}, tiles: [button], text: 'Back'})
        playBackButton.pressButton = () => { this.setScene(this.mainMenu) }
        
        this.playMenu = new UIScene([bars3, playMenuTitle], [playLoadButton, playSmallButton, playMedButton, playLargeButton, playBackButton])

        /////////////////////////////////////////////////////////
        // Pause menu
        /////////////////////////////////////////////////////////
        // const bars4 = new UIElement({position: {x: 0, y: -menuConstants.tileSize/2}, tiles: [[spriteParts.barVert],[spriteParts.barJointTRB],[spriteParts.barVert],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barJointTRB],[spriteParts.barBendTL]]})
        const pauseTitle = new UIElement({position: {x: menuConstants.tileSize, y: menuConstants.tileSize/2}, tiles: [titleMid], text: 'Pause'})
        const pausePlayButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*1.5)}, tiles: [buttonLong], text: 'Back to Game'})
        const pauseOptionsButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*2.5)}, tiles: [button], text: 'Options'})
        pauseOptionsButton.pressButton = () => { this.setScene(this.pauseOptions) }
        
        const pauseSaveButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*3.5)}, tiles: [buttonMid], text: 'Save World'})
        const pauseNewWorldButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*4.5)}, tiles: [buttonMid], text: 'New World'})
        pauseNewWorldButton.pressButton = () => { this.setScene(this.pausePlayMenu) }
        const pauseExportButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*5.5)}, tiles: [buttonLong], text: 'Export as Mesh'})
        
        const leaveButton = new UIElement({position: {x: menuConstants.tileSize, y: menuConstants.tileSize*6.5}, tiles: [buttonMid], text: 'Leave Game'})
        
        this.pauseMenu = new UIScene([bars3, pauseTitle], [pausePlayButton, pauseSaveButton, leaveButton, pauseNewWorldButton, pauseOptionsButton, pauseExportButton])

        /////////////////////////////////////////////////////////
        // Pause Play Menu
        /////////////////////////////////////////////////////////
        const pausePlayBackButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*5.5)}, tiles: [button], text: 'Back'})
        pausePlayBackButton.pressButton = () => { this.setScene(this.pauseMenu) }
        this.pausePlayMenu = new UIScene([bars3, playMenuTitle], [playLoadButton, playSmallButton, playMedButton, playLargeButton, pausePlayBackButton])

        /////////////////////////////////////////////////////////
        // Pause Options
        /////////////////////////////////////////////////////////
        const pauseOptionsBackButton = new UIElement({position: {x: menuConstants.tileSize, y: (menuConstants.tileSize*6.5)}, tiles: [button], text: 'Back'})
        pauseOptionsBackButton.pressButton = () => { this.setScene(this.pauseMenu) }

        //[lookSlider, fovSlider, guiScaleSlider, chunkDistSlider, defaultsButton, optionsBackButton]
        this.pauseOptions = new UIScene([bars3, optionsTitle], [lookSlider, fovSlider, guiScaleSlider, chunkDistSlider, defaultsButton, pauseOptionsBackButton])

        // Selection vars
        this.selectedScene = this.mainMenu
        this.selectionIndex = 0
        this.elementIsSelected = false
        this.selectedElement = null // ToDo: we'll need to change how this works for non-mouse input
    }

    /////////////////////////////////////////////////////////
    // Visibility
    /////////////////////////////////////////////////////////

    setScene(newScene) {
        // Reset menu selections
        this.selectionIndex = 0
        this.elementIsSelected = false
        this.selectedElement = null

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

    /////////////////////////////////////////////////////////
    // Drawing and Rendering
    /////////////////////////////////////////////////////////

    animate() {
        // Draw all tiles in current frame / state
            // this.render()
                // this.drawScene(this.activeScene)
                    // this.drawFrame(menuElement)

        // Progress frame for actively animating objects (i.e. 'idle' state elements or 'hover' state elements)
            // menuElement.frame++
    }

    draw = (thisElem) => {
        if (thisElem instanceof UISlider) {
            this.drawElement(thisElem)
            if (thisElem.slider) this.drawElement(thisElem.slider)
            if (thisElem.upButton) this.drawElement(thisElem.upButton)
            if (thisElem.downButton) this.drawElement(thisElem.downButton)
        }
        else {
            this.drawElement(thisElem)
        }
    }

    drawElement = (thisElem) => {
        for (let y = 0; y < thisElem.tiles?.length; y++) {
        for (let x = 0; x < thisElem.tiles[y]?.length; x++) {
            const thisTile = thisElem.tiles[y][x]
            const tilePos = {
                x: Math.floor(thisElem.position.x),
                y: Math.floor(thisElem.position.y)
            }
            this.drawTile(thisTile, {x: (x * menuConstants.tileSize) + tilePos.x, y: (y * menuConstants.tileSize) + tilePos.y}, menuConstants.tileSize )
        }}
        if (thisElem.text && this.fonts[thisElem.fontIndex]?.isLoaded) {
            const textPos = {
                x: Math.floor(thisElem.position.x + thisElem.textOffset.x),
                y: Math.floor(thisElem.position.y + thisElem.textOffset.y)
            }
            this.drawText(thisElem.text, textPos, this.fonts[thisElem.fontIndex], this.ctx)
        }
    }

    render() {
        // Do default
        super.render()

        // draw elements
        for (let i = 0; i < this.selectedScene?.elements?.length; i++) {
            this.draw(this.selectedScene.elements[i])
        }

        // draw selectableElements
        for (let i = 0; i < this.selectedScene?.selectableElements?.length; i++) {
            this.draw(this.selectedScene.selectableElements[i])
        }

        // draw version number
        if (versionNumber && this.fonts?.[0]?.isLoaded) this.drawText(`ver. ${versionNumber}`, { x: 10, y: (Math.floor(this.cHeight) - 10)}, this.fonts[0], this.ctx)
    }
}

export default MenuSystem