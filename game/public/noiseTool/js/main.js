// Canvas vars
const canvas = $('#main-canvas')
const ctx = canvas.getContext('2d')
canvas.width = canvas.height = 512

// Noise vars
let pixelSize = canvas.width/32
let pattern = [[]]
const genNoise = new perlinNoise3d()
const noiseTolerance = 0.5
const toleranceMode = true
const noiseScale = 0.1


// String to number (this is and should be the same as it is in the game)
const stringToSeed = (s) => { return s.split('').map(x=>x.charCodeAt(0)).reduce((a,b)=>a+b) }

////////////////////////////////////////////////////////
// DOM function
////////////////////////////////////////////////////////

function DOMNoiseFnc() {
    // Get selected function
    const selPattern = perlinNoise // This should be an optin in a dropdown list
    
    // Get seed based on choice
    const random = true // This should be a toggle option
    const seed = random ? `${Math.random()}` : $('#DOM_seed').value
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
    // Draw pattern with new z index
    drawPattern(pattern, el.value)

    // Update label
    $("#DOM_zindex").innerHTML = `Z Index: ${el.value}`
}

////////////////////////////////////////////////////////
// Pattern Gen and Drawing
////////////////////////////////////////////////////////

function generateNoise(func, firstZ, seed) {
    // Set number of steps
    let steps = canvas.width / pixelSize

    // Generate pattern
    for (let y = 0; y < steps; y++) {
    pattern[y] = []
    for (let x = 0; x < steps; x++) {
    pattern[y][x] = []
    for (let z = 0; z < steps; z++) {
        // Fill pixel here
        pattern[y][x][z] = func(x,y,z,seed)
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

// Basic
function basicNoise(x,y,z,seed) {
    return Math.random()
}

// Perlin
function perlinNoise(x,y,z,seed) {
    // Return noise
    return genNoise.get(x*noiseScale,y*noiseScale,z*noiseScale)
}