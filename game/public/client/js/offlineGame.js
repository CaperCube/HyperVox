import ClientGame from "./clientGame.js"

// `isNetworked: false` automatically creates a `new BrainGame()` inside the ClientGame object
const clientGame = new ClientGame({ isNetworked: false })

// Use this to connect to a networked game:
//clientGame.clientComs.connectToNetworkedGame('localhost:3000')