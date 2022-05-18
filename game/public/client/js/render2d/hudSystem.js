import TileRenderer from "./tileRenderer.js"

class HUDSystem extends TileRenderer {
    constructor(canvas) {
        // Do parent constructor
        super(canvas)

        //...
    }

    render() {
        // Do default
        super.render()

        // Test render
        const tSize = 32
        for (let y = 0; y < this.cHeight; y += tSize) {
        for (let x = 0; x < this.cWidth; x += tSize) {
            // Draw tiles
            this.drawTile(250, { x: x, y: y }, tSize)
        }}
        this.drawText('Test string', {x: tSize, y: tSize})
        this.drawText('Smaller test text', {x: tSize, y: tSize*1.5}, this.fonts?.[1])
    }
}

export default HUDSystem