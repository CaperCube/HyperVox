$ = (n) => document.querySelector(n);
$$ = (n) => document.querySelectorAll(n);
function HideShowDOM(o) {
    if (o.style.display != "none") o.style.display = "none";
    else o.style.display = "inline-block";
}