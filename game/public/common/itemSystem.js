// These should represent the items in-game, and can be referenced in inventory slots by ID

//
// ToDo: Migrate items to here
//

// const itemTypes = [
//     // 0x0000
//     {
//         name: "gun"
//     }
// ]


// {
//     itemName = 'item',
//     itemID = 1,
//     itemType = 'block',
//     stackSize = 1,
//     maxStackSize = 100, // 0 = infinate
// }

////////////////////////////////////
// Consumables
////////////////////////////////////
export function consume(item) {
    //...
}

////////////////////////////////////
// Guns
////////////////////////////////////
export function shoot(item) {
    // ToDo: Check for ammo item in inventory
    //...
    
    // If allowed, shoot
    //...

    // ToDo: Send brain message
    //...
}

export function reload(item) {
    //...
}