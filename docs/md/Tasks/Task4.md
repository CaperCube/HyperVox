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
    - Look into [Babylon.js's input system](https://doc.babylonjs.com/divingDeeper/input)
    - [ ] All inupt devices should be configured to the `Controls` array
    - [X] Keyboard input
    - [ ] Controler input
    - [ ] Attempt virtual controller for touch devices
- [ ] Improved Collision
    - [ ] Custom rect sizes
    - [ ] Stairs (player is "floating" above ground with a damped spring force)
    - [ ] Server-sied collision detection (for projectiles and such)
- [ ] Menu improvements
    - [ ] Improved UI
    - [ ] Animation support
    - [ ] Text improvements
        - [ ] Custom color
        - [ ] Outline + color option
        - [ ] Menu improvements
    - [ ] Notifications
        - [ ] Visible critical errors
            - [ ] Browser incompatable
            - [ ] Lost connection
        - [ ] Connection successful
            - [ ] Show `Start Game` menu after joining if no game is started

# Clean-up Sub-Tasks
- [ ] ...

# Bonus Sub-Tasks
- [ ] ...