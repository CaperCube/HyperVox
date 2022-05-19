import TileRenderer from "../../../client/js/render2d/tileRenderer.js"
import MenuSystem from "../../../client/js/render2d/menu/menuSystem.js"
import HUDSystem from "../../../client/js/render2d/hudSystem.js"

////////////////////////////////////////////////////////
// UI systems setup
////////////////////////////////////////////////////////
const uiSystems = {
    tileRenderer: new TileRenderer($("#main-canvas")),
    menu: new MenuSystem($("#main-canvas")),
    hud: new HUDSystem($("#main-canvas"))
}

// Setup each drawing system
for (const [key, value] of Object.entries(uiSystems)) {
    uiSystems[key].setupGraphics({
        tileSheetPath: `../../../client/src/textures/ui_parts.png`,
        blockSheetPath: `../../../client/src/textures/textures.png`,
        fontPath: `../../../client/src/textures/fonts/`
    })
    uiSystems[key].hide()
}

////////////////////////////////////////////////////////
// DOM functions
////////////////////////////////////////////////////////
//$('#DOM_reset').onclick = () => { uiSystems[$("#DOM_uiList").value].render() }
$("#DOM_uiList").onchange = (e) => { uiSystems[e.target.value].show() }
populateDOMGenList()

function populateDOMGenList() {
    const dropList = $("#DOM_uiList")
    if (dropList) {
        // Get array of generator patterns
        const uiOptions = Object.keys(uiSystems)

        // Remove current options
        if (uiOptions.length > 0) {
            dropList.innerHTML = ''
        }

        // Create an option for each pattern
        for (let i = 0; i < uiOptions.length; i++) {
            const nameString = `${uiOptions[i]}`
            const newOption = document.createElement('option')
            newOption.value = nameString
            newOption.innerHTML = nameString

            dropList.appendChild(newOption)
        }
    }

    // Show the selected option
    uiSystems[$("#DOM_uiList").value].show()
}

////////////////////////////////////////////////////////
// Drawing
////////////////////////////////////////////////////////
//...