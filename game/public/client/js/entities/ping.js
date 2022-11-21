import Effect from './effect.js'

// Ping object
class Ping extends Effect {
    constructor({
        id,
        position = { x:0, y:0, z:0 },
        lifetime = 500, // Time before destroy (in ms)
        clientGame
        }) {
            // Parent
            super({ id: id, position: position, lifetime: lifetime, type: 'sprite', clientGame: clientGame })

            // Constructor
            //...
    }

    update() {
        this.offset.y = (Math.sin(this.myFrames * 0.05) * 0.5)

        // Do parent update
        super.update()
    }
}

export default Ping