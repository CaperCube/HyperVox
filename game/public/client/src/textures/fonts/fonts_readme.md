**Note:**
>The currently supported character codes are ACII 32-126 (ASCII 32 will use the `"spaceSize"` value for spacing and will **not** draw a sprite)

## `MetaData`: Data that will help display and sort the font.

### `fontName`: The name of the font.
This will be used for display purposes and as a reference in code.

### `fontFamily`: The family to which the font belongs.
This is used to help orginize & filter fonts, for display purposes, and as a reference in code.

### `fontWeight`: The weight of the font.
This is used for display purposes and to help orginize & filter fonts.
Recognized values are `extra-light` `light` `normal` `bold` `extra-bold`

### `imgName`: The name of the file the font uses.
This is used as a reference in code to load the font's required image.

## `metrics`: Data that helps render the characters correctly.

### `fontSize`: The character cell-size of the font in `px`
This is used to know what size the font will be and to help index characters in engine.

### `baseline`: The vertical offset of the font in `px`
This is used to shift the displayed characters down (or up if negative). This is useful for creating fonts with decenders.

### `spaceSize`: The width of the space character in `px`
This is used to define how wide the space character is in the font.

### `letterSpacing`: The uniform horizontal spacing between each character in `px`
This is used to include additional spacing after all characters.

## `charData`: Optional data for all characters to help render correctly.

### `width`: The width of the character in `px`.
This is used in code to help sample the font's image for the desired character.

### `shift`: The extra spacing in `px` to add before the character.
This is used to add spacing before the character.

### `tracking`: The extra spacing to add after the character.
This is used to add spacing after the character.

**Formatting Notes:**
>- Each character that needs special formatting should be listed in this `charData` object.
>- Characters should be listed by their ASCII code (i.e. `"A"` should be `"65"`)
>- The caracter to render for unsupported codes should be listed as `"unsupported": {...}`
>- If no data for a character is provided, these default values will be used: `{ "width": 16, "shift": 0, "tracking": 0 }`

**Example**
```json
"charData": {
    "65": { "width": 10, "shift": 0, "tracking": 0 },
    "97": { "width": 8, "shift": 0, "tracking": 0 }
}
```

**Full Font Example**
```json
{
    "metaData": {
        "fontName": "ExampleFont",
        "fontFamily": "Example",
        "fontWeight": "normal",
        "imgName": "ExampleFont.png"
    },
    "metrics": {
        "fontSize": 16,
        "baseline": 0,
        "spaceSize": 8,
        "letterSpacing": 0
    },
    "charData": {
        "unsupported": { "width": 16, "shift": 0, "tracking": 0 },
        "65": { "width": 10, "shift": 0, "tracking": 0 }
    }
}
```