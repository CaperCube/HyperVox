$ = (n) => document.querySelector(n);
$$ = (n) => document.querySelectorAll(n);
function HideShowDOM(o) {
    if (o.style.display != "none") o.style.display = "none";
    else o.style.display = "inline-block";
}
function launchFullscreen() {
    var element = document.documentElement
    if (element.requestFullscreen) { element.requestFullscreen() }
    else if (element.mozRequestFullScreen) { element.mozRequestFullScreen() }
    else if (element.webkitRequestFullscreen) { element.webkitRequestFullscreen() }
    else if (element.msRequestFullscreen) { element.msRequestFullscreen() }
}
function quitFullscreen() {
    var element = document.documentElement
    if (element.exitFullscreen) { element.exitFullscreen() }
    else if (element.mozCancelFullScreen) {	element.mozCancelFullScreen() }
    else if (element.webkitCancelFullScreen) { element.webkitCancelFullScreen() }
    else if (element.msExitFullscreen) { element.msExitFullscreen() }
}