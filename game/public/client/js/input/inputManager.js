function testButtonDown() {
    console.log(Object.values(this)[0] + " down");
}

function testButtonUp() {
    //console.log(Object.values(this)[0] + " up");
}

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// Gamepad inputs
//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

// var gamepads = {};

// // https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API

// function gamepadHandler(event, connecting) {
//   var gamepad = event.gamepad;
//   // Note:
//   // gamepad === navigator.getGamepads()[gamepad.index]

//   if (connecting) {
//     gamepads[gamepad.index] = gamepad;
//   } else {
//     delete gamepads[gamepad.index];
//   }
// }

// window.addEventListener("gamepadconnected", function(e) { gamepadHandler(e, true); }, false);
// window.addEventListener("gamepaddisconnected", function(e) { gamepadHandler(e, false); }, false);

// https://xtrp.io/blog/2020/12/15/how-to-use-the-html5-gamepad-api/
const analogueTolerance = 0.05
const GamepadButtons = {
    lsUp: {name: "leftStickUp", code: 0, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    lsDown: {name: "leftStickDown", code: 0, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    lsLeft: {name: "leftStickLeft", code: 0, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    lsRight: {name: "leftStickRight", code: 0, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    a: {name: "a", code: 0, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    b: {name: "b", code: 1, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    x: {name: "x", code: 2, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    y: {name: "y", code: 3, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
}

setInterval(() => {
    const myGamepad = navigator.getGamepads()[0] // use the first gamepad

    // console.log(`Left stick at (${myGamepad.axes[0]}, ${myGamepad.axes[1]})` );
    // console.log(`Right stick at (${myGamepad.axes[2]}, ${myGamepad.axes[3]})` );
    if (myGamepad) {
        // this.selectedScene.elements[0].text = `X: ${Math.round(myGamepad.axes[0] * 100) / 100}`
        // this.selectedScene.elements[1].text = `Y: ${Math.round(myGamepad.axes[1] * 100) / 100}`

        // Left Stick
        // Right
        if (myGamepad.axes[0] > analogueTolerance) {
            if (!GamepadButtons.lsRight.pressed) {
                GamepadButtons.lsRight.pressed = true
                GamepadButtons.lsRight.onPress()
            }
        } else if (GamepadButtons.lsRight.pressed) {
            GamepadButtons.lsRight.pressed = false
            GamepadButtons.lsRight.onRelease()
        }

        // Left
        if (myGamepad.axes[0] < (-1 * analogueTolerance)) {
            if (!GamepadButtons.lsLeft.pressed) {
                GamepadButtons.lsLeft.pressed = true
                GamepadButtons.lsLeft.onPress()
            }
        } else if (GamepadButtons.lsLeft.pressed) {
            GamepadButtons.lsLeft.pressed = false
            GamepadButtons.lsLeft.onRelease()
        }

        // Up
        if (myGamepad.axes[1] < (-1 * analogueTolerance)) {
            if (!GamepadButtons.lsUp.pressed) {
                GamepadButtons.lsUp.pressed = true
                GamepadButtons.lsUp.onPress()
            }
        } else if (GamepadButtons.lsUp.pressed) {
            GamepadButtons.lsUp.pressed = false
            GamepadButtons.lsUp.onRelease()
        }

        // Down
        if (myGamepad.axes[1] > analogueTolerance) {
            if (!GamepadButtons.lsDown.pressed) {
                GamepadButtons.lsDown.pressed = true
                GamepadButtons.lsDown.onPress()
            }
        } else if (GamepadButtons.lsDown.pressed) {
            GamepadButtons.lsDown.pressed = false
            GamepadButtons.lsDown.onRelease()
        }

        // myGamepad.axes[1]

        // Right stick
        // myGamepad.axes[2]
        // myGamepad.axes[3]

        // Buttons
        // A or X
        if (myGamepad.buttons[0].pressed && !GamepadButtons.a.pressed) {
            GamepadButtons.a.pressed = true
            GamepadButtons.a.onPress()
        } else {
            GamepadButtons.a.pressed = false
            GamepadButtons.a.onRelease()
        }

        // B or O
        if (myGamepad.buttons[1].pressed && !GamepadButtons.b.pressed) {
            GamepadButtons.b.pressed = true
            GamepadButtons.b.onPress()
        } else {
            GamepadButtons.b.pressed = false
            GamepadButtons.b.onRelease()
        }

        // X or Square
        if (myGamepad.buttons[2].pressed && !GamepadButtons.x.pressed) {
            GamepadButtons.x.pressed = true
            GamepadButtons.x.onPress()
        } else {
            GamepadButtons.x.pressed = false
            GamepadButtons.x.onRelease()
        }

        // Y or Triangle
        if (myGamepad.buttons[3].pressed && !GamepadButtons.y.pressed) {
            GamepadButtons.y.pressed = true
            GamepadButtons.y.onPress()
        } else {
            GamepadButtons.y.pressed = false
            GamepadButtons.y.onRelease()
        }
    }
}, 30) // print axes 10 times per second

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// Keyboard inputs
//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

const Buttons = {
    // if input
    isInputFocused: false, // ToDo: Adjust how this works so we can use "Buttons" in menus
    // mouse buttons
    lmb: {name: "left mouse", type: "mouse", pressed: false, onPress: testButtonDown, onRelease: testButtonUp}, // left mouse button
    rmb: {name: "right mouse", type: "mouse", pressed: false, onPress: testButtonDown, onRelease: testButtonUp}, // right mouse button
    mmb: {name: "middle mouse", type: "mouse", pressed: false, onPress: testButtonDown, onRelease: testButtonUp}, // middle mouse button
    scrollUp: {name: "scroll up", type: "mouse", pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    scrollDown: {name: "scroll down", type: "mouse", pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    //
    backspace: {name: "backspace", code: 8, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    tab: {name: "tab", code: 9, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    enter: {name: "enter", code: 13, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    shift: {name: "shift", code: 16, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    control: {name: "control", code: 17, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    alt: {name: "alt", code: 18, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    caps: {name: "capslock", code: 20, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    escape: {name: "escape", code: 27, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    space: {name: "space", code: 32, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    pageUp: {name: "pageUp", code: 33, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    pageDown: {name: "pageDown", code: 34, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    end: {name: "end", code: 35, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    home: {name: "home", code: 36, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    left: {name: "left", code: 37, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    up: {name: "up", code: 38, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    right: {name: "right", code: 39, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    down: {name: "down", code: 40, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    insert: {name: "insert", code: 45, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    delete: {name: "delete", code: 46, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    zero: {name: "0", code: 48, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    one: {name: "1", code: 49, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    two: {name: "2", code: 50, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    three: {name: "3", code: 51, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    four: {name: "4", code: 52, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    five: {name: "5", code: 53, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    six: {name: "6", code: 54, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    seven: {name: "7", code: 55, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    eight: {name: "8", code: 56, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    nine: {name: "9", code: 57, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    a: {name: "a", code: 65, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    b: {name: "b", code: 66, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    c: {name: "c", code: 67, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    d: {name: "d", code: 68, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    e: {name: "e", code: 69, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    f: {name: "f", code: 70, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    g: {name: "g", code: 71, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    h: {name: "h", code: 72, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    i: {name: "i", code: 73, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    j: {name: "j", code: 74, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    k: {name: "k", code: 75, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    l: {name: "l", code: 76, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    m: {name: "m", code: 77, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    n: {name: "n", code: 78, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    o: {name: "o", code: 79, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    p: {name: "p", code: 80, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    q: {name: "q", code: 81, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    r: {name: "r", code: 82, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    s: {name: "s", code: 83, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    t: {name: "t", code: 84, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    u: {name: "u", code: 85, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    v: {name: "v", code: 86, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    w: {name: "w", code: 87, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    x: {name: "x", code: 88, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    y: {name: "y", code: 89, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    z: {name: "z", code: 90, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    semicolon: {name: "semicolon", code: 186, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    equals: {name: "equals", code: 187, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    comma: {name: "comma", code: 188, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    minus: {name: "minus", code: 189, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    period: {name: "period", code: 190, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    slash: {name: "slash", code: 191, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    backquote: {name: "backquote", code: 192, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    bracketLeft: {name: "bracketLeft", code: 219, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    backslash: {name: "backslash", code: 220, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    bracketRight: {name: "bracketRight", code: 221, pressed: false, onPress: testButtonDown, onRelease: testButtonUp},
    quote: {name: "quote", code: 222, pressed: false, onPress: testButtonDown, onRelease: testButtonUp}
}

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// Events
//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

document.addEventListener('keydown', KeyDown);
document.addEventListener('keyup', KeyUp);
document.addEventListener('mousedown', MouseDown);
document.addEventListener('mouseup', MouseUp);
document.addEventListener('wheel', MouseScroll);

function KeyDown(e) {
    // loop through all buttons, and set pressed key to true
    if (!e.repeat) {
        for (var i = 0; i < Object.keys(Buttons).length; i++) {
            var thisBtn = Object.entries(Buttons)[i];
            if (thisBtn[1].hasOwnProperty("code")) {
                if (thisBtn[1].code == e.keyCode)
                {
                    if (Buttons.isInputFocused) {
                        thisBtn[1].pressed = true;
                        if (thisBtn[1].hasOwnProperty("onPress")) thisBtn[1].onPress(e);
                    }
                    else if (thisBtn[1].pressed) {
                        thisBtn[1].pressed = false;
                        if (thisBtn[1].hasOwnProperty("onPress")) thisBtn[1].onRelease(e);
                    }
                }
            }
        }
    }
    // Prevent default actions for space
    if (e.keyCode === 32) {
        // e.preventDefault();
    }
    if (e.keyCode === 27) {
        Buttons.isInputFocused = false
    }
}

function KeyUp(e) {
    // loop through all buttons, and set released key to false
    if (Buttons.isInputFocused) {
        for (var i = 0; i < Object.keys(Buttons).length; i++) {
            var thisBtn = Object.entries(Buttons)[i];
            if (thisBtn[1].hasOwnProperty("code")) {
                if (thisBtn[1].code == e.keyCode)
                {
                    thisBtn[1].pressed = false;
                    if (thisBtn[1].hasOwnProperty("onRelease")) thisBtn[1].onRelease(e);
                }
            }
        }
    }
}

function MouseDown(e) {
    if (Buttons.isInputFocused) {
        if (e.button == 0) 
        {
            Buttons.lmb.pressed = true;
            if (Buttons.lmb.hasOwnProperty("onPress")) Buttons.lmb.onPress();
        }
        else if (e.button == 1)
        {
            Buttons.mmb.pressed = true;
            if (Buttons.mmb.hasOwnProperty("onPress")) Buttons.mmb.onPress();
        }
        else if (e.button == 2)
        {
            Buttons.rmb.pressed = true;
            if (Buttons.rmb.hasOwnProperty("onPress")) Buttons.rmb.onPress();
        }
    }
    else {
        if (e.button == 0 && Buttons.lmb.pressed) 
        {
            Buttons.lmb.pressed = false;
            if (Buttons.lmb.hasOwnProperty("onPress")) Buttons.lmb.onRelease();
        }
        else if (e.button == 1 && Buttons.mmb.pressed)
        {
            Buttons.mmb.pressed = false;
            if (Buttons.mmb.hasOwnProperty("onPress")) Buttons.mmb.onRelease();
        }
        else if (e.button == 2 && Buttons.rmb.pressed)
        {
            Buttons.rmb.pressed = false;
            if (Buttons.rmb.hasOwnProperty("onPress")) Buttons.rmb.onRelease();
        }
    }
    //console.log("mouse button " + e.button + ": ");
}

function MouseUp(e) {
    if (Buttons.isInputFocused) {
        if (e.button == 0)
        {
            Buttons.lmb.pressed = false;
            if (Buttons.lmb.hasOwnProperty("onRelease")) Buttons.lmb.onRelease();
        }
        else if (e.button == 1)
        {
            Buttons.mmb.pressed = false;
            if (Buttons.mmb.hasOwnProperty("onRelease")) Buttons.mmb.onRelease();
        }
        else if (e.button == 2) 
        {
            Buttons.rmb.pressed = false;
            if (Buttons.rmb.hasOwnProperty("onRelease")) Buttons.rmb.onRelease();
        }
    }
}

function MouseScroll(e) {
    if (Buttons.isInputFocused) {
        if (e.deltaY > 0) {
            if (Buttons.scrollUp.hasOwnProperty("onPress")) Buttons.scrollUp.onPress();
        }
        else if (e.deltaY < 0) {
            if (Buttons.scrollDown.hasOwnProperty("onPress")) Buttons.scrollDown.onPress();
        }
        // Release after triggered
        if (Buttons.scrollUp.hasOwnProperty("onRelease")) Buttons.scrollUp.onRelease();
        if (Buttons.scrollDown.hasOwnProperty("onRelease")) Buttons.scrollDown.onRelease();
    }
}

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// Controls
//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function GetInput(btnAr) {
    var check = false;
    for (var i = 0; i < btnAr.length; i++) {
        if (btnAr[i].pressed) check = true;
    }
    return check;
}

function assignFunctionToInput(btnAr, downFunc, upFunc) {
    for (var i = 0; i < btnAr.length; i++) {
        if (btnAr[i]) {
            btnAr[i].onPress = downFunc
            btnAr[i].onRelease = upFunc
        }
    }
}

var Controls = {
    Player1: {
        upAxis1: [Buttons.w, GamepadButtons.lsUp],
        downAxis1: [Buttons.s, GamepadButtons.lsDown],
        leftAxis1: [Buttons.a, GamepadButtons.lsLeft],
        rightAxis1: [Buttons.d, GamepadButtons.lsRight],
        upAxis2: [],
        downAxis2: [],
        leftAxis2: [],
        rightAxis2: [],
        run: [Buttons.shift, GamepadButtons.b],
        jump: [Buttons.space, GamepadButtons.a],
        fire1: [Buttons.lmb, GamepadButtons.x],
        fire2: [Buttons.rmb, GamepadButtons.y],
        invUp: [Buttons.scrollUp, Buttons.equals],
        invDown: [Buttons.scrollDown, Buttons.minus],
        eyedrop: [Buttons.e],
        noclip: [Buttons.r]
    },
    Player2: {
        upAxis1: [Buttons.up],
        downAxis1: [Buttons.down],
        leftAxis1: [Buttons.left],
        rightAxis1: [Buttons.right],
        upAxis2: [Buttons.i],
        downAxis2: [Buttons.k],
        leftAxis2: [Buttons.j],
        rightAxis2: [Buttons.l],
        run: [Buttons.o],
        jump: [Buttons.p],
        fire1: [Buttons.bracketLeft],
        fire2: [Buttons.bracketRight],
        invUp: [Buttons.slash],
        invDown: [Buttons.period],
        eyedrop: [Buttons.y],
        noclip: [Buttons.u]
    }
}

function PressKeyPrompt(o) {
    o.innerHTML = "Press new key..."
}

function ChangeButton(o, buttonToChange, textToChange) {
    if (o === document.activeElement) {
        document.activeElement = null;
        o.blur();
        let buttonText = RemapButton(event.keyCode, buttonToChange);
        textToChange.innerHTML = buttonText.name;
        console.log(`Key Changed!`);
    }
}

function RemapButton(newKeyCode, buttonToReplace) {
    for (var b in Buttons) {
        if (Buttons[b].code === newKeyCode) {
            buttonToReplace[0] = Buttons[b];
            return Buttons[b];
        }
    }
}

function ApplyControlPreset(preset) {
    // Change preset
    Controls.Player1 = preset;
    // Change DOM texts
    $("#DOM_up_key").innerHTML = Controls.Player1.upAxis1[0].name;
    $("#DOM_down_key").innerHTML = Controls.Player1.downAxis1[0].name;
    $("#DOM_left_key").innerHTML = Controls.Player1.leftAxis1[0].name;
    $("#DOM_right_key").innerHTML = Controls.Player1.rightAxis1[0].name;
    $("#DOM_jump_key").innerHTML = Controls.Player1.jump[0].name;
    $("#DOM_place_key").innerHTML = Controls.Player1.fire1[0].name;
    $("#DOM_invup_key").innerHTML = Controls.Player1.invUp[0].name;
    $("#DOM_invdown_key").innerHTML = Controls.Player1.invDown[0].name;
    $("#DOM_respawn_key").innerHTML = Controls.Player1.resapwn[0].name;
}