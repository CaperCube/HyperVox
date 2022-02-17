// Canvas vars
const canvas = $('#main-canvas')
const ctx = canvas.getContext('2d')
canvas.width = canvas.height = 512

// Noise vars
let resolution = 32
let pixelSize = canvas.width/resolution
let pattern = [[]]

// let genSettings = {
//     useSeed: !$('#DOM_useSeed').checked,
//     seed: $('#DOM_seed').value,
//     toleranceMode: $('#DOM_useTolerance').checked,
//     noiseTolerance = 0.5,
//     noiseScale = 0.1
// }

const genNoise = new perlinNoise3d()
const noiseTolerance = 0.5
let toleranceMode = $('#DOM_useTolerance').checked
let noiseScale = 0.1


// String to number (this is and should be the same as it is in the game)
const stringToSeed = (s) => { return s.split('').map(x=>x.charCodeAt(0)).reduce((a,b)=>a+b) }

////////////////////////////////////////////////////////
// DOM function
////////////////////////////////////////////////////////

function DOMNoiseFnc() {
    // Get selected function
    const selPattern = customNoise//perlinNoise // This should be an optin in a dropdown list
    
    // Get seed based on choice
    const random = !$('#DOM_useSeed').checked // This should be a toggle option
    const seed = random ? `${Math.random()}` : $('#DOM_seed').value
    
    // Generator settings
    toleranceMode = $('#DOM_useTolerance').checked
    //noiseScale = $('#DOM_scale').value

    // Set seed
    genNoise.noiseSeed(stringToSeed(seed))

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

function updateTolerance(el) {
    // Update mode
    toleranceMode = $('#DOM_useTolerance').checked

    // Redraw pattern
    drawPattern(pattern, $('#DOM_zSlider').value)
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
        let pos = { x: x*noiseScale, y: (resolution-y)*noiseScale, z: z*noiseScale }
        pattern[y][x][z] = func( pos.x, pos.y, pos.z )
    }}}

    // Draw pattern to canvas
    drawPattern(pattern, firstZ)
}

function drawPattern(p, z) {
    // Loop through all pixels in pattern
    for (let y = 0; y < p.length; y++) {
    for (let x = 0; x < p[y].length; x++) {
        // Draw pixel
        let val = p[y][x][z]
        if (toleranceMode) val = (val > noiseTolerance) ? 1 : 0
        ctx.fillStyle = `rgb( ${val*255}, ${val*255}, ${val*255} )`
        ctx.fillRect( x*pixelSize, y*pixelSize, pixelSize, pixelSize )
    }}
}

////////////////////////////////////////////////////////
// Noise patterns
////////////////////////////////////////////////////////
const clamp = function(val, min, max) { return Math.min(Math.max(val, min), max) }

// Basic
function basicNoise( x, y, z ) {
    return Math.random()
}

// Perlin
function perlinNoise( x, y, z ) {
    // Return noise
    let noise = genNoise.get( x, y, z )
    return noise
}

// Custom
function customNoise( x, y, z ) {
    // Return noise
    let noise = genNoise.get( x, y*2, z )
    noise += 1 / ((y+1)*2)
    noise -= 0.25

    return clamp(noise, 0, 1)
}

