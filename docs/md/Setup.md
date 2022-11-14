# About
Here is where you can find info about setting up a dev environment, creating a server, or modding the game

# Environment Setup / Hosting a Game
The steps to setup the environment for development and to host a multiplayer game are the same and are fairly simple.

### Note on hosting:
> If you're hosting on your own computer, you'll need to port-forward (default is port 3000) and other players will need your IP address to join. If you don't already know, be careful with who you give your IP to if you care about doxing.

Here's some beginner / intermediate level instructions to get a server up and running:
Once you've done steps `1 - 8`, you'll only need steps `8 - 11` to host again.

1. Install an ide (integrated development environment) (I like VSCode).
2. Install Node.js (v16 or newer) on your system.
3. Create a directory on your system and put the contents of the project here.
4. Open VSCode and use *File > Open Folder...* to open this folder.
5. Click *Terminal > New Terminal*.
6. Run the command `npm install` or `npm i` in the terminal to install the project's node packages.
7. Create a file called `.env` in the main directory (where `package.json` is located).
8. Edit this file and write `PORT = ` followed by your desired server port (`3000` works fine).
9. Type `npm run start` in the terminal, and hit enter to start the web server.
10. To run to the game, open a browser and type `http://localhost:3000/` (or your IP followed by `:3000`) in the address bar and hit enter.
11. Close VSCode or click in the terminal and press `Ctrl + c` to stop the web server.
