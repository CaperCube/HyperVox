import UIElement from './uiElement.js'
class UISlider extends UIElement {
    constructor({
        position = {x: 0, y: 0},
        tiles = [[]],
        text = '',
        fontIndex = 0,
        upTiles = [[]],
        downTiles = [[]],
        sliderTiles = [[]],
        upButtonOffset = {x: 0, y: 0},
        downButtonOffset = {x: 0, y: 0},
        sliderOffset = {x: 0, y: 0},
        valRange = [0,10],
        posRange = [0,32],
        increment = 1,
        defaultValue = 0,
        renderfunction = ()=>{},
        valueUpdateFunction = ()=>{},
    }) {
        // Default constructor
        super({position: {x: position.x + 32, y: position.y}, tiles: tiles, text: text, fontIndex: fontIndex})

        // Value vars
        this.increment = increment
        this.value = defaultValue
        this.valRange = valRange
        this.posRange = posRange

        this.renderfunction = renderfunction
        this.valueUpdateFunction = valueUpdateFunction

        // Tiles (includes "this.tiles")
        this.textOffset = { x: 3, y: 24 }
        this.upButtonOffset = upButtonOffset
        this.downButtonOffset = downButtonOffset
        this.sliderOffset = sliderOffset

        this.upButton = upTiles? new UIElement({
            position: {
                x: position.x + this.upButtonOffset.x,
                y: position.y + this.upButtonOffset.y
            },
            tiles: upTiles
        }) : null
        if (this.upButton) this.upButton.pressButton = () => {this.update(this.value + this.increment)}

        this.downButton = downTiles? new UIElement({
            position: {
                x: position.x + this.downButtonOffset.x,
                y: position.y + this.downButtonOffset.y
            },
            tiles: downTiles
        }) : null
        if (this.downButton) this.downButton.pressButton = () => {this.update(this.value - this.increment)}

        this.slider = sliderTiles? new UIElement({
            position: {
                x: this.position.x + sliderOffset.x,
                y: this.position.y + sliderOffset.y
            },
            tiles: sliderTiles
        }) : null
        this.update(this.value) // update initial position
    }

    update(newVal) {
        // Clamp val to valRange (please laugh at my silly double turnary operator)
        this.value =
            (newVal < this.valRange[0])?
            this.valRange[0] :
            (newVal > this.valRange[1])?
            this.valRange[1] :
            newVal
        
        // Normalize values and get fraction
        const normalMaxVal = Math.abs(this.valRange[1] - this.valRange[0])
        const normalVal = Math.abs(this.value - this.valRange[0])
        const frac = normalVal / normalMaxVal

        // Get position
        const dist = (this.posRange[1] - this.posRange[0])
        const pos = this.posRange[0] + (dist * frac)

        // Set slider posititon
        if (this.slider) {
            this.slider.position.x = Math.floor(pos) + this.position.x + this.sliderOffset.x
        }

        // Callback with value
        this.valueUpdateFunction(this.value)

        // Trigger a render
        this.renderfunction(this.value)
    }
}

export default UISlider