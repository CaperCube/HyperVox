import bkFont from '../src/textures/fonts/battlekourTitle.json' assert { type: "json" }
import bkBodyFont from '../src/textures/fonts/battlekourBody.json' assert { type: "json" }

///////////////////////////////////////
// Constants
///////////////////////////////////////
const STATIC_TEXTURE_PATH = '/client/src/textures/'
const TEXTURE_PATH = './client/src/textures/'
const SOUND_PATH = './client/src/sounds/'

///////////////////////////////////////
// Images
///////////////////////////////////////
const staticImageSRC = { // Static paths are needed when loading resources from somewhere other than './public/index.html'
    UI: `${STATIC_TEXTURE_PATH}ui_parts.png`,
    Stars: `${STATIC_TEXTURE_PATH}skybox/stars.png`,
    Skybox1: `${STATIC_TEXTURE_PATH}skybox/skybox1/edited/`,
    Skybox2: `${STATIC_TEXTURE_PATH}skybox/skybox2/edited/`,
    Atlas: `${STATIC_TEXTURE_PATH}atlas.png`,
    Tiles: `${STATIC_TEXTURE_PATH}textures.png`
}

const imageSRC = {
    UI: `${TEXTURE_PATH}ui_parts.png`,
    Stars: `${TEXTURE_PATH}skybox/stars.png`,
    Skybox1: `${TEXTURE_PATH}skybox/skybox1/edited/`,
    Skybox2: `${TEXTURE_PATH}skybox/skybox2/edited/`,
    Atlas: `${TEXTURE_PATH}atlas.png`,
    Tiles: `${TEXTURE_PATH}textures.png`
}

///////////////////////////////////////
// Fonts
///////////////////////////////////////
const fontJSON = {
    battlekourTitle: bkFont,
    battlekourBody: bkBodyFont
}

///////////////////////////////////////
// Sounds
///////////////////////////////////////
const soundSRC = [
    // `${SOUND_PATH}Main_Music.wav`, // Doesn't exist yet
    // `${SOUND_PATH}Step_Grass_01.wav`,
    // `${SOUND_PATH}Step_Grass_02.wav`,
    // `${SOUND_PATH}Step_Grass_03.wav`
]

const SoundIdx = {
    MUSIC_MAIN: 0,
    WALK1_GRASS: 1,
    WALK2_GRASS: 2,
    WALK3_GRASS: 3,
}

const Sounds = {
    //MAIN_MUSIC: new Sound(soundSRC[SoundIdx.MUSIC_SOUND], true, 0.25),
    // WALK1_GRASS: new Sound(soundSRC[SoundIdx.WALK1_GRASS]),
    // WALK2_GRASS: new Sound(soundSRC[SoundIdx.WALK2_GRASS]),
    // WALK3_GRASS: new Sound(soundSRC[SoundIdx.WALK3_GRASS]),
}

//document.onclick = () => {Sounds.MAIN_MUSIC.Play()};

///////////////////////////////////////
// Sound class (This might get replaced if Babylon.js has an audio engine built in)
///////////////////////////////////////
function Sound(src, loop = false, volume = 1) {
    // Thanks to: https://www.w3schools.com/graphics/game_sound.asp
    this.loop = false || loop
    this.sound = document.createElement("audio")
    this.sound.src = src
    this.sound.setAttribute("preload", "auto")
    this.sound.setAttribute("controls", "none")
    this.sound.style.display = "none"
    this.sound.volume = volume
    //if (this.loop) this.sound.setAttribute("loop", "auto")
    document.body.appendChild(this.sound)

    this.Play = function(){
        this.sound.currentTime = 0
        this.sound.play()
    }
    this.Stop = function(){
        this.sound.pause()
    }
    this.sound.addEventListener(`ended`, () => {
        if (this.loop) {
            this.Play()
            //this.sound.setAttribute("loop", "auto")
        }
    });
}

export {
    staticImageSRC,
    imageSRC,
    fontJSON,
    Sounds
}