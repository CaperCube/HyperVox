# Player Overhaul
Player presence on the client should be propperly segmented to avoid complicated logic

Clients have 2 player types:
- Local players
- Network players

Local players have more functionality to account for user input, camera control, and task authoring

## Local player:
- Player data (Brain is the source of truth for this)
    - Health
    - Inventory (includes ammo)
    - Scores
    - Game Mode
- Input mapping
- Camera
- Avatar (only visible in 3rd-person)
- Movement logic (Should be simply validated on the Brain)

## Network players:
- Player data (Brain is the source of truth for this)
    - Health
    - Inventory (includes ammo)
    - Scores
    - Game Mode
- Avatar