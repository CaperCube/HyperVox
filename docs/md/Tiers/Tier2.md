# Tier 2

## Win conditions
Tier shaping needed...

# Tasks
- [ ] Better world gen (start putting this in './brain')
    - [ ] Pregen world chunks + meshes before game start
    - [ ] Save / Load worlds (probably as a .json)
- [X] Better chunk render performance
    - [X] Combine meshes in chunks (fewer draw calls = more performance)
    - [X] Reduce meshes (remove face that won't be seen)
- [ ] Better input system
    - [ ] Keyboard input
    - [ ] Controler input?
    - [ ] Attempt virtual controller for touch devices