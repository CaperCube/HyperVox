import ClientGame from "./clientGame.js"

import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js"
let serverURL = ""//"http://71.195.32.253:3000"//"http://localhost:3000"
let socket = io(serverURL)

socket.on(`welcomePacket`, (data) => {
    console.log(`Hey, you're cool!`)
    console.log(data)
})

socket.on( 'genericClientMessage', ( data ) => {
    const playerId = 0//socket.connectionID // This does not support multiple players per client in networked games
    clientGame.clientComs.brainMessages[data.type]( data.args, playerId )
})

/*
When making a single player game:

const brain = new Game({ worldSetting: settings })
const clientGame = new ClientGame({ connection: comLayer })
const comLayer = new CommunicationLayer({ type: `offline`, host: brain, client: clientGame })

When making a multiplayer game:

const clientGame = new ClientGame({ connection: comLayer })
const comLayer = new CommunicationLayer({ type: `online`, host: `ip`, client: clientGame })
*/

const canvas = $('#main-canvas')

// `isNetworked: false` automatically creates a `new BrainGame()` inside the ClientGame object
// const clientGame = new ClientGame({ isNetworked: false, canvas: canvas })
const clientGame = new ClientGame({ isNetworked: true, canvas: canvas })
clientGame.clientComs.network = socket


// Start game scene
// clientGame.clientComs.createNewWorld()
const createWorldWithSize = (size) => {
    clientGame.menu.hide()
    if ($('#loading-basic')) $('#loading-basic').style.display = 'inline-block' // ToDo: replace this with a more robust loading indicator
    setTimeout(() => { clientGame.clientComs.createNewWorld(size) }, 100)
}

// ToDo: replace this with a better save-load system
const tempSaveWorld = (world) => {
    world.saveVersion = '0.1'
    let element = document.createElement('a')
    element.setAttribute( 'href', 'data:text/plain;charset=utf-8,' + encodeURIComponent( JSON.stringify( world ) ) )
    element.setAttribute( 'download', 'level.json' )
  
    element.style.display = 'none'
    document.body.appendChild(element)
  
    element.click()
  
    document.body.removeChild(element)
}

function browseForWorldFile() {
    // <input type="file" id="myfile" name="myfile"></input>
    let fileBrowser = document.createElement('input')
    fileBrowser.setAttribute( 'type', 'file' )
    fileBrowser.style.display = 'none'

    // Once file is selected...
    function onChange(event) {
        const reader = new FileReader()
        reader.onload = onReaderLoad
        reader.readAsText(event.target.files[0])
    }

    // Read the file...
    function onReaderLoad(event){
        // console.log(event.target.result)
        const obj = JSON.parse(event.target.result)
        console.log(obj)

        // Send client message to brain to create a new world from json
        clientGame.clientComs.loadWorld(obj)
        clientGame.menu.hide()
    }
 
    fileBrowser.addEventListener('change', onChange)

    document.body.appendChild(fileBrowser)

    fileBrowser.click()
}

clientGame.menu.playMenu.elements[clientGame.menu.playMenu.elements.length-4].pressButton = () => { createWorldWithSize(5) }
clientGame.menu.playMenu.elements[clientGame.menu.playMenu.elements.length-3].pressButton = () => { createWorldWithSize(10) }
clientGame.menu.playMenu.elements[clientGame.menu.playMenu.elements.length-2].pressButton = () => { createWorldWithSize(16) }
clientGame.menu.playMenu.elements[clientGame.menu.playMenu.elements.length-5].pressButton = () => { browseForWorldFile() }
clientGame.menu.pauseMenu.elements[3].pressButton = () => { tempSaveWorld(clientGame.clientWorld) }