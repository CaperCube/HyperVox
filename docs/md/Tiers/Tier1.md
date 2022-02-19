# Tier 1

## Win conditions
For this tier to be considered complete, it must demonstrate baisc rendering and creative capabilities.

# Tasks
- [X] Basic rendering
    - [X] render some cubes and lighting
    - [X] Switch to Babylon.js (they have colission detection)
    - [X] texture loading (probably use a texture atlas)
    - [X] store / render different blocks in a 3D array
- [ ] Basic player movement
    - [X] Get basic input from player
    - [X] Basic spectating movement
    - [ ] Move player with velocity (jumping too)
    - [ ] Basic collision with blocks
- [ ] Basic place / break blocks
    - [ ] Raycasting for selection block placement / blocks to destroy
    - [ ] Updating chunks (send to brain to update the chunk)
        - Check difference between `chunk` and `updatedChunk`
        - Remove faces from existing chunkMesh in the location of the change (if location already had a block)
        - Add new faces to this area
        - Merge faces into chunkMesh
- [ ] Basic game menu
    - [ ] `New Game`
    - [ ] Placeholder `Settings`
    - [ ] Simple loading screen (for preloading assets & world gen)
- [ ] Clean & Orginize code
    - [ ] Use `<script type="module">` and `import Thing from './location/thing.js'`, This will avoid script tag bloat in the html