# Task 3

## Win conditions
This task should fix some useability issues and bugs, but more importantly it should add and enhance features that enable easier and more fun content creation.

# Sub-Tasks
- [ ] Chat improvements
    - [ ] Whisper feature
    - [ ] Server-side option to filter html / js code out of user messages
        - [ ] Chat command to toggle this (Admin only)
    - [X] chat BG disapears when mouse is locked
- [ ] Spectator game mode
    - [ ] Turns off HUD
    - [ ] tunrs off block cursor visibility
    - [ ] Cannot edit blocks
    - [ ] flying only
- [ ] [Improved Movement](./MovementOverhaul.md)
    - [ ] Running
    - [ ] Lowered air-friction
    - [ ] B-hopping
- [ ] Screenshot mode
    - [ ] Easily take screenshots of worlds
- [ ] World improvements
    - [ ] Show title (& link if present) when cursor hovering over interactable blocks
    - [ ] Change file extention to ".ccw" (Caper Core World)
    - [ ] Chain worlds
        - [ ] Add interactable world chain block
        - [ ] Option to generate new world
        - [ ] Option to load existing world via URL
    - [ ] Custom world-specific blocks
    - [ ] "Set world spawn" chat command (admins only)
        - This should set the spawn on the server world
        - When saving worlds locally, we should request the brain's version of the world to save
- [ ] Block modeling tool
    - [ ] Drawing with UV quads
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
    - [ ] Player health should be authored by brain
    - [ ] Server has an update rate
        - This should only happen for entities that the server updates on it's own
        - World updates should still happen as soon as their validated
    - [ ] Lag compensation (There may be a better system than this, this just seemed simple)
        [Lag Comp. Doc](../LagCompensation.md)

# Clean-up Sub-Tasks
- [ ] Try moving Babylon.js to only being a module import instead of an html script tag (getting ready for Babylon.js 5.0 in November and its [WebGPU support](https://doc.babylonjs.com/advanced_topics/webGPU))
- [ ] Replace var & function comments with code-hint comments
    - look at `commonUtils.js` for examples

# Bonus Sub-Tasks
- [ ] ...