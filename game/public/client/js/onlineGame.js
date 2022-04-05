import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js"
let serverURL = "http://localhost:3000"
let socket = io(serverURL)

socket.on(`welcomePacket`, (data) => {
    console.log(`Hey, you're cool!`)
    console.log(data)
})