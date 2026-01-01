# Character Collector Game

A fun 2-player character collector game designed for kids! Players select their favorite characters and compete to collect prizes in various game modes.

**Play at:** [charactercollector.nickjantz.com](https://charactercollector.nickjantz.com)

## Features

- **Gamepad Support** - Full gamepad support for both players
- **Keyboard Controls** - Arrow keys (Player 1) and WASD (Player 2)
- **1-2 Players** - Play solo or with a friend
- **Three Game Modes**:
  - **Free Play** - Collect as many prizes as you can, no time limit
  - **Race** - First to 15 prizes wins!
  - **Countdown** - 60-second timer, highest score wins
- **Character Selection** - Choose from multiple characters
- **Character-Specific Prizes** - Each character collects their own unique prize type

## How to Play

### Character Selection
1. Connect your gamepad(s) or use keyboard controls
2. Select your character by navigating with D-pad/stick and pressing A
3. Choose a game mode (Free Play, Race, or Countdown)
4. Press A again when the Start button is highlighted to begin!

### Controls

**Player 1:**
- Keyboard: Arrow Keys (↑ ↓ ← →)
- Gamepad: Left stick/D-pad to move, A to select/confirm

**Player 2:**
- Keyboard: WASD keys
- Gamepad: Left stick/D-pad to move, A to select/confirm

**Game Controls:**
- Move your character to collect prizes
- Characters wrap around screen edges
- Each character can only collect their specific prize type
- Prizes disappear after 10-15 seconds (throb in last 3-5 seconds)

## Adding Characters

Characters are configured in `config.json`. To add a new character:

1. Add the character image to `images/characters/` (e.g., `images/characters/mycharacter.png`)
2. Add the prize image to `images/prizes/` (e.g., `images/prizes/myprize.png`)
3. Add an entry to `config.json`:

```json
{
  "id": "mycharacter",
  "image": "images/characters/mycharacter.png",
  "prize": "images/prizes/myprize.png",
  "prizeType": "myprize",
  "playerName": "My Character"
}
```

**Note:** If a prize image is missing, the game will use a colored star fallback.

See `CONFIG_GUIDE.md` for detailed configuration options.

## Project Structure

```
/
├── index.html          # Main HTML file
├── style.css           # Styles
├── config.json         # Character and game configuration
├── render.yaml         # Render deployment configuration
├── images/
│   ├── characters/     # Character images
│   └── prizes/         # Prize images
└── js/
    ├── main.js         # Entry point
    ├── state.js        # State management
    ├── config.js       # Config loading
    ├── player.js       # Player class
    ├── prize.js       # Prize class
    ├── game.js          # Game logic
    ├── input.js        # Input handling
    ├── selection.js     # Character/mode selection
    ├── gamemode.js     # Game mode management
    └── ui.js           # UI updates
```

## Local Development

1. Clone the repository
2. Serve the files with a local web server:

```bash
# Using Python 3
python3 -m http.server 8000
```

3. Open `http://localhost:8000` in your browser

**Note:** The game requires a web server (not just opening the HTML file) due to ES6 modules and JSON loading.

## Deployment

This project is configured for deployment on [Render](https://render.com) as a static site.

1. Push your code to GitHub
2. Connect your repository to Render
3. Create a new Static Site service
4. Render will automatically detect the `render.yaml` configuration
5. Your site will be live at your Render URL

The `render.yaml` file configures:
- Static site serving
- Automatic `index.html` serving at root path
- SPA routing support (all paths serve `index.html`)

## Game Modes

### Free Play
- No time limit
- No score limit
- Collect as many prizes as you can
- Perfect for casual play

### Race
- First player to reach 15 prizes wins
- Progress bars show each player's progress
- Game ends when a player reaches the target

### Countdown
- 60-second timer
- Collect as many prizes as possible
- Highest score wins when time runs out
- Timer displayed in center of screen

## Technical Details

- **Pure JavaScript** - No frameworks, vanilla ES6 modules
- **HTML5 Canvas** - For game rendering
- **Gamepad API** - Native browser gamepad support
- **Tailwind CSS** - For styling (via CDN)
- **State Management** - Custom lightweight state system

## Browser Support

- Modern browsers with ES6 module support
- Gamepad API support (Chrome, Firefox, Edge)
- Canvas API support

## License

This project is for personal/family use.

