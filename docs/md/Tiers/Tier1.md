# Tier 1

## Win conditions
For this tier to be considered complete, it must demonstrate baisc rendering and creative capabilities.

# Tasks
- [X] Basic rendering
    1. - [X] render some cubes and lighting
    2. - [X] Switch to Babylon.js (they have colission detection)
    3. - [X] texture loading (probably use a texture atlas)
    4. - [X] store / render different blocks in a 3D array
- [ ] Basic player movement
    1. - [X] Get basic input from player
    2. - [ ] Move player with velocity (jumping too)
    3. - [ ] Basic collision with blocks
- [ ] Basic place / break blocks
    - [ ] Updating chunks
        - Check difference between `chunk` and `updatedChunk`
        - Remove faces from existing chunkMesh in the location of the change (if location already had a block)
        - Add new faces to this area
        - Merge faces into chunkMesh
- [ ] Basic game menu
    - [ ] `New Game`
    - [ ] Placeholder `Settings`
    - [ ] Simple loading screen (for preloading assets & world gen)
- [ ] Clean & Orginize code