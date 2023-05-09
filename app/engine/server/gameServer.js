////////////////////////////////////////
//////////////// About /////////////////
// This entry point is the dedicated
// multiplayer server for the game.
////////////////////////////////////////
import { Server } from "socket.io";
export default class GameServer {
    constructor(httpServer, adminPassword = "admin") {
        // Create socket listener for server
        const io = new Server(httpServer, {
            // maxHttpBufferSize: 1e10, // This is how to change the client message size limit
            cors: {
                origin: `*`,
                methods: ["GET", "POST"],
            },
            allowEIO3: true,
        });
        this.socket = io.sockets;
        console.log('Created a new game server');
    }
}
//# sourceMappingURL=gameServer.js.map