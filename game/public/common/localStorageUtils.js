// Test to see if local storage is allowed
export const localStorageIsAllowed = () => {
    var test = 'test'
    try {
        localStorage.setItem(test, test)
        localStorage.removeItem(test)
        return true
    } catch(e) {
        return false
    }
}