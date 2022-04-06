import { imageSRC } from "/client/js/resources.js"
import ChunkGenerator from "/brain/gen/world/chunkGen.js"

// Canvas vars
const canvas = $('#main-canvas')
const ctx = canvas.getContext('2d')
canvas.width = canvas.height = 512
const textureSheet = new Image(512,512)
textureSheet.src = imageSRC.Tiles

// Noise vars
const generator = new ChunkGenerator()
let resolution = 32
let pixelSize = canvas.width/resolution
let pattern = [[]]

const genNoise = new perlinNoise3d() // ToDo: Remove this and use ChunkGenerator instead
const noiseTolerance = 0.5
let noiseScale = 0.09


// String to number (this is and should be the same as it is in the game)
const stringToSeed = (s) => { return s.split('').map(x=>x.charCodeAt(0)).reduce((a,b)=>a+b) }

////////////////////////////////////////////////////////
// DOM function
////////////////////////////////////////////////////////
$("#DOM_generateBttn").onclick = DOMNoiseFnc
$("#DOM_zSlider").oninput = () => { updateZ($("#DOM_zSlider")) }

function DOMNoiseFnc() {
    // Get selected function
    const selPattern = generator.basicPattern//customNoise //perlinNoise // This should be an optin in a dropdown list
    
    // Get seed based on choice
    const random = !$('#DOM_useSeed').checked // This should be a toggle option
    const seed = random ? `${Math.random()}` : $('#DOM_seed').value
    
    // Generator settings
    //noiseScale = $('#DOM_scale').value

    // Set seed
    genNoise.noiseSeed(stringToSeed(seed))
    generator.noiseAlgorithm.noiseSeed(stringToSeed(seed))

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
    drawPattern(pattern, el.value)
}

////////////////////////////////////////////////////////
// Pattern Gen and Drawing
////////////////////////////////////////////////////////

function generateNoise(func, firstZ) {
    // Set number of steps
    let steps = canvas.width / pixelSize
    pattern = [[[]]]

    // Generate pattern
    for (let y = 0; y < steps; y++) {
    pattern[y] = []
    for (let x = 0; x < steps; x++) {
    pattern[y][x] = []
    for (let z = 0; z < steps; z++) {
        // Fill pixel here
        let pos = { x: x, y: (resolution-y), z: z }
        pattern[y][x][z] = func( pos.x, pos.y, pos.z )
    }}}

    // Draw pattern to canvas
    drawPattern(pattern, firstZ)
}

function drawTileHere(x, y, size, id) {
    // Calculate ID offset
    const rows = 16
    const columns = 16
    let c = (id-1) % columns
    let r = Math.floor((id-1) / columns)
    // Draw
    ctx.drawImage(textureSheet, c*32, r*32, 32, 32, x*size, y*size, size, size)
}

function drawPattern(p, z) {
    // Loop through all pixels in pattern
    for (let y = 0; y < p.length; y++) {
    for (let x = 0; x < p[y].length; x++) {
        // Draw pixel
        let val = p[y][x][z]
        //if (toleranceMode) val = (val > noiseTolerance) ? 1 : 0
        ctx.fillStyle = `rgb( 0, 0, 0 )`
        if (val === 0) ctx.fillRect( x*pixelSize, y*pixelSize, pixelSize, pixelSize )
        else drawTileHere(x, y, pixelSize, val)
    }}
}

////////////////////////////////////////////////////////
// Noise patterns
// ToDo: move noise generators from here to `chunkGen.js`
////////////////////////////////////////////////////////
const clamp = function(val, min, max) { return Math.min(Math.max(val, min), max) }

// Basic
function basicNoise( x, y, z ) {
    let noise = Math.random()

    // gen blockID
    let blockID = 0
    if (noise > noiseTolerance) {
        blockID = 1 + Math.floor(Math.random() * 9)
    }

    return blockID
}

// Perlin
function perlinNoise( x, y, z ) {
    // Return noise
    let noise = genNoise.get( x*noiseScale, y*noiseScale, z*noiseScale )

    // gen blockID
    let blockID = 0
    if (noise > noiseTolerance) {
        blockID = 1 + Math.floor(Math.random() * 9)
    }
    
    return blockID
}

// Custom
function customNoise( x, y, z ) {
    // Return noise
    function getNoiseVal( x, y, z ) {
        x=x*noiseScale
        y=y*noiseScale
        z=z*noiseScale
        let noise = genNoise.get( x, y, z )
        noise += 1 / ((y+1)*2)
        noise -= 0.25
        return noise
    }
    
    const baseNoise = getNoiseVal( x, y, z )
    const blockAbove = getNoiseVal( x, y+1, z )
    const blockBelow = getNoiseVal( x, y-1, z )
    const blockMuchAbove = getNoiseVal( x, y+3, z )

    // gen blockID
    let blockID = 0
    if (baseNoise > noiseTolerance) {
        if (blockAbove <= noiseTolerance) blockID = 4
        else if (blockMuchAbove > noiseTolerance) blockID = 3
        else blockID = 2

        if (blockBelow <= noiseTolerance) blockID = 3
    }

    return blockID
}

