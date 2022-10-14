import { staticImageSRC } from "../../../client/js/resources.js"//"/client/js/resources.js"
import ChunkGenerator from "../../../brain/gen/world/chunkGen.js"//"/brain/gen/world/chunkGen.js"
import { blockTypes } from "../../../common/blockSystem.js"
import World from "../../../brain/gen/world/world.js"
import { getGlobalPos } from "../../../common/positionUtils.js"

// Canvas vars
const canvas = $('#main-canvas')
const ctx = canvas.getContext('2d')
canvas.width = canvas.height = 512

// Texture sheet vars
const textureSheet = new Image(512,512)
textureSheet.onload = () => { 
    DOMNoiseFnc()
}
textureSheet.src = staticImageSRC.Tiles

// Temp canvas vars
const canvasTemp = $('#temp-canvas')
const ctxTemp = canvasTemp.getContext('2d')
canvasTemp.width = canvasTemp.height = canvas.width

// Noise vars
const generator = new ChunkGenerator()
let chunkSize = 8
let worldSize = 4
let desiredPixelSize = 8
let _resolution = (chunkSize * worldSize)
let pixelSize = canvas.width/_resolution
let steps2D = 3
let world = [[[]]] // ToDo: change to an actual world object
let worldSpawn = {
    chunk: { x: 0, y: 0, z: 0 },
    block: { x: 0, y: 0, z: 0 }
}
let blockData = {}

// Editor vars
let tempLayer = [[]]
for (let y = 0; y < (worldSize*chunkSize); y++) { tempLayer[y] = []; for (let x = 0; x < (worldSize*chunkSize); x++) { tempLayer[y][x] = 0 }}

let viewDirection = 2 // 0 = X, 1 = Y, 2 = Z
let selectedBlock = blockTypes[0]
const tools = {
    pencil: 'pencil',
    // eraser: 'eraser',
    rect: 'rect',
    filledRect: 'filledrect',
    edit: 'edit',
}
let editorTool = tools.pencil // The tool to use now
let altAction = false // when using RMB with a tool

// mouse vars
const getWorldPos = (pos, normalize = true) => {
    let x = pos.x
    let y = pos.y

    if (normalize) {
        const cellSize = canvas.clientWidth/_resolution
        x = Math.floor((pos.x) / cellSize)
        y = Math.floor((pos.y) / cellSize)
    }

    let xChunk = Math.floor(x/chunkSize)
    xChunk = (xChunk >= worldSize)? worldSize-1 : xChunk
    let yChunk = Math.floor(y/chunkSize)
    yChunk = (yChunk >= worldSize)? worldSize-1 : yChunk
    const chunk = { x: xChunk, y: yChunk}
    const block = { x: (x % chunkSize), y: (y % chunkSize) } 

    return { chunk: chunk, block: block } 
}
let mouseGridStart = {x: 0, y: 0}
let mouseGridPos = {x: 0, y: 0}
let mouseWolrdPos = getWorldPos({ x: 0, y: 0 })
let pointerDown = false
let altHeld = false

////////////////////////////////////////////////////////
// DOM function
////////////////////////////////////////////////////////
$("#DOM_generateBttn").onclick = DOMNoiseFnc
$("#DOM_xaxis").onclick = () => { updateViewDirection(0) }
$("#DOM_Yaxis").onclick = () => { updateViewDirection(1) }
$("#DOM_Zaxis").onclick = () => { updateViewDirection(2) }
$("#DOM_depthslider").oninput = () => { updateDepth($("#DOM_depthslider")) }
// $("#DOM_genList").onchange = () => { DOMNoiseFnc() }
$("#DOM_blocklist").onchange = () => { selectedBlock = blockTypes.filter(b=>b.name === $("#DOM_blockList").value)[0]; console.log(selectedBlock) }
$("#DOM_loadWorld").onclick = () => { browseForWorldFile() }
$("#DOM_saveWorld").onclick = () => { saveWorld(world) }
$("#DOM_pencilbtn").onclick = () => { setEditorTool(tools.pencil) }
$("#DOM_rectbtn").onclick = () => { setEditorTool(tools.rect) }
$("#DOM_editbtn").onclick = () => { setEditorTool(tools.edit) }
$("#DOM_filledrectbtn").onclick = () => { setEditorTool(tools.filledRect) }

// Defaults
populateDOMList($("#DOM_genList"), Object.keys(generator.noisePatterns))
populateDOMBlockList($("#DOM_blockList"), blockTypes)
setEditorTool(tools.pencil)
updateViewDirection(2)

function populateDOMList(dropList, itemArray) {
    if (dropList) {
        // Get array of generator patterns
        const listOptions = itemArray

        // Remove current options
        if (listOptions.length > 0) {
            dropList.innerHTML = ''
        }

        // Create an option for each pattern
        for (let i = 0; i < listOptions.length; i++) {
            const nameString = `${listOptions[i]}`
            const newOption = document.createElement('option')
            newOption.value = nameString
            newOption.innerHTML = nameString

            dropList.appendChild(newOption)
        }
    }
}

function populateDOMBlockList(dropList, itemArray) {
    if (dropList) {
        // Get array of generator patterns
        const listOptions = itemArray

        // Remove current options
        if (listOptions.length > 0) {
            dropList.innerHTML = ''
        }

        // Create an option for each pattern
        for (let i = 0; i < listOptions.length; i++) {
            const nameString = `${listOptions[i].name}`
            const newOption = document.createElement('option')
            newOption.value = nameString
            newOption.innerHTML = nameString

            dropList.appendChild(newOption)
        }

        dropList.value = listOptions[1].name
        selectedBlock = blockTypes.filter(b=>b.name === $("#DOM_blockList").value)[0]
    }
}

function populateDOMBlockData() {
    // Search "bazingo"
    // to change the world object structure from "embeds" to "blockdata"

    // "embeds": { - This should change to "blockdata"
    // 	"36_21_6_20": "http://localhost:3001/public/viewer/index.html?scene=dump/wild.bd",
    // 	"36_18_6_20": "http://erickalpin.com/petition/"
    // },

    // Clear all DOM elements in the list
    $("#DOM_blockdata").innerHTML = ""

    // Loop through block data object and create DOM elements for them
    Object.keys(blockData).forEach(bName => {
        // New span
        let newBD = document.createElement("span")
        newBD.setAttribute("id", `block_${bName}`)
        newBD.classList.add("blockdata-field")
        newBD.innerHTML = `${bName}: `

        // New text area
        let newTextArea = document.createElement("textarea")
        const textID = `input_${bName}`
        newTextArea.setAttribute("id", textID)
        newTextArea.addEventListener("input", (e) => { setDataForBlock(bName, e.target.value) })
        newTextArea.innerHTML = blockData[bName]

        // New delete button
        let newButton = document.createElement("button")
        newButton.onclick = () => { createDataForBlock(true, bName) }
        newButton.innerHTML = 'X'

        // Add elements to span
        newBD.appendChild(newTextArea)
        newBD.appendChild(newButton)

        // add elements to list
        $("#DOM_blockdata").appendChild(newBD)
        $("#DOM_blockdata").appendChild(document.createElement("br"))
    })

    // <span id="block_gX_gY_gZ_ID" class="blockdata-field">
    //     gX_gY_gZ_ID: <textarea oninput="setDataForBlock('gX_gY_gZ_ID', this.innerHTML)"></textarea> <button onclick="createDataForBlock(true, 'gX_gY_gZ_ID')">X</button><br>
    // </span>
}

function updateViewDirection(newVal) {
    // Set value
    viewDirection = newVal

    // Remove all selected classes
    const btnX = $(`#DOM_xaxis`)
    const btnY = $(`#DOM_yaxis`)
    const btnZ = $(`#DOM_zaxis`)
    btnX?.classList?.remove('selected')
    btnY?.classList?.remove('selected')
    btnZ?.classList?.remove('selected')

    // Add selected class
    switch (newVal) {
        case 0: 
            btnX?.classList?.add('selected')
            break
        case 1:
            btnY?.classList?.add('selected')
            break
        case 2:
            btnZ?.classList?.add('selected')
            break
    }

    // Redraw world
    drawWorld(world, $("#DOM_depthslider").value)
}

function updateWorld(newWorld) { // ToDo: create a World() object
    chunkSize = newWorld._chunkSize || 8
    worldSize = newWorld._worldSize || 8
    canvas.width = canvas.height = chunkSize * worldSize * desiredPixelSize
    _resolution = (chunkSize * worldSize)
    pixelSize = canvas.width/_resolution
    world = newWorld.worldChunks || [[[]]]
    worldSpawn = newWorld.worldSpawn
    // Search "bazingo"
    blockData = newWorld.embeds || {} // ToDo: This will be changing to newWorld.blockData

    canvasTemp.width = canvasTemp.height = canvas.width

    // Update DOM
    $('#DOM_seed').value = newWorld._wSeed

    // Update slider
    resetDepthSlider()

    // Update block data section
    populateDOMBlockData()
}

function resetDepthSlider() {
    const slider = $("#DOM_depthslider")
    const steps = canvas.width / pixelSize
    $("#DOM_depth").innerHTML = `Depth: ${0}`
    slider.value = 0
    slider.max = (steps - 1)

    // Reset draw depth
    $('#DOM_drawdepthslider').max = _resolution
    $('#DOM_drawdepthvalue').innerHTML = $('#DOM_drawdepthslider').value
}

function DOMNoiseFnc() {
    // Get selected function
    const selPattern = $("#DOM_genList").value
    
    // Get seed based on choice
    const random = $('#DOM_rndSeed').checked
    const seed = random ? `${Math.random()}` : $('#DOM_seed').value
    $('#DOM_seed').value = seed
    
    // Generator settings
    //generator.noiseScale = $('#DOM_scale').value

    // Get world size from slider
    worldSize = $('#DOM_wsizeslider').value
    canvas.width = canvas.height = chunkSize * worldSize * desiredPixelSize
    _resolution = chunkSize * worldSize
    pixelSize = canvas.width/_resolution

    canvasTemp.width = canvasTemp.height = canvas.width

    // Get depth based on slider selection
    let steps = canvas.width / pixelSize
    $('#DOM_depthslider').max = (steps - 1)
    const depth = $('#DOM_depthslider').value

    // Generate pattern and draw
    generateNoise(selPattern, depth, seed)

    // Update slider
    resetDepthSlider()

    // Update block data section
    populateDOMBlockData()
}

function updateDepth(el) {
    // Update label
    $("#DOM_depth").innerHTML = `Depth: ${el.value}`

    // Redraw pattern with new z index
    drawWorld(world, el.value)
}

function setEditorTool(newTool) {
    // Selecat tool
    editorTool = newTool

    // Remove all selected classes
    for (const key in tools) {
        const btn = $(`#DOM_${tools[key]}btn`)
        btn?.classList?.remove('selected')
    }

    // Add selected class
    const btn = $(`#DOM_${newTool}btn`)
    btn?.classList?.add('selected')
}

////////////////////////////////////////////////////////
// Events
////////////////////////////////////////////////////////
const getViewPos = (depth, pos = mouseWolrdPos, viewD = viewDirection) => {
    let viewPos = { chunk: { x:0, y:0, z:0 }, block: { x:0, y:0, z:0 } }
    switch (viewD) {
        case 0: // X
            viewPos.chunk = { x: Math.floor(depth / chunkSize), y: pos.chunk.y, z: pos.chunk.x }
            viewPos.block = { x: (depth % chunkSize), y: pos.block.y, z: pos.block.x }
            break
        case 1: // Y
            viewPos.chunk = { x: pos.chunk.x, y: Math.floor(depth / chunkSize), z: pos.chunk.y }
            viewPos.block = { x: pos.block.x, y: (depth % chunkSize), z: pos.block.y }
            break
        case 2: // Z
            viewPos.chunk = { x: pos.chunk.x, y: pos.chunk.y, z: Math.floor(depth / chunkSize) }
            viewPos.block = { x: pos.block.x, y: pos.block.y, z: (depth % chunkSize) }
            break
        default:
            viewPos.chunk = { x: pos.chunk.x, y: pos.chunk.y, z: Math.floor(depth / chunkSize) }
            viewPos.block = { x: pos.block.x, y: pos.block.y, z: (depth % chunkSize) }
            break
    }
    return viewPos
}

function getPointerOffset(e) {
    const eventDoc = (e.target && e.target.ownerDocument) || document
    const doc = eventDoc.documentElement
    const body = eventDoc.body

    let pX = e.pageX +
        (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
        (doc && doc.clientLeft || body && body.clientLeft || 0)
    let pY = e.pageY +
        (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
        (doc && doc.clientTop  || body && body.clientTop  || 0 )

    return {x: pX, y: pY}
}

canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    pointerDown = true

    // Set mouse start
    const offset = getPointerOffset(e)
    const cellSize = canvas.clientWidth/_resolution
    mouseGridStart.x = Math.floor((offset.x) / cellSize)
    mouseGridStart.y = Math.floor((offset.y) / cellSize)

    // Set tool
    switch (e.button) {
        case 0: // LMB
            if (editorTool === tools.pencil) drawPencil()
            else if (editorTool === tools.edit) createDataForBlock()
            break
        case 2: // RMB
            altAction = true
            if (editorTool === tools.pencil) drawPencil(altAction)
            else if (editorTool === tools.edit) createDataForBlock(altAction)
            break
    }

    // Draw edit preview
    drawLayer(tempLayer, ctxTemp)
})

const pointerOuts = ['pointerup', 'pointercancel']
pointerOuts.forEach( (event) => {
    canvas.addEventListener(event, (e) => {
        e.preventDefault()
        pointerDown = altAction = false

        // Fill from temp layer
        if (editorTool === tools.rect || editorTool === tools.filledRect) fillFromTempLayer()

        // Clear temp canvas
        ctxTemp.clearRect(0, 0, canvasTemp.width, canvasTemp.height)
        for (let y = 0; y < (worldSize*chunkSize); y++) { tempLayer[y] = []; for (let x = 0; x < (worldSize*chunkSize); x++) { tempLayer[y][x] = 0 }}

        // Redraw world
        const depth = $("#DOM_depthslider").value
        drawWorld(world, depth)
    })
})

canvas.addEventListener('pointermove', (e) => {
    // Get pointer offset
    const offset = getPointerOffset(e)

    // Get mouse Grid postion
    const cellSize = canvas.clientWidth/_resolution
    mouseGridPos.x = Math.floor((offset.x) / cellSize)
    mouseGridPos.y = Math.floor((offset.y) / cellSize)

    // Get world position
    mouseWolrdPos = getWorldPos({
        x: (viewDirection === 0) ? canvas.clientWidth - offset.x : offset.x,
        y: canvas.clientHeight - offset.y
    })

    // Use tools
    if (pointerDown) {
        switch (editorTool) {
            case tools.pencil:
                drawPencil(altAction)
                break
            case tools.rect:
                drawRect(altAction)
                break
            case tools.filledRect:
                drawFilledRect(altAction)
                break
        }
    }
    else {
        // Draw tool preview
        drawToolPreview({x:mouseGridPos.x,y:mouseGridPos.y}, blockTypes.indexOf(selectedBlock), 0.5, ctxTemp)
    }
})

document.addEventListener('wheel', (e) => {
    // Change block
    if (altHeld) {
        if (e.deltaY > 0) {
            let index = blockTypes.indexOf(selectedBlock)
            index--
            if (index < 0) index = blockTypes.length-1
            selectedBlock = blockTypes[index]
            $("#DOM_blockList").value = selectedBlock.name
        }
        else if (e.deltaY < 0){
            let index = blockTypes.indexOf(selectedBlock)
            selectedBlock = blockTypes[(index+1) % blockTypes.length]
            $("#DOM_blockList").value = selectedBlock.name
        }
    }
    // Change layer
    else {
        // Scroll down
        if (e.deltaY > 0) {
            $("#DOM_depthslider").value--
        }
        // Scroll up
        else if (e.deltaY < 0) {
            $("#DOM_depthslider").value++
        }
        const newE = new Event('input')
        $("#DOM_depthslider").dispatchEvent(newE)
    }
})

// Key commands
document.addEventListener('keydown', (e) => {
    // console.log(e.key)
    // Select block
    if (e.key === 'a') { // Cycle down
        let index = blockTypes.indexOf(selectedBlock)
        index--
        if (index < 0) index = blockTypes.length-1
        selectedBlock = blockTypes[index]
        $("#DOM_blockList").value = selectedBlock.name
    }
    else if (e.key === 'd') { // Cycle down
        let index = blockTypes.indexOf(selectedBlock)
        selectedBlock = blockTypes[(index+1) % blockTypes.length]
        $("#DOM_blockList").value = selectedBlock.name
    }
    else if (e.key === 'e') { // Eyedrop
        // Get block at position
        const depth = $("#DOM_depthslider").value
        const viewPos = getViewPos(depth)
        const blockVal = world[viewPos.chunk.y][viewPos.chunk.x][viewPos.chunk.z][viewPos.block.y][viewPos.block.x][viewPos.block.z]
        // Change block
        const newE = new Event('change')
        $("#DOM_blocklist").value = blockTypes[blockVal].name
        $("#DOM_blocklist").dispatchEvent(newE)
    }
    // Select layer
    else if (e.key === 'w') { // Layer up
        const slider = $("#DOM_depthslider")
        $("#DOM_depthslider").value++
        $("#DOM_depth").innerHTML = `Depth: ${slider.value}`
        drawWorld(world, slider.value)
    }
    else if (e.key === 's') { // Layer down
        const slider = $("#DOM_depthslider")
        $("#DOM_depthslider").value--
        $("#DOM_depth").innerHTML = `Depth: ${slider.value}`
        drawWorld(world, slider.value)
    }
    // Select view
    else if (e.key === '1') updateViewDirection(0)
    else if (e.key === '2') updateViewDirection(1)
    else if (e.key === '3') updateViewDirection(2)
    // Tools
    else if (e.key === 'b') setEditorTool(tools.pencil)
    else if (e.key === 'r') setEditorTool(tools.rect)
    else if (e.key === 'f') setEditorTool(tools.filledRect)
    else if (e.key === 'i') setEditorTool(tools.edit)
    else if (e.key === '-') { $('#DOM_drawdepthslider').value--; $('#DOM_drawdepthvalue').innerHTML = $('#DOM_drawdepthslider').value }
    else if (e.key === '=') { $('#DOM_drawdepthslider').value++; $('#DOM_drawdepthvalue').innerHTML = $('#DOM_drawdepthslider').value }
    else if (e.key === 'Alt') {
        e.preventDefault()
        altHeld = true
    }

    // Draw tool preview
    drawToolPreview({x:mouseGridPos.x,y:mouseGridPos.y}, blockTypes.indexOf(selectedBlock), 0.5, ctxTemp)
})

document.addEventListener('keyup', (e) => {
    altHeld = false
})

////////////////////////////////////////////////////////
// Tool actions
////////////////////////////////////////////////////////
function drawToolPreview(position = {x:0,y:0}, tileIndex = 0, opacity = 1, context = ctxTemp) {
    // Set Opacity
    context.globalAlpha = opacity
    context.clearRect(0, 0, context.canvas.width, context.canvas.height)

    // Draw cursor
    drawTileHere(position.x, position.y, pixelSize, tileIndex, context, (editorTool === tools.edit))

    // Reset Opacity
    context.globalAlpha = 1
}

function drawPencil(erase = false) {
    // Get world layer
    const depth = $("#DOM_depthslider").value
    // Get world position
    const viewPos = getViewPos(depth)

    // Draw
    drawBlockWithDepth(depth, viewPos, erase? 0 : blockTypes.indexOf(selectedBlock))
    // world[viewPos.chunk.y][viewPos.chunk.x][viewPos.chunk.z][viewPos.block.y][viewPos.block.x][viewPos.block.z] = erase? 0 : blockTypes.indexOf(selectedBlock)
    tempLayer[mouseGridPos.y][mouseGridPos.x] = erase? 'erase' : blockTypes.indexOf(selectedBlock) || 'erase'

    // Draw edit preview
    drawLayer(tempLayer, ctxTemp)
}

function drawRect(erase = false) {
    // clear
    ctxTemp.clearRect(0, 0, canvasTemp.width, canvasTemp.height)
    for (let y = 0; y < (worldSize*chunkSize); y++) { tempLayer[y] = []; for (let x = 0; x < (worldSize*chunkSize); x++) { tempLayer[y][x] = 0 }}

    // Draw
    const deltaX = mouseGridPos.x - mouseGridStart.x
    const deltaY = mouseGridPos.y - mouseGridStart.y
    //TL
    for (let w = 0; w < Math.abs(deltaX)+1; w++) {
        const rectX = mouseGridStart.x + Math.floor( (w / Math.abs(deltaX)) * deltaX )
        //TL
        tempLayer[mouseGridStart.y][rectX] = erase? 'erase' : blockTypes.indexOf(selectedBlock) || 'erase'
        //BR
        tempLayer[mouseGridPos.y][rectX] = erase? 'erase' : blockTypes.indexOf(selectedBlock) || 'erase'
    }
    for (let h = 0; h < Math.abs(deltaY)+1; h++) {
        const rectY = mouseGridStart.y + Math.floor( (h / Math.abs(deltaY)) * deltaY )
        if (tempLayer[rectY]) {
            //TL
            tempLayer[rectY][mouseGridStart.x] = erase? 'erase' : blockTypes.indexOf(selectedBlock) || 'erase'
            //BR
            tempLayer[rectY][mouseGridPos.x] = erase? 'erase' : blockTypes.indexOf(selectedBlock) || 'erase'
        }
    }

    // Draw edit preview
    drawLayer(tempLayer, ctxTemp)
}

function drawFilledRect(erase = false) {
    // clear
    ctxTemp.clearRect(0, 0, canvasTemp.width, canvasTemp.height)
    for (let y = 0; y < (worldSize*chunkSize); y++) { tempLayer[y] = []; for (let x = 0; x < (worldSize*chunkSize); x++) { tempLayer[y][x] = 0 }}

    // Draw
    const deltaX = mouseGridPos.x - mouseGridStart.x
    const deltaY = mouseGridPos.y - mouseGridStart.y
    //TL
    for (let w = 0; w < Math.abs(deltaX)+1; w++) {
    const rectX = mouseGridStart.x + Math.floor( (w / Math.abs(deltaX)) * deltaX )
    for (let h = 0; h < Math.abs(deltaY)+1; h++) {
        const rectY = mouseGridStart.y + Math.floor( (h / Math.abs(deltaY)) * deltaY )
        if (tempLayer[rectY]) {
            // tempLayer[mouseGridStart.y][mouseGridStart.x] = erase? 'erase' : blockTypes.indexOf(selectedBlock) || 'erase'
            tempLayer[rectY][rectX] = erase? 'erase' : blockTypes.indexOf(selectedBlock) || 'erase'
        }
    }
    }

    // Draw edit preview
    drawLayer(tempLayer, ctxTemp)
}

function fillFromTempLayer() {
    for (let y = 0; y < tempLayer.length; y++) {
    for (let x = 0; x < tempLayer[y].length; x++) {
        if (tempLayer[y][x]) {
            // Get world position
            const cellSize = canvas.clientWidth/_resolution
            const yPos = canvas.clientWidth - ((y+1)*cellSize)
            const xPos = (viewDirection !== 0) ? x*cellSize : canvas.clientWidth - ((x+1)*cellSize)
            const worldPos = getWorldPos({ x: xPos, y: yPos })
            const depth = $("#DOM_depthslider").value
            let viewPos = getViewPos(depth, worldPos)

            // 3D rect
            drawBlockWithDepth(depth, viewPos, (tempLayer[y][x] === 'erase')? 0 : blockTypes.indexOf(selectedBlock))

        }
    }}
}

function drawBlockWithDepth(currentDepth, viewPos, blockIndex) {
    const depthInt = parseInt(currentDepth, 10)
    if ($("#DOM_drawdepthslider").value > 0) {
        for (let d = 0; d < $("#DOM_drawdepthslider").value; d++) {
            const dInt = parseInt(d, 10)
            switch (viewDirection) {
                case 0: // X
                    // let newX = (currentDepth + (viewPos.chunk.x * viewPos.block.x) + d)
                    let newX = (depthInt + dInt)
                    newX = (newX > _resolution)? _resolution : newX
                    const worldX = getWorldPos({ x: newX, y: 0 }, false)
                    // Create
                    world
                        [viewPos.chunk.y][worldX.chunk.x][viewPos.chunk.z]
                        [viewPos.block.y][worldX.block.x][viewPos.block.z] = blockIndex
                    break
                case 1: // Y
                    // let newY = (currentDepth + (viewPos.chunk.y * viewPos.block.y) + d)
                    let newY = (depthInt + dInt)
                    newY = (newY > _resolution)? _resolution : newY
                    const worldY = getWorldPos({ x: newY, y: 0 }, false)
                    // Create
                    world
                        [worldY.chunk.x][viewPos.chunk.x][viewPos.chunk.z]
                        [worldY.block.x][viewPos.block.x][viewPos.block.z] = blockIndex
                    break
                case 2: // Z
                    // let newZ = (currentDepth + (viewPos.chunk.z * viewPos.block.z) + d)
                    let newZ = (depthInt + dInt)
                    newZ = (newZ > _resolution)? _resolution : newZ
                    const worldZ = getWorldPos({ x: newZ, y: 0 }, false)
                    // Create
                    world
                        [viewPos.chunk.y][viewPos.chunk.x][worldZ.chunk.x]
                        [viewPos.block.y][viewPos.block.x][worldZ.block.x] = blockIndex
                    break
            }
        }
    }
}

function getWorldPositionAtMouse(currentDepth, viewPos) {
    let location = {
        chunk: { x: 0, y: 0, z: 0 },
        block: { x: 0, y: 0, z: 0 }
    }

    switch (viewDirection) {
        case 0: // X
            let newX = currentDepth
            newX = (newX > _resolution)? _resolution : newX
            const worldX = getWorldPos({ x: newX, y: 0 }, false)
            // Create
            location = {
                chunk: { x: worldX.chunk.x, y: viewPos.chunk.y, z: viewPos.chunk.z },
                block: { x: worldX.block.x, y: viewPos.block.y, z: viewPos.block.z }
            }
            break
        case 1: // Y
            let newY = currentDepth
            newY = (newY > _resolution)? _resolution : newY
            const worldY = getWorldPos({ x: newY, y: 0 }, false)
            // Create
            location = {
                chunk: { x: viewPos.chunk.x, y: worldY.chunk.x, z: viewPos.chunk.z },
                block: { x: viewPos.block.x, y: worldY.block.x, z: viewPos.block.z }
            }
            break
        case 2: // Z
            let newZ = currentDepth
            newZ = (newZ > _resolution)? _resolution : newZ
            const worldZ = getWorldPos({ x: newZ, y: 0 }, false)
            // Create
            location = {
                chunk: { x: viewPos.chunk.x, y: viewPos.chunk.y, z: worldZ.chunk.x },
                block: { x: viewPos.block.x, y: viewPos.block.y, z: worldZ.block.x }
            }
            break
    }

    return location
}

function createDataForBlock(remove = false, blockName = null, blockID = null) {
    // Get world layer
    const depth = $("#DOM_depthslider").value
    // Get world position
    const viewPos = getViewPos(depth)
    // Get global position
    const gPos = getGlobalPos(viewPos, chunkSize)
    // Get block ID
    const mPos = getWorldPositionAtMouse(depth, viewPos)
    const blockAtMouse = world[mPos.chunk.y]?.[mPos.chunk.x]?.[mPos.chunk.z]?.[mPos.block.y]?.[mPos.block.x]?.[mPos.block.z]
    const bID = (blockID === null)? blockAtMouse : blockID

    // Get block name
    const bName = blockName || `${bID}_${gPos.x}_${gPos.y}_${gPos.z}`
    // console.log("block data change", bName)

    if (remove) {
        // Remove metadata for this block
        delete blockData[bName]
    }
    else {
        // Create metadata for this block
        if (!blockData[bName]) blockData[bName] = ""
    }

    // Update DOM
    populateDOMBlockData()

    // Show selected
    $(`#block_${bName}`)?.classList.add('selected-blockdata')
}

function setDataForBlock(blockName = null, newData = "") {

    // Check if this block exists in the list
    if (Object.keys(blockData).includes(blockName)) {
    }
    else {
        createDataForBlock(true, blockName)
    }

    // Set the data
    blockData[blockName] = newData

    // console.log(blockData, blockData[blockLocation], newData)
    // console.log(newData)

    // Update DOM
    //populateDOMBlockData()
}

////////////////////////////////////////////////////////
// Pattern Gen and Drawing
////////////////////////////////////////////////////////

function generateNoise(pat, depth, seed) {
    // Generate world
    world = [[[]]]
    world = generator.generateWorld({seed: seed, chunkSize: chunkSize, worldSize: worldSize, pattern: pat})

    // Draw pattern to canvas
    drawWorld(world, depth)
}

function drawTileHere(x, y, size, id, myCtx = ctx, isCursor = false) {
    // Get block from ID
    const block = blockTypes[id] || blockTypes[0]
    let textureID = 0
    if (isCursor) {
        textureID = 254
    }
    else {
        switch (viewDirection) {
            case 0:
                textureID = block.textures.left || 0
                break
            case 1:
                textureID = block.textures.top || 0
                break
            case 2:
                textureID = block.textures.front || 0
                break
            default:
                textureID = block.textures.front || 0
                break
        }
    }
    // Calculate ID offset
    const rows = 16
    const columns = 16
    let c = (textureID-1) % columns
    let r = Math.floor((textureID-1) / columns)
    // Draw
    if (myCtx) myCtx.drawImage(textureSheet, c*32, r*32, 32, 32, x*size, y*size, size, size)
}

function drawWorld(w, depth) {
    // Select draw function based on "viewDirection"
    if (w[0][0][0]) {
        switch (viewDirection) {
            case 0:
                drawXWorld(w, depth)
                break
            case 1:
                drawYWorld(w, depth)
                break
            case 2:
                drawZWorld(w, depth)
                break
            default:
                drawZWorld(w, depth)
                break
        }
    }
}

function drawXWorld(w, depth) {
    // Get Z's world location
    const cSize = w[0][0][0].length
    const xChunk = Math.floor(depth / cSize)
    const xBlock = depth % cSize

    // Draw background
    ctx.fillStyle = `rgba( 0, 0, 0, 1 )`
    ctx.fillRect( 0, 0, canvas.width, canvas.height )

    // Loop through all chunks in world
    for (let cy = 0; cy < w.length; cy++) {
    for (let cz = 0; cz < w[cy][xChunk].length; cz++) {
        const chunk = w[cy][xChunk][cz]
    
    // Loop through all blocks in chunk
    for (let y = 0; y < chunk.length; y++) {
    for (let z = 0; z < chunk[y][xBlock].length; z++) {
        // Draw pixel
        let val = chunk[y][xBlock][z]
        // If no block here, draw next layer
        if (val === 0) {
            for (let n = steps2D; n >= 0; n--) {
                const nextX = parseInt(depth,10) + parseInt(n,10) + parseInt(1,10)
                let nextXChunk = Math.floor(nextX / cSize) % w.length
                const nextXBlock = nextX % cSize
                const nextChunk = w[cy][nextXChunk][cz]
                const nextXVal = nextChunk[y][nextXBlock][z]
                if (nextXVal > 0) {
                    // drawTileHere((z+(cz*cSize)), ((_resolution-y-1)-(cy*cSize)), pixelSize, nextXVal)
                    drawTileHere(((_resolution-z-1)-(cz*cSize)), ((_resolution-y-1)-(cy*cSize)), pixelSize, nextXVal)
                    ctx.fillStyle = `rgba( 0, 0, 0, ${(1/(steps2D+1)) * (n+1)} )`
                    // ctx.fillRect( (z+(cz*cSize))*pixelSize, ((_resolution-y-1)-(cy*cSize))*pixelSize, pixelSize, pixelSize )
                    ctx.fillRect( ((_resolution-z-1)-(cz*cSize))*pixelSize, ((_resolution-y-1)-(cy*cSize))*pixelSize, pixelSize, pixelSize )
                }
            }
        }
        //else drawTileHere((z+(cz*cSize)), ((_resolution-y-1)-(cy*cSize)), pixelSize, val)
        else drawTileHere(((_resolution-z-1)-(cz*cSize)), ((_resolution-y-1)-(cy*cSize)), pixelSize, val)
    }}
    }}
}

function drawYWorld(w, depth) {
    // Get Z's world location
    const cSize = w[0][0][0].length
    const yChunk = Math.floor(depth / cSize)
    const yBlock = depth % cSize

    // Draw background
    ctx.fillStyle = `rgba( 0, 0, 0, 1 )`
    ctx.fillRect( 0, 0, canvas.width, canvas.height )

    // Loop through all chunks in world
    for (let cx = 0; cx < w[yChunk].length; cx++) {
    for (let cz = 0; cz < w[yChunk][cx].length; cz++) {
        const chunk = w[yChunk][cx][cz]
    
    // Loop through all blocks in chunk
    for (let x = 0; x < chunk[yBlock].length; x++) {
    for (let z = 0; z < chunk[yBlock][x].length; z++) {
        // Draw pixel
        let val = chunk[yBlock][x][z]
        // If no block here, draw next layer
        if (val === 0) {
            for (let n = steps2D; n >= 0; n--) {
                let nextY = parseInt(depth,10) - (parseInt(n,10) + parseInt(1,10))
                if (nextY < 0) nextY = 0
                const nextYChunk = Math.floor(nextY / cSize) % w.length
                const nextYBlock = nextY % cSize
                const nextChunk = w[nextYChunk][cx][cz]
                const nextYVal = nextChunk[nextYBlock][x][z]
                if (nextYVal > 0) {
                    drawTileHere((x+(cx*cSize)), ((_resolution-z-1)-(cz*cSize)), pixelSize, nextYVal)
                    ctx.fillStyle = `rgba( 0, 0, 0, ${(1/(steps2D+1)) * (n+1)} )`
                    ctx.fillRect( (x+(cx*cSize))*pixelSize, ((_resolution-z-1)-(cz*cSize))*pixelSize, pixelSize, pixelSize )
                }
            }
        }
        else drawTileHere((x+(cx*cSize)), ((_resolution-z-1)-(cz*cSize)), pixelSize, val)
    }}
    }}
}

function drawZWorld(w, depth) {
    // Get Z's world location
    const cSize = w[0][0][0].length
    const zChunk = Math.floor(depth / cSize)
    const zBlock = depth % cSize

    // Draw background
    ctx.fillStyle = `rgba( 0, 0, 0, 1 )`
    ctx.fillRect( 0, 0, canvas.width, canvas.height )

    // Loop through all chunks in world
    for (let cy = 0; cy < w.length; cy++) {
    for (let cx = 0; cx < w[cy].length; cx++) {
        const chunk = w[cy][cx][zChunk]
    
    // Loop through all blocks in chunk
    for (let y = 0; y < chunk.length; y++) {
    for (let x = 0; x < chunk[y].length; x++) {
        // Draw pixel
        let val = chunk[y][x][zBlock]
        // If no block here, draw next layer
        if (val === 0) {
            for (let n = steps2D; n >= 0; n--) {
                const nextZ = parseInt(depth,10) + parseInt(n,10) + parseInt(1,10)
                const nextZChunk = Math.floor(nextZ / cSize) % w.length
                const nextZBlock = nextZ % cSize
                const nextChunk = w[cy][cx][nextZChunk]
                const nextZVal = nextChunk[y][x][nextZBlock]
                if (nextZVal > 0) {
                    drawTileHere((x+(cx*cSize)), ((_resolution-y-1)-(cy*cSize)), pixelSize, nextZVal)
                    ctx.fillStyle = `rgba( 0, 0, 0, ${(1/(steps2D+1)) * (n+1)} )`
                    ctx.fillRect( (x+(cx*cSize))*pixelSize, ((_resolution-y-1)-(cy*cSize))*pixelSize, pixelSize, pixelSize )
                }
            }
        }
        else drawTileHere((x+(cx*cSize)), ((_resolution-y-1)-(cy*cSize)), pixelSize, val)
    }}
    }}
}

function drawLayer(layer, myCtx) {
    // Draw tiles
    for (let y = 0; y < layer.length; y++) {
    for (let x = 0; x < layer[y].length; x++) {
        switch (editorTool) {
            default:
                if (layer[y][x] === 'erase') {
                    myCtx.fillStyle = `rgba( 0, 0, 0, 1 )`
                    myCtx.fillRect( x*pixelSize, y*pixelSize, pixelSize, pixelSize )
                }
                else if (layer[y][x] > 0) {
                    drawTileHere(x, y, pixelSize, layer[y][x], myCtx)
                }
                break
        }
    }
    }
}

////////////////////////////////////////////////////////
// Save / Load
////////////////////////////////////////////////////////

const saveWorld = (saveWorld) => {
    let w = new World()
    w.worldChunks = saveWorld
    w._worldSize = worldSize
    w._chunkSize = chunkSize
    w._wSeed = $('#DOM_seed').value
    w.saveVersion = '0.1'
    if (worldSpawn) w.worldSpawn = worldSpawn
    // Search "bazingo"
    w.embeds = blockData // ToDo: This will be changing to w.blockData

    let element = document.createElement('a')
    element.setAttribute( 'href', 'data:text/plain;charset=utf-8,' + encodeURIComponent( JSON.stringify( w ) ) )
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

        // Set world
        updateWorld(obj)

        // Redraw pattern with new z index
        drawWorld(world, $("#DOM_depthslider").value)
    }
 
    fileBrowser.addEventListener('change', onChange)

    document.body.appendChild(fileBrowser)

    fileBrowser.click()
}