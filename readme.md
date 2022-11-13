# About
This project is a multiplayer creative parkour game with sandbox, crafting, and action elements. The goal to aim for is generally a cross between Mirror's Edge (but snappier), Quake, and Minecraft.

Read more here:
[Game concept / description](docs/md/Concept.md)

Note:
I don't have a demo link up yet, I'll set up a goal to reach before then soon.

# Goals
- Fun, more than anything!
- Learning about procedural generation
- Easily moddable / extendable
- Yeah it's a game but utility in games makes them cooler!
- Cross platform so friends don't need to be left out (Thanks to the web)

## Tech
- Babylon.js (for rendering)
- Node.js (for server)
- Socket.io (for multiplayer)

## Dev Setup:
Here's some beginner / intermediate level instructions to get this bot up and running:

1. Install an ide (integrated development environment) (I like VSCode).
2. Install Node.js (v16 or newer) on your system.
3. Create a directory on your system and put the contents of the project here.
4. Open VSCode and use *File > Open Folder...* to open this folder.
5. Click *Terminal > New Terminal*.
6. Run the command `npm install` or `npm i` in the terminal to install the project's node packages.
7. Create a file called `.env` in the main directory (where `package.json` is located).
8. Edit this file and write `PORT = ` followed by your desired server port (`3000` works fine).
9. Type `npm run start` in the terminal, and hit enter to start the web server.
10. To run to the game, open a browser and type `http://localhost:3000/` in the address bar and hit enter.
11. To run to the noise tool, open a browser and type `http://localhost:3000/tools/noiseTool/` in the address bar and hit enter.
12. Close VSCode or click in the terminal and press `Ctrl + c` to stop the web server.

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
Contact me about contributing to this project. I do hope to work with more people once I can get some core mechanics in place.



# Temporary Notes
- Root dir entry point should just be in charge of serving the `client` to connected users
- The `server` entry point should be in charge of allowing connections and managing a network game. See [Connecting to a specific socket](https://stackoverflow.com/questions/52138337/socket-io-makes-multiple-connections-when-the-page-is-refreshed-node-js)

- Generate world data and send to player when the reach their world limit
- If no chunk data exists, fill area with a visual world border / "loading chunk" zone

## Other
- Weapons have different ammounts of recoil
