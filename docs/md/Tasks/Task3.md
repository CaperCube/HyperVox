# Task 3

## Win conditions
This task should fix some useability issues and bugs, but more importantly it should add and enhance features that enable easier and more fun content creation.

# Sub-Tasks
- [X] Show connected players in menu (if online)
- [ ] Chat improvements
    - [ ] Whisper feature
    - [ ] Server-side option to filter html / js code out of user messages
        - [ ] Chat command to toggle this (Admin only)
    - [X] chat BG disapears when mouse is locked
    - [X] **Add / Remove blocks with chat command**
    - [X] **"Set world spawn" chat command (admins only)**
        - This should set the spawn on the server world
    - [X] Chat command to clear all player scores
    - [X] tp command
        - [X] tp all command
- [X] Spectator game mode
    - [ ] Turns off HUD
    - [ ] Tunrs off block cursor visibility
    - [X] Cannot edit blocks
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
- [ ] World improvements
    - [ ] When saving worlds locally, we should request the brain's version of the world to save
    - [X] Show title (& link if present) when cursor hovering over interactable blocks
    - [ ] Change file extention to ".ccw" (Caper Core World)
    - [X] **Block to send chats as player**
    - [ ] **Add Zones (perform check on server)**
        - [ ] **Trigger zone (code and/or sound or resource link sound)**
            - Probably just use a chat message for trigger zone
            - Can change game mode if using chat messages
    - [X] **Chain worlds**
        - [X] **Add interactable world chain block**
        - [X] Option to generate new world
        - [X] Option to load existing world via world name (grabs from server / local folder)
- [X] Better chunking
    - [X] Render meshes base on distance from main camera
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