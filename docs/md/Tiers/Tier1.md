# Tier 1

## Win conditions
For this tier to be considered complete, it must demonstrate baisc rendering and creative capabilities.

# Tasks
- [X] Basic rendering
    - [X] render some cubes and lighting
    - [X] Switch to Babylon.js (they have colission detection)
    - [X] texture loading (probably use a texture atlas)
    - [X] store / render different blocks in a 3D array
- [X] Basic player movement
    - [X] Get basic input from player
    - [X] Basic spectating movement
    - [X] Move player with velocity (jumping too)
    - [X] Basic collision with blocks
- [ ] Basic place / break blocks
    - [X] Raycasting for selection block placement / blocks to destroy
    - [ ] Updating chunks (send to brain to update the chunk)
        - [X] Fill in some basic brain behavior to allow the creation of a world & game from the client
        - [ ] Move mesh gen logic to client
        - [ ] Follow this procedure:
            - Check difference between `chunk` and `updatedChunk`
            - Remove faces from existing chunkMesh in the location of the change (if location already had a block)
            - Add new faces to this area
            - Merge faces into chunkMesh
    - [ ] Create crosshair
- [ ] Basic game menu
    - [ ] `New Game`
    - [ ] Placeholder `Settings`
    - [ ] Simple loading screen (for preloading assets & world gen)
- [ ] Clean & Orginize code
    - [ ] Use `<script type="module">` and `import Thing from './location/thing.js'`, This will avoid script tag bloat in the html
    - [ ] Change objects to Class structure
        - [ ] Consider creating a custom `PatternGenerator` class with various seeded 3D noise generators
            - [Perlin noise tutorial](https://joeiddon.github.io/projects/javascript/perlin.html)
            - [Helpful article on seeded random](https://davidbau.com/archives/2010/01/30/random_seeds_coded_hints_and_quintillions.html)