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