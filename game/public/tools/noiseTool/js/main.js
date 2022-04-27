import { staticImageSRC } from "../../../client/js/resources.js"//"/client/js/resources.js"
import ChunkGenerator from "../../../brain/gen/world/chunkGen.js"//"/brain/gen/world/chunkGen.js"
import { blockTypes } from "../../../common/blockSystem.js"

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
let world = [[[]]]

////////////////////////////////////////////////////////
// DOM function
////////////////////////////////////////////////////////
$("#DOM_generateBttn").onclick = DOMNoiseFnc
$("#DOM_zSlider").oninput = () => { updateZ($("#DOM_zSlider")) }
$("#DOM_genList").onchange = () => { DOMNoiseFnc() }
populateDOMGenList()

function populateDOMGenList() {
    const dropList = $("#DOM_genList")
    if (dropList) {
        // Get array of generator patterns
        const genOptions = Object.keys(generator.noisePatterns)

        // Remove current options
        if (genOptions.length > 0) {
            dropList.innerHTML = ''
        }

        // Create an option for each pattern
        for (let i = 0; i < genOptions.length; i++) {
            const nameString = `${genOptions[i]}`
            const newOption = document.createElement('option')
            newOption.value = nameString
            newOption.innerHTML = nameString

            dropList.appendChild(newOption)
        }
    }
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

    // Get z based on slider selection
    let steps = canvas.width / pixelSize
    $('#DOM_zSlider').max = (steps - 1)
    const z = $('#DOM_zSlider').value

    // Generate pattern and draw
    generateNoise(selPattern, z, seed)
}

function updateZ(el) {
    // Update label
    $("#DOM_zindex").innerHTML = `Z Index: ${el.value}`

    // Redraw pattern with new z index
    drawWorld(world, el.value)
}

////////////////////////////////////////////////////////
// Pattern Gen and Drawing
////////////////////////////////////////////////////////

function generateNoise(pat, firstZ, seed) {
    // Generate world
    world = [[[]]]
    world = generator.generateWorld({seed: seed, chunkSize: chunkSize, worldSize: worldSize, pattern: pat})

    // Draw pattern to canvas
    drawWorld(world, firstZ)
}

function drawTileHere(x, y, size, id) {
    // Get block from ID
    const block = blockTypes[id] || blockTypes[0]
    const textureID = block.textures.front || 0
    // Calculate ID offset
    const rows = 16
    const columns = 16
    let c = (textureID-1) % columns
    let r = Math.floor((textureID-1) / columns)
    // Draw
    ctx.drawImage(textureSheet, c*32, r*32, 32, 32, x*size, y*size, size, size)
}

function drawWorld(w, z) {
    // Get Z's world location
    const cSize = w[0][0][0].length
    const zChunk = Math.floor(z / cSize)
    const zBlock = z % cSize

    // Draw background
    ctx.fillStyle = `rgba( 0, 0, 0, 1 )`
    ctx.fillRect( 0, 0, canvas.width, canvas.height )

    const steps2D = 1

    // Loop through all chunks in world
    for (let cy = 0; cy < w.length; cy++) {
    for (let cx = 0; cx < w[cy].length; cx++) {
        const chunk = w[cy][cx][zChunk]
    
    // Loop through all blocks in chunk
    for (let y = 0; y < chunk.length; y++) {
    for (let x = 0; x < chunk[y].length; x++) {
        // Draw pixel
        let val = chunk[y][x][zBlock]
        //if (toleranceMode) val = (val > generator.noiseTolerance) ? 1 : 0
        if (val === 0) {
            for (let n = 0; n < steps2D; n++) {
                const nextZ = z+n+1
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
    }}}}
}
