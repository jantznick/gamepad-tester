# Config File Guide

## How to Add Characters

Each character in the `config.json` file needs these fields:

### Required Fields:
- **`id`**: Unique identifier (lowercase, no spaces) - e.g., `"moana"`, `"spidey"`
- **`image`**: Path to the character image - e.g., `"images/characters/moana.png"` (must exist in `images/characters/` folder)
- **`prizeType`**: Type of prize this character collects - e.g., `"heart"`, `"star"`, `"web"`, `"bone"`
- **`playerName`**: Display name shown in the game - e.g., `"Moana"`, `"Spidey"`

### Optional Fields:
- **`prize`**: Path to the prize image - e.g., `"images/prizes/heart.png"` (should exist in `images/prizes/` folder)
  - If you don't provide this, the game will automatically draw a colored star:
    - Blue star for Player 1
    - Green star for Player 2
  - If you provide it but the file doesn't exist, it will also fall back to colored stars

## Examples

### Character with prize image:
```json
{
	"id": "moana",
	"image": "images/characters/moana.png",
	"prize": "images/prizes/heart.png",
	"prizeType": "heart",
	"playerName": "Moana"
}
```

### Character without prize image (uses colored star):
```json
{
	"id": "blaze",
	"image": "images/characters/blaze.png",
	"prizeType": "star",
	"playerName": "Blaze"
}
```

### Character with prize image that might not exist:
```json
{
	"id": "spidey",
	"image": "images/characters/spidey.png",
	"prize": "images/prizes/web.png",
	"prizeType": "web",
	"playerName": "Spidey"
}
```
If `web.png` doesn't exist, it will automatically use a colored star instead.

## Prize Types

The `prizeType` determines which prizes a character can collect:
- Characters with the same `prizeType` collect the same type of prizes
- Each character can only collect their own `prizeType`
- Multiple characters can share the same `prizeType` (e.g., Moana and Hei Hei both collect hearts)

## Notes

- Character images must be placed in `images/characters/` folder
- Prize images should be placed in `images/prizes/` folder
- Prize images are optional - if missing, colored stars are drawn automatically
- The game will automatically detect which characters have valid images and only show those
- You can add as many characters as you want!
- Image paths in `config.json` should be relative to the project root (e.g., `images/characters/moana.png`)

