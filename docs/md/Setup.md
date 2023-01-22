# About
Here is where you can find info about setting up a dev environment, creating a server, or modding the game

# Environment Setup / Hosting a Game
The steps to setup the environment for development and to host a multiplayer game are the same and are fairly simple.

### Note on hosting:
> If you're hosting on your own computer, you'll need to port-forward (default is port 3000) and other players will need your IP address to join. If you don't already know, be careful with who you give your IP to if you care about doxing.

Here's some beginner / intermediate level instructions to get a server up and running:
Once you've done steps `1 - 8`, you'll only need steps `9 - 11` to host again.

1. Install an ide (integrated development environment) (I like [VSCode](https://code.visualstudio.com/download)).
2. Install [Node.js](https://nodejs.org/en/download/) (v16 or newer) on your system.
3. Create a directory on your system and put the [contents of the project](https://github.com/CaperCube/CaperCore/archive/refs/heads/master.zip) there. (If you download the project with this link, make sure you unzip it in this folder)
4. Open VSCode and use *File > Open Folder...* to open this folder.
5. Click *Terminal > New Terminal*.
6. Run the command `npm install` or `npm i` in the terminal to install the project's node packages.
7. Create a file called `.env` in the main directory (where `package.json` is located).
8. Edit this file and write `PORT = ` followed by your desired server port (`3000` works fine).
9. Type `npm run start` in the terminal, and hit enter to start the web server.
10. To run to the game, open a browser and type `http://localhost:3000/` (or your IP followed by `:3000`) in the address bar and hit enter.
11. Close VSCode or click in the terminal and press `Ctrl + c` to stop the web server.


# How to host a HTTPS server (Ignore this for now)

To host an HTTPS server in Node.js, you will need to have a SSL certificate. You can easily create a self-signed certificate using the openssl command-line tool. Here's how you can create a self-signed SSL certificate and use it to host an HTTPS server in Node.js:

- Install the openssl tool if you don't already have it installed on your system.

- Use the openssl tool to generate a private key and a self-signed SSL certificate. You can do this by running the following command:

```sh
openssl req -nodes -new -x509 -keyout server.key -out server.cert
```

- Next, create a Node.js file that contains the code for your HTTPS server. Here's an example of a simple HTTPS server that listens on port 443 and returns a "Hello World" message:

```javascript
const https = require('https');
const fs = require('fs');

https.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
}, (req, res) => {
  res.writeHead(200);
  res.end('Hello World\n');
}).listen(443);
```

- Save the file and run it using the node command. For example, if you save the file as server.js, you can run it with the following command:

```sh
node server.js
```

- Your HTTPS server will now be running on your local machine and listening on port 443. You can access it in a web browser using the URL `https://localhost`.

> Note: Because you're using a self-signed certificate, you may need to add an exception in your web browser to allow it to connect to your server. Most web browsers will display a warning message when you try to connect to an HTTPS server with a self-signed certificate, so you'll need to explicitly tell the browser to trust the certificate in order to proceed.
