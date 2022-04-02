# Tier 2

## Win conditions
Tier shaping needed...

# Tasks
- [ ] Better world gen (start putting this in './brain')
    - [ ] Pre generate world chunk meshes before game start
    - [X] Live load chunk meshes
    - [ ] Save / Load worlds (probably as a .json)
    - [ ] Consider creating a custom `PatternGenerator` class with various seeded 3D noise generators
        - [Perlin noise tutorial](https://joeiddon.github.io/projects/javascript/perlin.html)
        - [Helpful article on seeded random](https://davidbau.com/archives/2010/01/30/random_seeds_coded_hints_and_quintillions.html)
- [ ] More work on Noise Tool
    - [ ] Allow users to customize noise patterns
    - [ ] Save patterns for use in new worlds
    - [ ] Possibly add some procedural structure tools?
- [ ] Better chunk rendering performance
    - [X] Combine meshes in chunks (fewer draw calls = more performance)
    - [X] Reduce meshes (remove face that won't be seen)
    - [X] Remove faces from chunk edges that touch
    - [ ] Render meshes base on distance from main camera
        - [ ] Only regenerate modified chunks if it's within the view distance
- [ ] Better input system
    - [X] Keyboard input
    - [ ] Controler input?
    - [ ] Attempt virtual controller for touch devices
- [ ] Menu improvements
    - [ ] Pause Menu in-game
    - [ ] Animation suppoer
    - [ ] Graphic improvements
- [ ] Improved player movement
    - [ ] Running
    - [ ] Better velocity curves
    - [ ] Slopes & sliding?
- [ ] Basic networking
    - [X] Basic event system?
        - [X] Create communication layer to be used to send messages between the client(s) and brain
        - [X] Create the ability to trigger events in the Game object (i.e. add / remove / change block)
    - [ ] Send/Receive messages
        - [ ] New Players / Leaving Players
        - [ ] Movement
        - [X] Chunk changes
    - [ ] Networking for sending / receiving messages
    - [X] Work on generic messages for extendability?
- [ ] Clean & Orginize code
    - [ ] Try moving Babylon.js to only being a module import instead of an html script tag (getting ready for Babylon.js 5.0 in November and its [WebGPU support](https://doc.babylonjs.com/advanced_topics/webGPU))
    - [ ] Replace var & function comments with code-hint comments
        - look at `positionUtils.js` for examples
    - [ ] Start writing some more solid documentation