// Allows accessing object props via string (i.e. camX = getPropByString(obj, 'camera.position.x'))
// Source: https://stackoverflow.com/questions/6906108/in-javascript-how-can-i-dynamically-get-a-nested-property-of-an-object
// ToDo: make sure this returns null if no exact match is found
export function getPropByString(obj, propString) {
    if (!propString)
        return obj
  
    var prop, props = propString.split('.')
  
    for (var i = 0, iLen = props.length - 1; i < iLen; i++) {
        prop = props[i]
  
        var candidate = obj[prop]
        if (candidate !== undefined) {
            obj = candidate
        }
        else break
    }
    return obj[props[i]]
}

// Clamps a value to a min and max range
export function clamp (val, min, max) { return Math.min(Math.max(val, min), max) }

export function randomIndex(ar) {
    const min = 0
    const max = Math.floor(ar.length - 1)
    return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomArray(arr) {
    return arr[randomIndex(arr)]
}

export const filterChatMessageCode = (myString) => {
    // Replaces &, >, <, and " with their respective html char codes
    return myString.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}