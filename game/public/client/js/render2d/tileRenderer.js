import { imageSRC, fontJSON } from "../resources.js"

const tdConstants = {
    hiddenStyle: 'none',
    shownStyle: 'inline-block',
}

class TileRenderer {
    constructor(canvas) {
        // Canvas vars
        this.resScale = 2
        this.canvas = canvas
        this.ctx = this.canvas.getContext("2d")
        this.resizeCanvas()

        // Canvas intial setup
        this.canvas.style.width = '100%'
        this.canvas.style.height = '100%'
        this.canvas.style.display = tdConstants.shownStyle

        // Graphic vars
        this.tileSet = null
        this.fonts = []

        // Render vars
        this._visible = false

        // Event Listeners
        window.addEventListener('resize', (event) => {
            this.resizeCanvas()
        })
    }

    /////////////////////////////////////////////////////////
    // Listener Events
    /////////////////////////////////////////////////////////

    // This should happen on window resize
    resizeCanvas() {
        this.cWidth = this.canvas.width = this.canvas.parentElement.clientWidth / this.resScale
        this.cHeight = this.canvas.height = this.canvas.parentElement.clientHeight / this.resScale
        this.render()
    }

    /////////////////////////////////////////////////////////
    // Visibility
    /////////////////////////////////////////////////////////

    // Used to show the menu canvas
    show() {
        // Reset menu selections
        this.selectionIndex = 0
        this.elementIsSelected = false

        // Set visibility
        this._visible = true
        this.canvas.style.display = tdConstants.shownStyle

        // Redraw
        this.render()
    }

    // Used to hide the menu canvas
    hide() {
        // Reset menu selections
        this.elementIsSelected = false

        // Set visibility
        this._visible = false
        this.canvas.style.display = tdConstants.hiddenStyle
    }

    // Used to switch between hidden & shown
    toggleVisibility() {
        if (this._visible) this.hide()
        else this.show()
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
            // If loading image is in scene, enable it
            // ToDo: replace this with a more robust loading indicator
            if ($('#loading-basic')) $('#loading-basic').style.display = 'none'
        }
    }

    // Loads font based on .json files
    loadFonts({ path = `./client/src/textures/fonts/`, callback = ()=>{} }) {
        const titleFont = {img: null, data: fontJSON.battlekourTitle, isLoaded: false}
        const smallFont = {img: null, data: fontJSON.battlekourBody, isLoaded: false}
        this.loadImage(`${path}${titleFont.data.metaData.imgName}`, (img)=>{
            // load json
            titleFont.img = img
            titleFont.isLoaded = true

            console.log('font loaded', titleFont)

            this.fonts.push(titleFont)
            
            // Small font
            this.loadImage(`${path}${smallFont.data.metaData.imgName}`, (img)=>{
                // load json
                smallFont.img = img
                smallFont.isLoaded = true
    
                console.log('font loaded', smallFont)
    
                this.fonts.push(smallFont)
                callback(smallFont)
            })
        })
    }

    // Batch load assets
    setupGraphics({ tileSheetPath = imageSRC.UI, fontPath = `./client/src/textures/fonts/` }) {
        let progress = 0
        const onFinish = () => {
            this.render()
        }
        
        // Load tilesheets
        this.loadImage(tileSheetPath, (img) => {
            this.tileSet = img
            // Add to progress
            progress++
            if (progress > 2) onFinish()
        })

        // Load font
        this.loadFonts({ path: fontPath, callback: (font) => {
            // Add to progress
            progress++
            if (progress > 2) onFinish()
        }})
    }

    /////////////////////////////////////////////////////////
    // Baking
    /////////////////////////////////////////////////////////

    // Returns an image
    bakeText = (string, font, callback) => {
        // Measure text
        const textSize = this.drawText( string, { x:0, y:0 }, font, null )

        // Create temporary cnavas
        const tempCanvas = document.createElement("canvas")
        const tempCtx = tempCanvas.getContext("2d")
        tempCanvas.width = textSize.x
        tempCanvas.height = textSize.y

        // Draw text to canvas
        this.drawText( string, { x: 0, y: textSize.y }, font, tempCtx )

        // Create image from canvas
        const textImage = new Image( textSize.x, textSize.y )
        textImage.onload = () => { 
            
            callback(textImage) }
        textImage.src = tempCanvas.toDataURL()
    }

    // Returns an image
    bakeTiles = (tiles) => {
        //...
    }

    // Returns an image
    bakeTilesAndText = (tiles, string) => {
        //...
    }

    /////////////////////////////////////////////////////////
    // Drawing and Rendering
    /////////////////////////////////////////////////////////

    drawTile(id = 1, position = {x: 0, y: 0}, tileSize = 32, myCtx = this.ctx) {
        // Calculate ID offset
        const rows = 16
        const columns = 16
        const c = (id-1) % columns
        const r = Math.floor((id-1) / columns)
        // Draw
        if (this.tileSet) myCtx.drawImage(this.tileSet, c*tileSize, r*tileSize, tileSize, tileSize, position.x, position.y, tileSize, tileSize)
    }

    // Draws to given context (if available) and returns the size of the canvas in {x,y} pixels
    drawText(string, position = {x: 0, y: 0}, font = this.fonts?.[0], myCtx = this.ctx) {
        // font = {img: img, data: fontJson}
        if (font) {
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
                    if (myCtx) myCtx.drawImage(font.img, crop.sx, crop.sy, crop.sw, crop.sh, xPos, yPos, crop.sw, crop.sh)

                    // Add to next X position
                    const tracking = font.data.charData[`${charCode}`]?.tracking ? font.data.charData[`${charCode}`].tracking : 0
                    addedX += crop.sw + tracking + font.data.metrics.letterSpacing
                }
                else {
                    // Add space to next X position
                    addedX += (font.data.metrics.spaceSize || charSize) + font.data.metrics.letterSpacing
                }
            }

            return { x: addedX, y: font.data.metrics.fontSize }
        }
        else return null
    }

    render() {
        // Clear the screen for redraw
        this.ctx.clearRect(0,0,this.cWidth,this.cHeight)

        // Use this when inheriting this class, call this first:
        // super.render()
    }
}

export default TileRenderer
export { tdConstants }