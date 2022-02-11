# About
This is the master list of ideas that haven't been added to the roadmap just yet. If anything from this list has been added to the roadmap and you've noticed it's still in here, please try to remove it.

If you have ideas to add to this list, it would be nice to hear from you first so we can all have it in our heads, but feel free to add ideas here either way.

# Content Ideas
## Core content
- Proc Gen world (not infinite)

## Misc. Content
- Nuke button (you can't lock your chests, but you can make a nuke trap)
- 3D camera (takes a selection and saves it as an .obj)
	- Settings might inclde:
		- Join mesh (flattens the output model to as few meshs as possible)
		- Join similar (only combines meshs of the same block type)
		- Capture size (changes the size of the capture area)
		- Export entire world

# Code Ideas
- This should be a web-based 3d game that is hosted from a node server.
- Single-player sessions should be possible by running the game from a static non-multiplayer web-server
	- Single-player worlds should be download/uploadable in single-player and multi-player games
- Multiplayer sessions could be a node server hosted on a player's machine and their session link sent to the other players
- Multiplayer servers should hybernate when no players are in the game
	- If the last player leaves the game, store the time the user left
	- Compare current time to the last-player-online time for any events needing time
- Game client should be able to work without a game server. If someone wants to play single player, a "static" godaddy site should be able to host it.
- Dynamic mesh flattening to reduce draw calls (on a timer? something like a few seconds after placing blocks)

## Pseudo Code:
- `var block = 0x000000` A single hex value to represent the block ID, orientation, damage value, and state (open/closed, other)
- `var chunk = [[[]]]` A 16x16x16 array to hold the current chunk's blocks
	- `chunk = [ [ [ 0x010000, 0x010000, 0x010000, ... ], ... ], ... ]` Example chunk
- `var visibleChunks = [[[]]]` A 5x5x5 array to hold the visible chunks
- `var world.chunks = [[[]]]` A _x_x_ array to hold the chunks for the whole world
- `var visibleMesh = FlattenChunks(visibleChunks)`