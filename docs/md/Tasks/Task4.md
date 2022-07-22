# Task 4

## Win conditions
Task shaping needed...
The below tasks may need to be spread across future task to prevent a progress hault:

- Better movement (real direction-based movement, with b-hopping and stuff)
- Improved collision code (no falling through world if the game lags)
- Better font options
- Improved Menu UI
- More efficient rendering / loading
    - Remove double-sided faces and generate meshes as real quads with UV coordinates

# Sub-Tasks
- [ ] Better input system
    - [ ] All inupt devices should be configured to the `Controls` array
    - [X] Keyboard input
    - [ ] Controler input
    - [ ] Attempt virtual controller for touch devices
- [ ] Improved Movement
    - [ ] Running
    - [ ] Lowered air-friction
    - [ ] B-hopping
- [ ] Improved Collision
    - [ ] Custom rect sizes
    - [ ] Stairs (player is "floating" above ground with a damped spring force)
    - [ ] Server-sied collision detection (for projectiles and such)
- [ ] Better chunk performance
    - [ ] Render meshes base on distance from main camera (toggle chunk visibility?)
    - [ ] Only regen chunk portions instead of entire chunk
- [ ] Menu improvements
    - [ ] Improved UI
    - [ ] Show connected players in menu (if online)
    - [ ] Animation support
    - [ ] Text improvements
        - [ ] Custom color
        - [ ] Outline + color option

# Clean-up Sub-Tasks
- [ ] ...

# Bonus Sub-Tasks
- [ ] ...