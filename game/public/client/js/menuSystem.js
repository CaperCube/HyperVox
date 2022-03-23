// Constants
const menuConstants = {
    hidden: 'none',
    shown: 'inline-block'
}

class MenuSystem {
    constructor() {
        // Canvas vars
        this.canvas = $("#menu-canvas")
        this.ctx = this.canvas.getContext("2d")
        this.cWidth = this.canvas.width = 400
        this.cHeight = this.canvas.height = 320
        
        this.canvas.style.width = '100%'
        this.canvas.style.height = '100%'

        this.canvas.style.display = menuConstants.hidden

        // Render vars
        this._visible = false

        // Resize listener

        // Click listener
        this.canvas.addEventListener('mousedown', (event) => {
            this.hide()
        })
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
    }

    // Used to hide the menu canvas
    hide() {
        this._visible = false
        this.canvas.style.display = menuConstants.hidden
    }

    /////////////////////////////////////////////////////////
    // Drawing and Rendering
    /////////////////////////////////////////////////////////

    render() {
        this.ctx.clearRect(0,0,this.cWidth,this.cHeight)

        this.ctx.fillStyle = '#00ff00'
        this.ctx.fillRect(10,10,20,20)
    }
}

export default MenuSystem