import TileRenderer from "./tileRenderer.js"

const HUDConstants = {
    tileSize: 32
}
class HUDSystem extends TileRenderer {
    constructor(canvas) {
        // Do parent constructor
        super(canvas)

        // Vars for game HUD objects
        // Cursor
        // HP meter
        // Ammo meter
        // Inventory hotbar
        //...
    }

    render() {
        // Do default
        super.render()

        const screenBox = {
            bottom: Math.floor(this.cHeight),
            right: Math.floor(this.cWidth),
            center: {
                x: Math.floor(this.cWidth/2),
                y: Math.floor(this.cHeight/2)
            }
        }

        
        const centerX = (screenBox.center.x - HUDConstants.tileSize/2)
        const centerY = (screenBox.center.y - HUDConstants.tileSize/2)
        const invY = (screenBox.bottom - HUDConstants.tileSize * 1.5)

        // HP
        this.drawTile(18, { x: 0, y: invY }, HUDConstants.tileSize)
        this.drawTile(5, { x: (HUDConstants.tileSize), y: invY }, HUDConstants.tileSize)
        this.drawTile(6, { x: (HUDConstants.tileSize*2), y: invY }, HUDConstants.tileSize)
        this.drawTile(9, { x: (HUDConstants.tileSize*3), y: invY }, HUDConstants.tileSize)
        this.drawText(`100`, {x: (HUDConstants.tileSize*1.5)+4, y: invY + 24})

        // Inv
        this.drawTile(253, { x: centerX - HUDConstants.tileSize, y: invY }, HUDConstants.tileSize)
        this.drawTile(253, { x: centerX, y: invY }, HUDConstants.tileSize)
        this.drawTile(253, { x: centerX + HUDConstants.tileSize, y: invY }, HUDConstants.tileSize)

        // Crosshair
        this.drawTile(250, { x: centerX, y: centerY }, HUDConstants.tileSize)

        // Test render
        // const tSize = 32
        // for (let y = 0; y < this.cHeight; y += tSize) {
        // for (let x = 0; x < this.cWidth; x += tSize) {
        //     // Draw tiles
        //     this.drawTile(250, { x: x, y: y }, tSize)
        // }}
        // this.drawText('Test string', {x: tSize, y: tSize})
        // this.drawText('Smaller test text', {x: tSize, y: tSize*1.5}, this.fonts?.[1])
    }
}

export default HUDSystem
export { HUDConstants }