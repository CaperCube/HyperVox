# Tier 2

## Win conditions
Tier shaping needed...

# Tasks
- [ ] Better world gen (start putting this in './brain')
    - [ ] Pre generate world chunks & some meshes before game start
    - [ ] Live load chunk meshes from world data when close enough
    - [ ] Save / Load worlds (probably as a .json)
- [ ] More work on Noise Tool
    - [ ] Allow users to customize noise patterns
    - [ ] Save patterns for use in new worlds
    - [ ] Possibly add some procedural structure tools?
- [ ] Better chunk render performance
    - [X] Combine meshes in chunks (fewer draw calls = more performance)
    - [X] Reduce meshes (remove face that won't be seen)
    - [ ] Remove faces from chunk edges that touch
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
    - [ ] Basic event system?
        - [ ] Create communication layer to be used to send messages between the client(s) and brain
        - [ ] Create the ability to trigger events in the Game object (i.e. add / remove / change block)
    - [ ] Send/Receive players, movement, and chunk changes
    - [ ] Work on generic messages for extendability?
- [ ] Clean & Orginize code