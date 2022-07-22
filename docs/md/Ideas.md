# About
This is the master list of ideas that haven't been added to the roadmap just yet. If anything from this list has been added to the roadmap and you've noticed it's still in here, please try to remove it.

If you have ideas to add to this list, it would be nice to hear from you first so we can all have it in our heads, but feel free to add ideas here either way.

# Content Ideas
## Core content
- Proc Gen world (not infinite)
- Fun movement mechanics (who cares about balancing if it's fun?)
- Multiplayer coop or pvp
- Creative, Normal, Race, Death Match game modes
- Any modding utilities that seem fun / cool

## Misc. Content
- Nuke button (you can't lock your chests, but you can make a nuke trap)
- 3D camera (takes a selection and saves it as an .obj)
	- Settings might inclde:
		- Join mesh (flattens the output model to as few meshs as possible)
		- Join similar (only combines meshs of the same block type)
		- Capture size (changes the size of the capture area)
		- Export entire world
- World-gen pattern editor
- Options for proc. gen content
	- Block textures (using existing texture parts)
	- Block props (damage, biome, drops, other)
	- NPCs (Pos of limbs, Health, general behavior, and other props)
	- Structures
	- Bosses / Challenges
	- Structures

# Art Style Ideas
- 32x strict palette pixel-art
- Kinda grungy (db32)
- Low-res
- Black void + black fog
- Spacey Nebula
- Cool alien planets

# Code Ideas
- This should be a web-based 3d game that is hosted from a node server.
- Single-player sessions should be possible by running the game from a static non-multiplayer web-server
	- Single-player worlds should be download/uploadable in single-player and multi-player games
- Multiplayer sessions could be a node server hosted on a player's machine
- Multiplayer servers should hybernate when no players are in the game
	- If the last player leaves the game, store the time the user left
	- Compare current time to the last-player-online time for any events needing time
- Game client should be able to work without a game server. If someone wants to play single player, a simple godaddy site should be able to host it.