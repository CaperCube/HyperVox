///////////////////////////////////////
// Constants
///////////////////////////////////////
const TEXTURE_PATH = './client/src/textures/'
const SOUND_PATH = './client/src/sounds/'

///////////////////////////////////////
// Images
///////////////////////////////////////
const imageSRC = {
    Stars: `${TEXTURE_PATH}skybox/stars.png`,
    Skybox: `${TEXTURE_PATH}skybox/skybox_1`,
    Skybox2: `${TEXTURE_PATH}skybox/skybox_2`,
    Atlas: `${TEXTURE_PATH}atlas.png`,
    Tiles: `${TEXTURE_PATH}textures.png`
}

///////////////////////////////////////
// Sounds
///////////////////////////////////////
const soundSRC = [
    `${SOUND_PATH}Main_Music.wav`, // Doesn't exist yet
    `${SOUND_PATH}Step_Grass_01.wav`,
    `${SOUND_PATH}Step_Grass_02.wav`,
    `${SOUND_PATH}Step_Grass_03.wav`
]

const SoundIdx = {
    MUSIC_MAIN: 0,
    WALK1_GRASS: 1,
    WALK2_GRASS: 2,
    WALK3_GRASS: 3,
}

const Sounds = {
    //MAIN_MUSIC: new Sound(soundSRC[SoundIdx.MUSIC_SOUND], true, 0.25),
    WALK1_GRASS: new Sound(soundSRC[SoundIdx.WALK1_GRASS]),
    WALK2_GRASS: new Sound(soundSRC[SoundIdx.WALK2_GRASS]),
    WALK3_GRASS: new Sound(soundSRC[SoundIdx.WALK3_GRASS]),
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