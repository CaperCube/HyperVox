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
- [X] Basic place / break blocks
    - [X] Raycasting for selection block placement / blocks to destroy
    - [X] Updating chunks (send to brain to update the chunk)
        - [X] Fill in some basic brain behavior to allow the creation of a world & game from the client
        - [X] Move mesh gen logic to client
        - [X] ~~Follow this procedure:~~
            - ~~Check difference between `chunk` and `updatedChunk`~~
            - ~~Remove faces from existing chunkMesh in the location of the change (if location already had a block)~~
            - ~~Add new faces to this area~~
            - ~~Merge faces into chunkMesh~~
        **Note:** The above procedure has been changed for simplicity's sake to the following:
        - [X] Follow this procedure:
            - Check which chunk in `clientGame.clientWorld` has changed
            - Start a web-worker to re-generate this chunk mesh (and any effected neighboring chunk meshes)
            - Delete the old chunk mesh(es)
    - [X] Create crosshair
- [X] Basic game menu
    - [X] Add seperate canvas for menus that disables / enables
    - [X] `New Game`
    - [X] Placeholder `Settings`
    - [X] Simple loading screen (for preloading assets & world gen)
- [X] Clean & Orginize code
    - [X] Use `<script type="module">` and `import Thing from './location/thing.js'`, This will avoid script tag bloat in the html
    - [X] Change objects to Class structure