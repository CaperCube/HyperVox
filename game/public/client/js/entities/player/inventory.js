////////////////////////////////////////////////////
// This is the system that handels all inventory items.
// Any pick-upable, selectable, or useable items in the game should be an Item()
// Example: Blocks can exist in the form they do now, but the player should pick-up / place and Item()
////////////////////////////////////////////////////

import { blockTypes } from "../../../../common/blockSystem.js";

class ItemPickup {
    constructor(model = null, item = new Item()) {
        this.model = model
        this.item = item
    }
}

class Item {
    constructor({
        itemName = 'item',
        itemID = 0,
        itemType = 'block',
        stackSize = 1,
        maxStackSize = 100,
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

    useItem(player, amount) {
        switch (this.itemType) {
            case 'block':
                // Place [amount] blocks
                // this.stackSize -= amount
                // if (this.stackSize <= 0) this.delete
                break;
            case 'item':
        }
    }

    getItemImage() {
        // ToDo: this is placeholder atm
        switch (this.itemType) {
            case 'block':
                return { 
                    material: null,
                    index: blockTypes[this.itemID].textures.front
                }
            case 'item':
                return { 
                    material: null,
                    index: blockTypes[this.itemID].textures.front
                }
        }
    }
}

class Inventory {
    constructor() {
        this.invSize = 9 // The max length of "this.items" anything over should be ignored
        this.hotbarSize = 3 // The number of slots in the inventory used as hotbar slots (example: 3 = the first 3 indexes or "this.items" are hotbar slots)
        this.items = [] // Array to store all items contained in this inventory
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
}

const gun = Item({
    itemID: 0,
    itemType: 'item',
    stackSize: 1,
    maxStackSize: 1,

})