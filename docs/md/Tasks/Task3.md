# Task 3

## Win conditions
This task should fix some useability issues and bugs, but more importantly it should add and enhance features that enable easier and more fun content creation.

# Sub-Tasks
- [ ] Chat improvements
    - [ ] Whisper feature
    - [ ] Server-side option to filter html / js code out of user messages
        - [ ] Chat command to toggle this (Admin only)
    - [X] chat BG disapears when mouse is locked
    - [X] **Add / Remove blocks with chat command**
    - [X] **"Set world spawn" chat command (admins only)**
        - This should set the spawn on the server world
    - [X] Chat command to clear all player scores
    - [ ] tp command
    - [ ] tpall command
- [ ] Spectator game mode
    - [ ] Turns off HUD
    - [ ] Tunrs off block cursor visibility
    - [ ] Cannot edit blocks
    - [ ] Invisible to others
    - [ ] Flying only
- [ ] [Player Improvements](./PlayerOverhaul.md)
    - [X] Better hurt animation for network players
    - [X] Basic Shooting animation
    - [X] Scoreboard / player list
    - [ ] Player should seperated from avatar
    - [ ] [Improved Movement](./MovementOverhaul.md)
        - [ ] Running
        - [ ] Lowered air-friction
        - [ ] B-hopping
- [ ] Screenshot mode
    - [ ] Easily take screenshots of worlds
- [ ] World improvements
    - [ ] When saving worlds locally, we should request the brain's version of the world to save
    - [ ] Show title (& link if present) when cursor hovering over interactable blocks
    - [ ] Change file extention to ".ccw" (Caper Core World)
    - [ ] **Block to send chats as player**
    - [ ] **Add Zones (perform check on server)**
        - [ ] **Trigger zone (code and/or sound or resource link sound)**
        - [ ] Game mode zone    
    - [ ] **Chain worlds**
        - [ ] **Add interactable world chain block**
        - [X] Option to generate new world
        - [X] Option to load existing world via URL
    - [ ] **Custom block models**
        - [ ] Custom world-specific blocks
            - [ ] "Import .ccm" button in WorldTool
        - [ ] Block modeling tool?
            - First-person mesh building
            - No world, instead use an array of quads
            - Inventory contains mesh tools
                - Place Quad
                - Remove Quad
                - Edit UV
                - Edit Quad
            - Direction of view designates the quad's orientation
            - [ ] Drawing with UV quads
            - [ ] Saves as JSON ".ccm"
            - [ ] Includes data for mesh type
                - meshData: {...}
                    - quads: {...}
                        - quad: {...}
                            - position: { x, y, z } // 0 = min, 1 = max
                            - facing: 'top' // designates the quad normal and orientation
                            - uvOffset: { x: 0.03125, y: 0 }
                            - uvRotation: 0 // 0, 1, 2, or 3 representing 90* rotations
                - type: 'block'
                    - name: 'chair'
                    - categories: ['brown', 'decorative']
                - type: 'avatar'
- [ ] Skybox editor
- [ ] More work on Noise Tool (Rename to World Tool)
    - [ ] Allow users to customize noise patterns
    - [ ] Save patterns for use in new worlds
    - [ ] Possibly add some procedural structure tools?
- [ ] Item & gun improvements
    - [ ] Ammo does things now
    - [ ] Item pick-ups
    - [ ] Guns can use projectiles or hitscan
        - projectiles should have a spawn timestamp that the server will fast forward to its (the server's) current time and recalculate the projectile's position to attempt to compensate for lag.
    - [ ] Item icons should be buffered in 3D (at load-in time)
- [ ] Server improvements
    - [X] Gamemode updates and scores
    - [ ] Player health should be authored by brain
    - [X] Server has an update rate
        - This should only happen for entities that the server updates on it's own
        - World updates should still happen as soon as their validated
    - [ ] Lag compensation (There may be a better system than this, this just seemed simple)
        [Lag Comp. Doc](../LagCompensation.md)

# Clean-up Sub-Tasks
- [ ] Try moving Babylon.js to only being a module import instead of an html script tag (getting ready for Babylon.js 5.0 in November and its [WebGPU support](https://doc.babylonjs.com/advanced_topics/webGPU))
- [ ] Replace var & function comments with code-hint comments
    - look at `commonUtils.js` for examples
- [ ] Start writing some more solid documentation
    - Write using Markdown
    - Use [this NPM package](https://www.npmjs.com/package/markdown-to-html-converter)
- [ ] Consider creating a custom `PatternGenerator` class with various seeded 3D noise generators
    - [Perlin noise tutorial](https://joeiddon.github.io/projects/javascript/perlin.html)
    - [Helpful article on seeded random](https://davidbau.com/archives/2010/01/30/random_seeds_coded_hints_and_quintillions.html)

# Bonus Sub-Tasks
- [ ] ...