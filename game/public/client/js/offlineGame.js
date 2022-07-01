import ClientGame from "./clientGame.js"

// import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js"
// let serverURL = ""//"http://71.195.32.253:3000"//"http://localhost:3000"
// let socket = io(serverURL)

// socket.on(`welcomePacket`, (data) => {
//     console.log(`Welcome new player!`)
//     console.log(data)

//     clientGame.clientID = data.clientID
// })

// socket.on( 'genericClientMessage', ( data ) => {
//     const playerId = 0//socket.connectionID // This does not support multiple players per client in networked games
//     clientGame.clientComs.brainMessages[data.type]( data.args, playerId )
// })

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
const clientGame = new ClientGame({ isNetworked: false, canvas: canvas })
// const clientGame = new ClientGame({ isNetworked: true, canvas: canvas })
// clientGame.clientComs.network = socket

Buttons.m.onPress = () => { launchFullscreen() }
Buttons.escape.onPress = () => { quitFullscreen() }

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

// Main menu
function connectToCustom() {
    $("#focus-input-title").innerHTML = 'Server IP'
    $("#focus-input-text").value = ''

    // Turn on
    $("#focus-input").style.display = 'inline-block'

    // Assign submit function
    $("#focus-input").onsubmit = (e) => { 
        e.preventDefault()
        clientGame.connectToNetworkGame($("#focus-input-text").value)
        $("#focus-input-text").value = ''
        $("#focus-input").style.display = 'none'
    }
}
clientGame.menu.mainMenu.selectableElements[1].pressButton = () => { connectToCustom() }

// Play menu
clientGame.menu.playMenu.selectableElements[0].pressButton = () => { browseForWorldFile() }
clientGame.menu.playMenu.selectableElements[1].pressButton = () => { createWorldWithSize(5) }
clientGame.menu.playMenu.selectableElements[2].pressButton = () => { createWorldWithSize(10) }
clientGame.menu.playMenu.selectableElements[3].pressButton = () => { createWorldWithSize(16) }

// Pause menu
clientGame.menu.pauseMenu.selectableElements[1].pressButton = () => { tempSaveWorld(clientGame.clientWorld) }
clientGame.menu.pauseMenu.selectableElements[2].pressButton = () => { clientGame.goOffline() }
clientGame.menu.pauseMenu.selectableElements[5].pressButton = () => { clientGame.exportWorldMesh() }

clientGame.menu.pauseMenu.selectableElements[0].pressButton = () => {
    clientGame.menu.hide()
    setTimeout(()=>{
        clientGame.canvas.requestPointerLock = clientGame.canvas.requestPointerLock || clientGame.canvas.mozRequestPointerLock
        clientGame.canvas.requestPointerLock()
        Buttons.isInputFocused = true
    }, 100)
}