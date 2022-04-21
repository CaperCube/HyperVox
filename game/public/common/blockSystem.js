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
const blockCats = { 
    // Functional categories
    damaging: 'damaging',
    noncollidable: 'noncollidable',
    unbreakable: 'unbreakable',
    zone: 'zone', // i.e. building-zones, no-gun-zones etc.
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
    transparent: 'transparent',
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
- BasicType "Solid" "Liquid"
- LiquidViscosity
*/

// getBlockByName(name) = blockTypes.filter(block => block.name === name) 
const blockTypes = [
    // 0x0000
    {
        name: 'air',
        categories: [blockCats.noncollidable, blockCats.unbreakable, blockCats.transparent],
        textures: { top: 255, bottom: 255, front: 255, back: 255, left: 255, right: 255 },
    },
    // 0x1000
    {
        name: 'crate',
        categories: [blockCats.decorative, blockCats.color.orange],
        textures: { top: 1, bottom: 1, front: 17, back: 17, left: 17, right: 17 },
    },
    // 0x2000
    {
        name: 'dirt-fine',
        categories: [blockCats.natural, blockCats.color.orange],
        textures: { top: 2, bottom: 2, front: 2, back: 2, left: 2, right: 2 },
    },
    // 0x3000
    {
        name: 'dirt',
        categories: [blockCats.natural, blockCats.color.orange],
        textures: { top: 3, bottom: 3, front: 3, back: 3, left: 3, right: 3 },
    },
    // 0x4000
    {
        name: 'grass',
        categories: [blockCats.natural, blockCats.color.green],
        textures: { top: 5, bottom: 3, front: 4, back: 4, left: 4, right: 4 },
    },
    // 0x5000
    {
        name: 'sand',
        categories: [blockCats.natural, blockCats.color.yellow],
        textures: { top: 6, bottom: 6, front: 6, back: 6, left: 6, right: 6 },
    },
    // 0x6000
    {
        name: 'steel-riveted',
        categories: [blockCats.color.grey],
        textures: { top: 7, bottom: 7, front: 7, back: 7, left: 7, right: 7 },
    },
    // 0x7000
    {
        name: 'steel-blocky',
        categories: [blockCats.color.grey],
        textures: { top: 8, bottom: 8, front: 8, back: 8, left: 8, right: 8 },
    },
    // 0x8000
    {
        name: 'copper-blocky',
        categories: [blockCats.color.orange],
        textures: { top: 9, bottom: 9, front: 9, back: 9, left: 9, right: 9 },
    },
    // 0x9000
    {
        name: 'capercube',
        categories: [blockCats.decorative, blockCats.color.blue],
        textures: { top: 10, bottom: 10, front: 10, back: 10, left: 10, right: 10 },
    },
    // 0xa000
    {
        name: 'glass',
        categories: [blockCats.decorative, blockCats.transparent, blockCats.color.grey],
        textures: { top: 11, bottom: 11, front: 11, back: 11, left: 11, right: 11 },
    },
    // 0xb000
    {
        name: 'head',
        categories: [blockCats.decorative, blockCats.color.green],
        textures: { top: 210, bottom: 242, front: 226, back: 228, left: 227, right: 225 },
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