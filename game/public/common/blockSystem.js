////////////////////////////////////////////////////
// This is where we should store all of the block definitions
// (or maybe seperate them into json files)
////////////////////////////////////////////////////

// A single hex value to represent the block ID, orientation, damage value, and state (open/closed, other)
// `var block = 0x00000000`
// 0x 0000      00      0       0
//    typeID   Rot     Damage  State

function setBlock(block, type = blocks.air.typeID, options = { newRot: null, resetDamage: true, resetState: true }) {

}

const getBlockByName = (name) => blockTypes.filter(block => block.name === name)[0]
const getBlocksByName = (name) => blockTypes.filter(block => block.name.includes(name))
const getBlocksByCat = (cat) => blockTypes.filter(block => block.categories.includes(cat))
const getBlocksByCats = (cats) => {
    let result = blockTypes.filter(block => block.categories.includes(cats[0]))
    if (cats.length > 1) {
        for (let i = 1; i < cats.length; i++) {
            result = result.filter(block => block.categories.includes(cats[i]))
        }
    }
    return result
}
function getBlockType(blockID) {}
function setBlockType(blockID) {}

function getBlockRot(blockID) {}

function getBlockDamage(blockID) {}

function getBlockState(blockID) {}

// Blocks can have multiple categories
const blockCats = { // ToDo: possibly rename this to "blockTags"
    // Functional categories
    checkpoint: 'checkpoint',
    damaging: 'damaging',
    fluid: 'fluid',
    noncollidable: 'noncollidable',
    unbreakable: 'unbreakable',
    transparent: 'transparent',
    zone: 'zone', // i.e. building-zones, no-gun-zones etc.
    // Racing categories
    raceStart: 'raceStart',
    raceEnd: 'raceEnd',
    // Visual categories
    color: {
        red: 'red',
        orange: 'orange',
        yellow: 'yellow',
        green: 'green',
        blue: 'blue',
        indigo: 'indigo',
        violet: 'violet',
        white: 'white',
        grey: 'grey',
        black: 'black'
    },
    decorative: 'decorative',
    natural: 'natural',
}

/*
Block Props:
- Block ID
- Block mesh
- Collision shape
- Interaction function
- Friction
- Bouncieness
- Possible Directions
- LiquidViscosity
*/

const blockTypes = [
    // 0x0000
    {
        name: 'air',
        categories: [blockCats.noncollidable, blockCats.unbreakable, blockCats.transparent],
        textures: { top: 255, bottom: 255, front: 255, back: 255, left: 255, right: 255 },
    },
    // 0x0001
    {
        name: 'crate',
        categories: [blockCats.decorative, blockCats.color.orange],
        textures: { top: 1, bottom: 1, front: 17, back: 17, left: 17, right: 17 },
    },
    // 0x0002
    {
        name: 'dirt-fine',
        categories: [blockCats.natural, blockCats.color.orange],
        textures: { top: 2, bottom: 2, front: 2, back: 2, left: 2, right: 2 },
    },
    // 0x0003
    {
        name: 'dirt',
        categories: [blockCats.natural, blockCats.color.orange],
        textures: { top: 3, bottom: 3, front: 3, back: 3, left: 3, right: 3 },
    },
    // 0x0004
    {
        name: 'grass',
        categories: [blockCats.natural, blockCats.color.green],
        textures: { top: 5, bottom: 3, front: 4, back: 4, left: 4, right: 4 },
    },
    // 0x0005
    {
        name: 'sand',
        categories: [blockCats.natural, blockCats.color.yellow],
        textures: { top: 6, bottom: 6, front: 6, back: 6, left: 6, right: 6 },
    },
    // 0x0006
    {
        name: 'steel-riveted',
        categories: [blockCats.color.grey],
        textures: { top: 7, bottom: 7, front: 7, back: 7, left: 7, right: 7 },
    },
    // 0x0007
    {
        name: 'steel-blocky',
        categories: [blockCats.color.grey],
        textures: { top: 8, bottom: 8, front: 8, back: 8, left: 8, right: 8 },
    },
    // 0x0008
    {
        name: 'copper-blocky',
        categories: [blockCats.color.orange],
        textures: { top: 9, bottom: 9, front: 9, back: 9, left: 9, right: 9 },
    },
    // 0x0009
    {
        name: 'capercube',
        categories: [blockCats.decorative, blockCats.color.blue],
        textures: { top: 10, bottom: 10, front: 10, back: 10, left: 10, right: 10 },
    },
    // 0x000a
    {
        name: 'glass',
        categories: [blockCats.decorative, blockCats.transparent, blockCats.color.grey],
        textures: { top: 11, bottom: 11, front: 11, back: 11, left: 11, right: 11 },
    },
    // 0x000b
    {
        name: 'head',
        categories: [blockCats.decorative, blockCats.color.green],
        textures: { top: 210, bottom: 242, front: 226, back: 228, left: 227, right: 225 },
        bounciness: 0.8,
    },
    // 0x000c
    {
        name: 'log',
        categories: [blockCats.natural, blockCats.color.orange],
        textures: { top: 13, bottom: 13, front: 12, back: 12, left: 12, right: 12 },
    },
    // 0x000d
    {
        name: 'leaves',
        categories: [blockCats.natural, blockCats.transparent, blockCats.color.green],
        textures: { top: 14, bottom: 14, front: 14, back: 14, left: 14, right: 14 },
    },
    // 0x000e
    {
        name: 'stone-pillar',
        categories: [blockCats.color.grey, blockCats.decorative],
        textures: { top: 16, bottom: 16, front: 15, back: 15, left: 15, right: 15 },
    },
    // 0x000f
    {
        name: 'stone-block-white',
        categories: [blockCats.color.white, blockCats.decorative],
        textures: { top: 16, bottom: 16, front: 16, back: 16, left: 16, right: 16 },
    },
    // 0x0010
    {
        name: 'stone-block-grey',
        categories: [blockCats.color.grey, blockCats.decorative],
        textures: { top: 32, bottom: 32, front: 32, back: 32, left: 32, right: 32 },
    },
    // 0x0012
    {
        name: 'stone-block-black',
        categories: [blockCats.color.black, blockCats.decorative],
        textures: { top: 48, bottom: 48, front: 48, back: 48, left: 48, right: 48 },
    },
    // 0x0013
    {
        name: 'stone-block-red',
        categories: [blockCats.color.red, blockCats.decorative],
        textures: { top: 64, bottom: 64, front: 64, back: 64, left: 64, right: 64 },
    },
    // 0x0014
    {
        name: 'stone-block-orange',
        categories: [blockCats.color.orange, blockCats.decorative],
        textures: { top: 80, bottom: 80, front: 80, back: 80, left: 80, right: 80 },
    },
    // 0x0015
    {
        name: 'stone-block-yellow',
        categories: [blockCats.color.yellow, blockCats.decorative],
        textures: { top: 96, bottom: 96, front: 96, back: 96, left: 96, right: 96 },
    },
    // 0x0016
    {
        name: 'stone-block-green',
        categories: [blockCats.color.green, blockCats.decorative],
        textures: { top: 112, bottom: 112, front: 112, back: 112, left: 112, right: 112 },
    },
    // 0x0017
    {
        name: 'stone-block-blue',
        categories: [blockCats.color.blue, blockCats.decorative],
        textures: { top: 128, bottom: 128, front: 128, back: 128, left: 128, right: 128 },
    },
    // 0x0018
    {
        name: 'stone-block-indigo',
        categories: [blockCats.color.indigo, blockCats.decorative],
        textures: { top: 144, bottom: 144, front: 144, back: 144, left: 144, right: 144 },
    },
    // 0x0019
    {
        name: 'stone-block-violet',
        categories: [blockCats.color.violet, blockCats.decorative],
        textures: { top: 160, bottom: 160, front: 160, back: 160, left: 160, right: 160 },
    },
    // 0x001a
    {
        name: 'water',
        categories: [blockCats.natural, blockCats.transparent, blockCats.fluid, blockCats.color.blue],
        textures: { top: 18, bottom: 18, front: 18, back: 18, left: 18, right: 18 },
        viscosity: 3,
    },
    // 0x001b
    {
        name: 'lava',
        categories: [blockCats.natural, blockCats.transparent, blockCats.damaging, blockCats.fluid, blockCats.color.red],
        textures: { top: 34, bottom: 34, front: 34, back: 34, left: 34, right: 34 },
        viscosity: 6,
        damage: 10,
    },
    // 0x001c
    {
        name: 'stone',
        categories: [blockCats.natural, blockCats.color.grey],
        textures: { top: 21, bottom: 21, front: 21, back: 21, left: 21, right: 21 },
    },
    // 0x001d
    {
        name: 'stone-clumpy',
        categories: [blockCats.color.grey],
        textures: { top: 22, bottom: 22, front: 22, back: 22, left: 22, right: 22 },
    },
    // 0x001e
    {
        name: 'gears',
        categories: [blockCats.color.grey],
        textures: { top: 7, bottom: 7, front: 23, back: 23, left: 23, right: 23 },
    },
    // 0x001f
    {
        name: 'grate',
        categories: [blockCats.color.grey, blockCats.transparent],
        textures: { top: 24, bottom: 24, front: 24, back: 24, left: 24, right: 24 },
    },
    // 0x0020
    {
        name: 'death',
        categories: [blockCats.color.red, blockCats.damaging, blockCats.transparent],
        // textures: { top: 255, bottom: 255, front: 255, back: 255, left: 255, right: 255 },
        // textures: { top: 252, bottom: 252, front: 252, back: 252, left: 252, right: 252 },
        textures: { top: 0, bottom: 0, front: 0, back: 0, left: 0, right: 0 },
        damage: 1000
    },
    // 0x0021
    {
        name: 'finish-line',
        categories: [blockCats.color.black, blockCats.color.white, blockCats.race, blockCats.raceEnd],
        textures: { top: 240, bottom: 240, front: 240, back: 240, left: 240, right: 240 },
    },
    // 0x0022
    {
        name: 'start-line',
        categories: [blockCats.color.green, blockCats.race, blockCats.raceStart],
        textures: { top: 239, bottom: 239, front: 239, back: 239, left: 239, right: 239 },
    },
    // 0x0022
    {
        name: 'respawn-point',
        categories: [blockCats.color.grey, blockCats.color.green, blockCats.checkpoint],
        textures: { top: 238, bottom: 238, front: 238, back: 238, left: 238, right: 238 },
    },
    // 0x0023
    {
        name: 'dialogue-box',
        categories: [blockCats.color.grey, blockCats.color.green],
        textures: { top: 237, bottom: 237, front: 237, back: 237, left: 237, right: 237 },
    },
    // 0x0023
    {
        name: 'info-box',
        categories: [blockCats.color.grey, blockCats.color.green],
        textures: { top: 236, bottom: 236, front: 236, back: 236, left: 236, right: 236 },
    },
    // 0x0024
    {
        name: 'respawn-zone',
        categories: [blockCats.checkpoint, blockCats.noncollidable, blockCats.transparent, blockCats.color.green],
        textures: { top: 254, bottom: 254, front: 254, back: 254, left: 254, right: 254 },
    },
]

export {
    // Functions
    setBlock,
    getBlockByName,
    getBlocksByName,
    getBlocksByCat,
    getBlocksByCats,

    getBlockType,
    setBlockType,
    getBlockRot,
    getBlockDamage,
    getBlockState,

    // Objects
    blockCats,
    blockTypes
}