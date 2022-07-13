////////////////////////////////////////////////////
// This is the system that handels all inventory items.
// Any pick-upable, selectable, or useable items in the game should be an Item()
// Example: Blocks can exist in the form they do now, but the player should pick-up / place and Item()
////////////////////////////////////////////////////

import { blockTypes } from "../../../../common/blockSystem.js";
import { sounds } from "../../resources.js"

export class ItemPickup {
    constructor(model = null, item = new Item()) {
        this.model = model
        this.item = item
    }
}

export class Item {
    constructor({
        itemName = 'item',
        itemID = 0,
        itemType = 'block',
        stackSize = 1,
        maxStackSize = 100, // 0 = infinate
    }) {
        // Identifiers
        this.itemName = itemName
        this.itemType = itemType
        this.itemID = itemID

        this.stackSize = stackSize
        this.maxStackSize = maxStackSize
        this.consumeable = true
        this.requireItem = null // For ammo and similar
    }

    // useItem(player, amount) {
    //     switch (this.itemType) {
    //         case 'block':
    //             // Place [amount] blocks
    //             // this.stackSize -= amount
    //             // if (this.stackSize <= 0) this.delete
    //             break;
    //         case 'item':
    //     }
    // }

    getItemImage() {
        // This is placeholder atm
        switch (this.itemType) {
            case 'block':
                return { 
                    material: null,
                    index: blockTypes[this.itemID]?.textures['front']
                }
            case 'item':
                return { 
                    material: null,
                    index: this.itemID // ToDo: Reference a different texture atlas
                }
            default:
                return { 
                    material: null,
                    index: this.itemID // ToDo: Reference a different texture atlas
                }
        }
    }
}

export class Inventory { // This specifically is a local player's hud-viewable inv
    constructor(hud) {
        this.hud = hud
        this.invSize = 9 // The max length of "this.items" anything over should be ignored
        this.hotbarSize = 3 // The number of slots in the inventory used as hotbar slots (example: 3 = the first 3 indexes or "this.items" are hotbar slots)
        this.items = [] // Array to store all items contained in this inventory
        this.selectedIndex = 0 // The index of the item currently selected
    }

    addItem(newItem) {
        // Check if this item exists in the inventory already
            // If found, check if the stack is full
                // If not full
                    // Add to stack
                    // newItem.delete
        // If not found, Check if empty slots exist
            // If slot exists
                // Add item
    }

    setSelected(idx) {
        this.selectedIndex = Math.abs(idx) % this.items.length
        if (this.hud) {
            const lower = ((this.selectedIndex-1) > -1)? (this.selectedIndex-1) : this.items.length-1
            const higher = ((this.selectedIndex+1) % (this.items.length))
            this.hud.invSlotIndexes = [
                this.items[lower].getItemImage().index,
                this.items[this.selectedIndex].getItemImage().index,
                this.items[higher].getItemImage().index
            ]
            this.hud.render()
        }
    }

    selectNext() {
        let idx = this.selectedIndex + 1
        if (idx > this.items.length-1) idx = 0
        this.setSelected(idx)
    }

    selectPrev() {
        let idx = this.selectedIndex - 1
        if (idx < 0) idx = this.items.length-1
        this.setSelected(idx)
    }

    useItem(clientGame, cursorLocation, idx) {
        const useItem = this.items[idx]
        if (useItem) { // Use this item if it exists
            // Do different actions based on type
            switch (useItem.itemType) {
                case "block":
                    // Place block
                    clientGame.updateSingleBlock(cursorLocation, useItem.itemID)
                    break
                case "item":
                    // Use item
                    // ToDo: Do some action here
                    console.log("Use item")
                    break
                case "gun":
                    // Use gun
                    // ToDo: Use gun here
                    console.log("Shoot")
                    if (sounds.LASERGUN_SHOOT_1) sounds.LASERGUN_SHOOT_1.play()
                    break
                default:
                    // Something?
                    console.log(`${useItem.itemName || "unknown item"} cannot be used`)
                    break
            }
        }
    }
}

//////////////////////////////////////
// Create inventory
//////////////////////////////////////

export const makeCreativeInventory = (hud = null) => {
    const cInv = new Inventory(hud)

    // ~~~~~~~~~~~~~~~~~~~~~~~~~
    // Temp gun item    
    const gun = new Item({
        itemName: "gun",
        itemID: 193, // maybe 191 or 193
        itemType: 'gun',
        stackSize: 1,
        maxStackSize: 0,
    })
    cInv.items.push(gun)
    // ~~~~~~~~~~~~~~~~~~~~~~~~~

    // Fill inv
    for (let i = 1; i < blockTypes.length; i++) {
        const b = blockTypes[i]
        // if (b.categories.includes('green')) {
            const newItem = new Item({
                itemName: b.name,
                itemID: i,
                itemType: 'block',
                stackSize: 1,
                maxStackSize: 0,
            })

            // Add item to inv
            cInv.items.push(newItem)
        // }
    }

    // Set length
    cInv.invSize = cInv.items.length

    return cInv
}