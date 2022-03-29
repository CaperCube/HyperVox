import { imageSRC, fontJSON } from "./resources.js"

// Constants
const menuConstants = {
    hidden: 'none',
    shown: 'inline-block'
}

class MenuSystem {
    constructor(canvas) {
        // Canvas vars
        this.resRatio = 4
        this.canvas = canvas
        this.ctx = this.canvas.getContext("2d")
        this.cWidth = this.canvas.width = window.innerWidth / this.resRatio
        this.cHeight = this.canvas.height = window.innerHeight / this.resRatio
        
        this.canvas.style.width = '100%'
        this.canvas.style.height = '100%'

        this.canvas.style.display = menuConstants.hidden

        // Render vars
        this._visible = false

        // Resize listener

        // Click listener
        this.canvas.addEventListener('mousedown', (event) => {
            // this.hide()
            // this.loadImage(imageSRC.UI, (img)=>{console.log(img)})
            
        })

        this.fonts = []

        // ToDo: remove this
        // this.font = {img: null, data: {}}
        // this.loadImage('./client/src/textures/fonts/BattlekourTitle.png', (img)=>{
        //     // load json
        //     this.font.img = img
        //     this.font.data = bkFont
        //     this.font.isLoaded = true
        // })
    }

    /////////////////////////////////////////////////////////
    // Listener Events
    /////////////////////////////////////////////////////////

    // This should happen on window resize
    resizeCanvas() {
        //...
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

        if (this.fonts[0]?.isLoaded) {
            this.drawText(`play PLAY FART fart`, {x: 0, y: 16}, this.fonts[0])
            this.drawText(`OPTIONS options`, {x: 0, y: 34}, this.fonts[0])
            this.drawText(`BATTLEKOUR ;)`, {x: 0, y: 64}, this.fonts[0])
            this.drawText(`:) (123*4)=[_] {} -_- ~~||=><=`, {x: 0, y: 96}, this.fonts[0])
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