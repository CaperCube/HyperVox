import { staticImageSRC } from "../../../client/js/resources.js"//"/client/js/resources.js"
import ChunkGenerator from "../../../brain/gen/world/chunkGen.js"//"/brain/gen/world/chunkGen.js"
import { blockTypes } from "../../../common/blockSystem.js"
import World from "../../../brain/gen/world/world.js"

// Canvas vars
const canvas = $('#main-canvas')
const ctx = canvas.getContext('2d')
canvas.width = canvas.height = 512

// Texture sheet vars
const textureSheet = new Image(512,512)
textureSheet.onload = () => { 
    $('#DOM_rndSeed').checked = false
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

// Editor vars
let tempLayer = [[]]
for (let y = 0; y < (worldSize*chunkSize); y++) { tempLayer[y] = []; for (let x = 0; x < (worldSize*chunkSize); x++) { tempLayer[y][x] = 0 }}

let viewDirection = 2 // 0 = X, 1 = Y, 2 = Z
let selectedBlock = blockTypes[0]
let editorTool = 'pencil'

// mouse vars
const getWorldPos = (pos) => {
    const cellSize = canvas.clientWidth/_resolution
    const x = Math.floor((pos.x) / cellSize)
    const y = Math.floor((pos.y) / cellSize)

    let xChunk = Math.floor(x/chunkSize)
    xChunk = (xChunk >= worldSize)? worldSize-1 : xChunk
    let yChunk = Math.floor(y/chunkSize)
    yChunk = (yChunk >= worldSize)? worldSize-1 : yChunk
    const chunk = { x: xChunk, y: yChunk}
    const block = { x: (x % chunkSize), y: (y % chunkSize) } 

    return { chunk: chunk, block: block } 
}
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
$("#DOM_genList").onchange = () => { DOMNoiseFnc() }
$("#DOM_blocklist").onchange = () => { selectedBlock = blockTypes.filter(b=>b.name === $("#DOM_blockList").value)[0]; console.log(selectedBlock) }
$("#DOM_loadWorld").onclick = () => { browseForWorldFile() }
$("#DOM_saveWorld").onclick = () => { saveWorld(world) }
populateDOMList($("#DOM_genList"), Object.keys(generator.noisePatterns))
populateDOMBlockList($("#DOM_blockList"), blockTypes)

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

function updateViewDirection(newVal) {
    // Set value
    viewDirection = newVal

    // Reset slider
    //resetDepthSlider()

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

    canvasTemp.width = canvasTemp.height = canvas.width
}

function resetDepthSlider() {
    const slider = $("#DOM_depthslider")
    const steps = canvas.width / pixelSize
    $("#DOM_depth").innerHTML = `Depth: ${0}`
    slider.value = 0
    slider.max = (steps - 1)
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
}

function updateDepth(el) {
    // Update label
    $("#DOM_depth").innerHTML = `Depth: ${el.value}`

    // Redraw pattern with new z index
    drawWorld(world, el.value)
}

////////////////////////////////////////////////////////
// Events
////////////////////////////////////////////////////////
const getViewPos = (depth) => {
    let viewPos = { chunk: { x:0, y:0, z:0 }, block: { x:0, y:0, z:0 } }
    switch (viewDirection) {
        case 0: // X
            viewPos.chunk = { x: Math.floor(depth / chunkSize), y: mouseWolrdPos.chunk.y, z: mouseWolrdPos.chunk.x }
            viewPos.block = { x: (depth % chunkSize), y: mouseWolrdPos.block.y, z: mouseWolrdPos.block.x }
            break
        case 1: // Y
            viewPos.chunk = { x: mouseWolrdPos.chunk.x, y: Math.floor(depth / chunkSize), z: mouseWolrdPos.chunk.y }
            viewPos.block = { x: mouseWolrdPos.block.x, y: (depth % chunkSize), z: mouseWolrdPos.block.y }
            break
        case 2: // Z
            viewPos.chunk = { x: mouseWolrdPos.chunk.x, y: mouseWolrdPos.chunk.y, z: Math.floor(depth / chunkSize) }
            viewPos.block = { x: mouseWolrdPos.block.x, y: mouseWolrdPos.block.y, z: (depth % chunkSize) }
            break
        default:
            viewPos.chunk = { x: mouseWolrdPos.chunk.x, y: mouseWolrdPos.chunk.y, z: Math.floor(depth / chunkSize) }
            viewPos.block = { x: mouseWolrdPos.block.x, y: mouseWolrdPos.block.y, z: (depth % chunkSize) }
            break
    }
    return viewPos
}

canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    pointerDown = true
    switch (e.button) {
        case 0:
            editorTool = 'pencil'
            break
        case 2:
            editorTool = 'eraser'
            break
    }

    // Use Tool
    switch (editorTool) {
        case 'pencil':
            drawPencil()
            break
        case 'eraser':
            drawPencil(true)
            break
    }

    // Draw edit preview
    drawLayer(tempLayer, ctxTemp)
})
canvas.addEventListener('pointerup', (e) => {
    e.preventDefault()
    pointerDown = false

    // Clear temp canvas
    ctxTemp.clearRect(0, 0, canvasTemp.width, canvasTemp.height)
    for (let y = 0; y < (worldSize*chunkSize); y++) { tempLayer[y] = []; for (let x = 0; x < (worldSize*chunkSize); x++) { tempLayer[y][x] = 0 }}

    // Redraw world
    const depth = $("#DOM_depthslider").value
    drawWorld(world, depth)
})
canvas.addEventListener('pointermove', (e) => {
    // Get pointer offset
    const eventDoc = (e.target && e.target.ownerDocument) || document
    const doc = eventDoc.documentElement
    const body = eventDoc.body

    let pX = e.pageX +
        (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
        (doc && doc.clientLeft || body && body.clientLeft || 0)
    let pY = e.pageY +
        (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
        (doc && doc.clientTop  || body && body.clientTop  || 0 )

    // Get mouse Grid postion
    const cellSize = canvas.clientWidth/_resolution
    mouseGridPos.x = Math.floor((pX) / cellSize)
    mouseGridPos.y = Math.floor((pY) / cellSize)

    // Get world position
    mouseWolrdPos = getWorldPos({
        x: (viewDirection === 0) ? canvas.clientWidth - pX : pX,
        y: canvas.clientHeight - pY
    })

    // Use tools
    if (pointerDown) {
        switch (editorTool) {
            case 'pencil':
                drawPencil()
                break
            case 'eraser':
                drawPencil(true)
                break
        }

        // Draw edit preview
        drawLayer(tempLayer, ctxTemp)
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
    e.preventDefault()
    // console.log(e.key)
    // Select block
    if (e.key === 'e') {
        selectedBlock = blockTypes[0]
        $("#DOM_blockList").value = selectedBlock.name
    }
    else if (e.key === 'a') {
        let index = blockTypes.indexOf(selectedBlock)
        index--
        if (index < 0) index = blockTypes.length-1
        selectedBlock = blockTypes[index]
        $("#DOM_blockList").value = selectedBlock.name
    }
    else if (e.key === 'd') {
        let index = blockTypes.indexOf(selectedBlock)
        selectedBlock = blockTypes[(index+1) % blockTypes.length]
        $("#DOM_blockList").value = selectedBlock.name
    }
    else if (e.key === 'q') {
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
    else if (e.key === 'w') {
        const slider = $("#DOM_depthslider")
        $("#DOM_depthslider").value++
        $("#DOM_depth").innerHTML = `Depth: ${slider.value}`
        drawWorld(world, slider.value)
    }
    else if (e.key === 's') {
        const slider = $("#DOM_depthslider")
        $("#DOM_depthslider").value--
        $("#DOM_depth").innerHTML = `Depth: ${slider.value}`
        drawWorld(world, slider.value)
    }
    // Select view
    else if (e.key === '1') updateViewDirection(0)
    else if (e.key === '2') updateViewDirection(1)
    else if (e.key === '3') updateViewDirection(2)
    else if (e.key === 'Alt') altHeld = true

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
    context.globalAlpha = opacity
    context.clearRect(0, 0, context.canvas.width, context.canvas.height)
    drawTileHere(position.x, position.y, pixelSize, tileIndex, context)

    context.globalAlpha = 1
}

function drawPencil(erase = false) {
    // Get world layer
    const depth = $("#DOM_depthslider").value
        
    // Get world position
    const viewPos = getViewPos(depth)

    // Draw
    world[viewPos.chunk.y][viewPos.chunk.x][viewPos.chunk.z][viewPos.block.y][viewPos.block.x][viewPos.block.z] = erase? 0 : blockTypes.indexOf(selectedBlock)
    tempLayer[mouseGridPos.y][mouseGridPos.x] = erase? 'erase' : blockTypes.indexOf(selectedBlock)
}

function drawRect() {
    //...
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

function drawTileHere(x, y, size, id, myCtx = ctx) {
    // Get block from ID
    const block = blockTypes[id] || blockTypes[0]
    let textureID = 0
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
        // drawTileHere(x, y, size, id, ctx)
        // drawTileHere(((x*pixelSize)), ((_resolution-y-1)-(y*pixelSize)), pixelSize, layer[y][x])
        switch (editorTool) {
            case 'eraser':
                if (layer[y][x] === 'erase') {
                    myCtx.fillStyle = `rgba( 0, 0, 0, 1 )`
                    myCtx.fillRect( x*pixelSize, y*pixelSize, pixelSize, pixelSize )
                }
                break
            default:
                if (layer[y][x]) drawTileHere(x, y, pixelSize, layer[y][x], myCtx)
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
        $('#DOM_seed').value = obj._wSeed

        // Update slider
        resetDepthSlider()

        // Redraw pattern with new z index
        drawWorld(world, $("#DOM_depthslider").value)
    }
 
    fileBrowser.addEventListener('change', onChange)

    document.body.appendChild(fileBrowser)

    fileBrowser.click()
}