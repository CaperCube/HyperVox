import { imageSRC, fontJSON } from "./resources.js"

// Constants
const menuConstants = {
    hidden: 'none',
    shown: 'inline-block'
}

class MenuSystem {
    constructor(canvas) {
        // Canvas vars
        this.resRatio = 2
        this.canvas = canvas
        this.ctx = this.canvas.getContext("2d")
        this.cWidth = this.canvas.width = this.canvas.parentElement.clientWidth / this.resRatio
        this.cHeight = this.canvas.height = this.canvas.parentElement.clientHeight / this.resRatio
        //this.cWidth = this.canvas.width = window.innerWidth / this.resRatio
        //this.cHeight = this.canvas.height = window.innerHeight / this.resRatio
        
        this.canvas.style.width = '100%'
        this.canvas.style.height = '100%'

        this.canvas.style.display = menuConstants.hidden

        // Render vars
        this._visible = false

        // Resize listener

        // Event Listeners
        this.canvas.addEventListener('mousedown', (event) => {
            // this.hide()
            // this.loadImage(imageSRC.UI, (img)=>{console.log(img)})
            
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

        // 2D array to represent the tiles in the menu
        // ToDo: replace this with MenuScene()'s, MenuElement()'s, animations, and states
        this.menuScene = [
            [13],
            [12,1,2,2,3],
            [13],
            [12,5,6,7,20],
            [13],
        ]
    }

    /////////////////////////////////////////////////////////
    // Listener Events
    /////////////////////////////////////////////////////////

    // This should happen on window resize
    resizeCanvas() {
        //...
        this.render()
        this.cWidth = this.canvas.width = this.canvas.parentElement.clientWidth / this.resRatio
        this.cHeight = this.canvas.height = this.canvas.parentElement.clientHeight / this.resRatio
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

    ////////////////////////////////////////////////////////
    // Drawing
    ////////////////////////////////////////////////////////

    drawTileHere(x, y, tileSize, id) {
        // Calculate ID offset
        const rows = 16
        const columns = 16
        const c = (id-1) % columns
        const r = Math.floor((id-1) / columns)
        // Draw
        if (this.uiTiles) this.ctx.drawImage(this.uiTiles, c*tileSize, r*tileSize, tileSize, tileSize, x*tileSize, y*tileSize, tileSize, tileSize)
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
        }
    }

    // Loads font based on .json files
    loadFonts(path, callback = ()=>{}) {
        const font = {img: null, data: fontJSON.battlekourTitle, isLoaded: false}
        this.loadImage(`/client/src/textures/fonts/${font.data.metaData.imgName}`, (img)=>{
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
        this.ctx.clearRect(0,0,this.cWidth,this.cHeight)

        // this.ctx.fillStyle = '#00ff00'
        // this.ctx.fillRect(10,10,20,20)

        // Temp draw tiles
        // ToDo: replace this
        for (let y = 0; y < this.menuScene.length; y++) {
        for (let x = 0; x < this.menuScene[y].length; x++) {
            const thisTile = this.menuScene[y][x]
            if (thisTile > 0) {
                this.drawTileHere(x, y, 32, thisTile)
            }
        }}

        // Draw text
        if (this.fonts[0]?.isLoaded) {
            this.drawText(`Menu`, {x: 64, y: 56}, this.fonts[0])
            // this.drawText(`OPTIONS options`, {x: 0, y: 34}, this.fonts[0])
            // this.drawText(`BATTLEKOUR ;)`, {x: 0, y: 64}, this.fonts[0])
            // this.drawText(`:) (123*4)=[_] {} -_- ~~||=><=`, {x: 0, y: 96}, this.fonts[0])
            // this.drawText(`!"#$%&'(`, {x: 0, y: 16}, this.font)
            // this.drawText(`)*+,-./0`, {x: 0, y: 32}, this.font)
            // this.drawText(`12345678`, {x: 0, y: 48}, this.font)
            // this.drawText(`9:;<=>?@`, {x: 0, y: 64}, this.font)

            // this.drawText(`ABCDEFGH`, {x: 0, y: 80}, this.font)
            // this.drawText(`IJKLMNOP`, {x: 0, y: 96}, this.font)
            // this.drawText(`QRSTUVWX`, {x: 0, y: 112}, this.font)
            // this.drawText(`YZ[\\]^_\``, {x: 0, y: 128}, this.font)

            // this.drawText(`abcdefgh`, {x: 0, y: 144}, this.font)
            // this.drawText(`ijklmnop`, {x: 0, y: 160}, this.font)
            // this.drawText(`qrstuvwx`, {x: 0, y: 176}, this.font)
            // this.drawText(`yz{|}~${String.fromCharCode(128)}`, {x: 0, y: 192}, this.font)
        }
    }
}

export default MenuSystem