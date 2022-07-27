/**
 * Shorthand for `document.querySelector()`
 * @param query: Class name or ID name string
 * @returns DOM element
 */
$ = (query) => document.querySelector(query);
$$ = (query) => document.querySelectorAll(query);

/**
 * Toggles a DOM element's display property
 * @param element: DOM element
 * @param defaultStyle: The element's default display style, (default is "inline-block")
 * @returns null
 */
function HideShowDOM(element, defaultStyle = "inline-block") {
    if (element.style.display != "none") element.style.display = "none";
    else element.style.display = defaultStyle;
}

/**
 * Sets the SRC of and enables the iframe element on the page. If no url is provided, this will disable/hide the iframe element
 * @param url: The url to use in the iframe
 * @returns null
 */
function SetEmbed(url = null) {
    const element = $('#embedded_content')
    const iframe = $("#embed_frame")
    if (url) {
        if (url.startsWith("<html>"))
            iframe.setAttribute("srcdoc", url)
        else iframe.src = url
        element.style.display = "inline-block"
    }
    else {
        iframe.src = ""
        element.style.display = "none"
    }
}

/**
 * Launches fullscreen mode
 * @returns null
 */
function launchFullscreen() {
    var element = document.documentElement
    if (element.requestFullscreen) { element.requestFullscreen() }
    else if (element.mozRequestFullScreen) { element.mozRequestFullScreen() }
    else if (element.webkitRequestFullscreen) { element.webkitRequestFullscreen() }
    else if (element.msRequestFullscreen) { element.msRequestFullscreen() }
}

/**
 * Exits fullscreen mode
 * @returns null
 */
function quitFullscreen() {
    var element = document.documentElement
    if (element.exitFullscreen) { element.exitFullscreen() }
    else if (element.mozCancelFullScreen) {	element.mozCancelFullScreen() }
    else if (element.webkitCancelFullScreen) { element.webkitCancelFullScreen() }
    else if (element.msExitFullscreen) { element.msExitFullscreen() }
}