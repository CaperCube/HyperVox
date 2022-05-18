
const elementConstants = {
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
        this.state = elementConstants.states.idle
        this.animations = {
            [elementConstants.states.idle]: {},
            [elementConstants.states.hover]: {}
        }
    }

    bakeAnimations() {
        // render animations and store frames as single images (this reduces the number of draw calls)
        // Store images in `this.animations[this.state].bakedFrames`
    }
}

export default UIElement
export { elementConstants }