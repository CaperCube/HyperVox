import { staticImageSRC } from "../../../client/js/resources.js"//"/client/js/resources.js"
import ChunkGenerator from "../../../brain/gen/world/chunkGen.js"//"/brain/gen/world/chunkGen.js"
import { blockTypes } from "../../../common/blockSystem.js"
import World from "../../../brain/gen/world/world.js"

// Canvas vars
const canvas = $('#main-canvas')
const ctx = canvas.getContext('2d')
canvas.width = canvas.height = 512
const textureSheet = new Image(512,512)
textureSheet.onload = () => { 
    $('#DOM_rndSeed').checked = false
    DOMNoiseFnc()
}
textureSheet.src = staticImageSRC.Tiles

// Noise vars
const generator = new ChunkGenerator()
let chunkSize = 8
let worldSize = 4
let _resolution = (chunkSize * worldSize)
let pixelSize = canvas.width/_resolution
let steps2D = 3
let world = [[[]]] // ToDo: change to an actual world object

// Editor vars
let viewDirection = 2 // 0 = X, 1 = Y, 2 = Z
let selectedBlock = blockTypes[0]
let editorTool = 'pencil'

// mouse vars
let pointerDown = false

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
    canvas.width = canvas.height = chunkSize * worldSize * 8
    _resolution = (chunkSize * worldSize)
    pixelSize = canvas.width/_resolution
    world = newWorld.worldChunks || [[[]]]
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
const getWorldPos = (pos) => {
    const cellSize = canvas.clientWidth/_resolution
    const x = Math.floor((pos.x - (pixelSize/2)) / cellSize)
    const y = Math.floor((pos.y + (pixelSize/2)) / cellSize)

    const chunk = { x: Math.floor(x/chunkSize), y: Math.floor(y/chunkSize) }
    const block = { x: (x % chunkSize), y: (y % chunkSize) } 

    return { chunk: chunk, block: block } 
}

canvas.addEventListener('pointerdown', (e) => { pointerDown = true })
canvas.addEventListener('pointerup', (e) => { pointerDown = false })
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

    // Get world pos
    const wPos = getWorldPos({
        x: (viewDirection === 0) ? canvas.clientWidth - pX : pX,
        y: canvas.clientHeight - pY
    })

    // Get world layer
    const depth = $("#DOM_depthslider").value

    // Pencil tool
    if (pointerDown && editorTool === 'pencil') {
        
        // Get world position
        let chunk = { x: wPos.chunk.x, y: wPos.chunk.y, z: Math.floor(depth / chunkSize) }
        let block = { x: wPos.block.x, y: wPos.block.y, z: (depth % chunkSize) }
        switch (viewDirection) {
            case 0: // X
                chunk = { x: Math.floor(depth / chunkSize), y: wPos.chunk.y, z: wPos.chunk.x }
                block = { x: (depth % chunkSize), y: wPos.block.y, z: wPos.block.x }
                break
            case 1: // Y
                chunk = { x: wPos.chunk.x, y: Math.floor(depth / chunkSize), z: wPos.chunk.y }
                block = { x: wPos.block.x, y: (depth % chunkSize), z: wPos.block.y }
                break
            case 2: // Z
                chunk = { x: wPos.chunk.x, y: wPos.chunk.y, z: Math.floor(depth / chunkSize) }
                block = { x: wPos.block.x, y: wPos.block.y, z: (depth % chunkSize) }
                break
            default:
                chunk = { x: wPos.chunk.x, y: wPos.chunk.y, z: Math.floor(depth / chunkSize) }
                block = { x: wPos.block.x, y: wPos.block.y, z: (depth % chunkSize) }
                break
        }

        // Update world
        world[chunk.y][chunk.x][chunk.z][block.y][block.x][block.z] = blockTypes.indexOf(selectedBlock)

        // Redraw world
        drawWorld(world, depth)
    }
})

// Key commands
document.addEventListener('keydown', (e) => {
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
})

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

function drawTileHere(x, y, size, id) {
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
    ctx.drawImage(textureSheet, c*32, r*32, 32, 32, x*size, y*size, size, size)
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