# Config File Guide

## How to Add Characters

Each character in the `config.json` file needs these fields:

### Required Fields:
- **`id`**: Unique identifier (lowercase, no spaces) - e.g., `"moana"`, `"spidey"`
- **`image`**: Filename of the character image - e.g., `"moana.png"` (must exist in the same folder)
- **`prizeType`**: Type of prize this character collects - e.g., `"heart"`, `"star"`, `"web"`, `"bone"`
- **`playerName`**: Display name shown in the game - e.g., `"Moana"`, `"Spidey"`

### Optional Fields:
- **`prize`**: Filename of the prize image - e.g., `"heart.png"`, `"star.png"`
  - If you don't provide this, the game will automatically draw a colored star:
    - Blue star for Player 1
    - Green star for Player 2
  - If you provide it but the file doesn't exist, it will also fall back to colored stars

## Examples

### Character with prize image:
```json
{
	"id": "moana",
	"image": "moana.png",
	"prize": "heart.png",
	"prizeType": "heart",
	"playerName": "Moana"
}
```

### Character without prize image (uses colored star):
```json
{
	"id": "bluey",
	"image": "bluey.png",
	"prizeType": "bone",
	"playerName": "Bluey"
}
```

### Character with prize image that might not exist:
```json
{
	"id": "spidey",
	"image": "spidey.png",
	"prize": "web.png",
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

- Character images must exist in the same folder as `index.html`
- Prize images are optional - if missing, colored stars are drawn automatically
- The game will automatically detect which characters have valid images and only show those
- You can add as many characters as you want!

