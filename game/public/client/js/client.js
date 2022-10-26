import ClientGame from "./clientGame.js"

////////////////////////////////////////////////////////////
// Canvas & Game init
////////////////////////////////////////////////////////////
const canvas = $('#main-canvas')
const clientGame = new ClientGame({ isNetworked: false, canvas: canvas })

// ToDo: Put these somewhere else
Buttons.m.onPress = () => { launchFullscreen() }
Buttons.escape.onPress = () => { quitFullscreen() }

////////////////////////////////////////////////////////////
// Menu function connections
////////////////////////////////////////////////////////////

// Create new world
const createWorldWithSize = (size) => {
    clientGame.menu.hide()
    if ($('#loading-basic')) $('#loading-basic').style.display = 'inline-block' // ToDo: replace this with a more robust loading indicator
    setTimeout(() => { clientGame.clientComs.createNewWorld(size) }, 100)
}

// Load world from file
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
function connectToCustomServer() {
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

// Main menu
clientGame.menu.mainMenu.selectableElements[1].pressButton = () => { connectToCustomServer() }

// Play menu
clientGame.menu.playMenu.selectableElements[0].pressButton = () => { browseForWorldFile() }
clientGame.menu.playMenu.selectableElements[1].pressButton = () => { createWorldWithSize(5) }
clientGame.menu.playMenu.selectableElements[2].pressButton = () => { createWorldWithSize(10) }
clientGame.menu.playMenu.selectableElements[3].pressButton = () => { createWorldWithSize(16) }

// Pause menu
clientGame.menu.pauseMenu.selectableElements[1].pressButton = () => { clientGame.saveWorld('world.json') }
clientGame.menu.pauseMenu.selectableElements[2].pressButton = () => { clientGame.goOffline() }
clientGame.menu.pauseMenu.selectableElements[5].pressButton = () => { clientGame.exportWorldMesh() }

clientGame.menu.pauseMenu.selectableElements[0].pressButton = () => {
    clientGame.menu.hide()
    setTimeout(()=>{
        clientGame.lockCursor()
    }, 100)
}