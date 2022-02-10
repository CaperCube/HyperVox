# About
This project is a creative parkour game with sandbox, crafting, and action elements.

## Note
All Topics listed here unless otherwise stated are subject to change

## Basic Idea
?

## Tech
- Three.js (for rendering)
- Node.js (for server)
- Socket.io (for multiplayer)

## Doc links
For all:
- [Project roadmap](docs/md/Roadmap.md)
- [Game concept / description](docs/md/Concept.md)
- [ScreenShots & media](social/)

For devs:
- [Information for contributors](docs/md/Contribution.md)
- [Dev, Hosting, and Modding info](docs/md/Setup.md)
- [Game ideas](docs/md/Ideas.md)
- [Research needed or completed](docs/md/Research.md)

# Community / Contact
Public Discord link eventually?

# Contributing
Contact me about contributing to this project.



# Temporary Notes
- Root dir entry point should just be in charge of serving the `client` to connected users
- The `server` entry point should be in charge of allowing connections and managing a network game. See [Connecting to a specific socket](https://stackoverflow.com/questions/52138337/socket-io-makes-multiple-connections-when-the-page-is-refreshed-node-js)
- Singleplayer and multiplayer games should both "connect" to a GameManager
    - Singleplayer clients talk directly to the GameManager
    - Multiplayer clients talk to server which talks to the GameManager
    - Using this method, servers should not need many changes if any to support new features in multiplayer

- [X] Is there a Three.js camera frustum culling?
    - Yes, it is the default camera setting
- [ ] Scale tiles down to 1 unit
- [ ] Basic first-person camera controls

- Generate world data and send to player when the reach their world limit
- If no chunk data exists, fill area with a visual world border / "loading chunk" zone

## Psudo Code:
```js
generateChunkMesh() { ... }         // Use this to generate a mesh from chunk data
let worldChunks = [[[ chunk ]]]     // Locally stored chunk data for the whole world
let chunk = [[[ blockID ]]]         // Block ID data for the 16x16x16 chunk
let chunkMeshs = [[[chunkMesh]]]    // 
let chunkMeshMemoryRadius = 5       // The area around the player in which chunk mesh's will be stored / rendered
```