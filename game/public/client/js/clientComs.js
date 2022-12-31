////////////////////////////////////////////////////
// This is that object through which all
// communcations from the client will go to
// interface with the server or game object
//
// Server / game communications will also come
// through here first to get to the client
////////////////////////////////////////////////////

import { defaultWorldSize } from "../../common/commonConstants.js"
import ClientPlayer from "./entities/player.js"
import { copyWorld } from "../../brain/gen/world/world.js"
import { UpdateLobbyPlayerData, CreateLobbyPlayerList, ClearLobbyContent } from "./lobbyUtil.js"
import { sounds } from "./resources.js"
import Ping from './entities/ping.js'
import Effect from './entities/effect.js'

class ClientComs {
    constructor(props = {
        isNetworked: false,
        clientGame, // The object that will send and receive information
        brainComs: null, // null when online
        network: null // null when offline
    }) {
        // The object that will be the source of sent information, and the receiver of information from the host
        this.clientGame = props.clientGame

        // Determins weather a socket message needs to be sent or not
        // True: connecting to a server, False: singleplayer / local-machine only
        this.isNetworked = props.isNetworked

        // If online, this is the ip we'll connect to
        this.host = ''

        // If online, this is the means of communication
        this.network = props.network

        // If offline, this is the object we communicate to
        this.brainComs = this.isNetworked? null : props.brainComs

        // Debugging options
        this.messageDebug = false

        // Connect to brainCom if offline
        if (!this.isNetworked) this.offlineConnect(this)

        ////////////////////////////////////////////////////
        // Incoming messages from brain
        ////////////////////////////////////////////////////
        this.brainMessages = {
            testMessage: ( data, playerId ) => {
                if (this.messageDebug) console.log( '%c Test message (client)', 'background: #142; color: #ced' )
            },

            welcomePacket: ( data, playerId ) => {
                // if (this.messageDebug)
                console.log( '%c Welcome new player! (client)', 'background: #142; color: #ced' )

                // Set the client data that will be use when making a local player
                this.clientGame.clientID = data.clientID
                this.clientGame.clientName = data.playerName
                console.log(this.clientGame.clientID, this.clientGame.clientName)
            },

            disconnectMessage: ( data, playerId ) => {
                // if (this.messageDebug)
                console.log( '%c You have been disconnected (client)', 'background: #142; color: #ced' )
                console.log(data.message)

                // Show message
                this.clientGame.displayPopupMessage(data.message)
            },

            updateSingleBlock: ( data, playerId ) => {
                if (this.messageDebug) console.log( '%c Update single block (client)', 'background: #142; color: #ced' )
                this.clientGame.updateBlock( data.location, data.id )
            },

            loadSentWorld: ( data, playerId ) => {
                if (this.messageDebug) console.log( '%c Load world from brain (client)', 'background: #142; color: #ced' )

                // Stop current game
                // this.clientGame.removeScene()

                // Store world
                if (this.isNetworked) this.clientGame.clientWorld = data.world
                
                // Deep copy world
                // This has a dual purpose of providing a client copy of the world & converting a JSON world to a World() object
                // this.clientGame.deepCopyWorld( data.world )
                this.clientGame.clientWorld = copyWorld(data.world)
                
                // Start game
                this.clientGame.startNewGameScene()
            },

            saveClientWorld: ( data, playerId ) => {
                if (this.messageDebug) console.log( '%c Save client world (client)', 'background: #142; color: #ced' )

                // Save world
                this.clientGame.saveWorld(data.worldName)
            },

            loadWorldToSave: ( data, playerId ) => {
                if (this.messageDebug) console.log( '%c Save brain world (client)', 'background: #142; color: #ced' )

                // Save world
                this.clientGame.downloadWorld(JSON.stringify(data.world), data.worldName || 'world.json')
                // this.clientGame.saveWorld(data.world)
            },

            initOtherPlayers: ( data, playerId ) => { 
                if (this.messageDebug) console.log( '%c Load other connected players from brain (client)', 'background: #142; color: #ced' )

                // Add new players
                console.log(data.players)
                for (let p = 0; p < data.players.length; p++) {
                    // If this is not my local player...
                    if (data.players[p]?.playerID !== this.clientGame.localPlayer?.playerID) {
                        // If this player doesn't already exist...
                        if (!this.clientGame.networkPlayers[p]) {
                            // Add new ClientPlayer() to scene
                            const newPlayer = new ClientPlayer(null, null, data.players[p].playerID, this.clientGame)
                            newPlayer.setPlayerName(data.players[p].playerName)
                            newPlayer.inventory.selectedIndex = null
                            // Push this player to array
                            this.clientGame.networkPlayers[p] = newPlayer
                        }
                    }
                    // // This IS my local player...
                    // else {
                    //     // If I don't already exist...
                    //     if (!this.clientGame.localPlayer) {
                    //         //...
                    //     }
                    // }
                }

                // Remove non-existent players
                for (let p = 0; p < this.clientGame.networkPlayers.length; p++) {
                    let thisPlayer = this.clientGame.networkPlayers[p]
                    // If this player doesn't exist...
                    const iDMatchedPlayers = data.players.filter(dp => dp.playerID === thisPlayer?.playerID)
                    if (thisPlayer && iDMatchedPlayers.length === 0) {
                        if (thisPlayer.avatar) thisPlayer.avatar.dispose()
                        thisPlayer.clearIntervals()
                        delete this.clientGame.networkPlayers[p]
                    }
                }

                // Create score-board
                // const newPlayers = [this.clientGame.localPlayer, ...this.clientGame.networkPlayers]
                // for (let i = 0; i < newPlayers.length; i++) console.log(newPlayers[i].playerName)
                // CreateLobbyPlayerList(newPlayers)
                ClearLobbyContent()
            },

            playerNameChange: ( data, playerId ) => {
                if (this.messageDebug) console.log( '%c Set changed player name from brain (client)', 'background: #142; color: #ced' )

                // Change existing player
                console.log(data)
                // If this is not my local player...
                if (data.targetPlayerID !== this.clientGame.localPlayer?.playerID) {
                    const targetPlayer = this.clientGame.networkPlayers?.filter(p => p.playerID === data.targetPlayerID)[0]
                    // If this player exists...
                    if (targetPlayer) {
                        targetPlayer.setPlayerName(data.newName)
                    }
                }
                else {
                    this.clientGame.localPlayer.setPlayerName(data.newName)
                }
            },

            updateAllPlayers: ( data, playerId ) => {
                // Update all players
                
                // Loop through all data player objects received
                for (let i = 0; i < data.players.length; i++) {

                    // Get reference to player data object
                    const dataPlayer = data.players[i]

                    // Update network players
                    if (dataPlayer.playerID !== this.clientGame.localPlayer?.playerID) {
                        // Get player by ID
                        const thisPlayer = this.clientGame.networkPlayers.filter(player => player.playerID === dataPlayer.playerID)[0]
                        if (thisPlayer) {
                            // Update player data
                            thisPlayer.health = dataPlayer.health
                            thisPlayer.stats = dataPlayer.stats

                            // Update position & rotation
                            thisPlayer.position = dataPlayer.position
                            // ToDo: Update this when we start using the PlayerAvatar() class
                            // if (thisPlayer.avatar && thisPlayer.head) thisPlayer.head.rotation = dataPlayer.rotation
                            thisPlayer.lookDir = dataPlayer.rotation

                            // Update animtion
                            thisPlayer.nextAnimation = dataPlayer.animation

                            // Update held item
                            if (thisPlayer.inventory.selectedIndex !== dataPlayer.heldItem) {
                                thisPlayer.inventory.selectedIndex = dataPlayer.heldItem
                                
                                const heldItem = thisPlayer.inventory.items[thisPlayer.inventory.selectedIndex]
                                if (heldItem) thisPlayer.createItemMesh(heldItem, heldItem.itemType, false)
                                else if (thisPlayer.itemMesh) thisPlayer.itemMesh.dispose()
                            }
                        }
                    }
                    // Update local player(s)
                    else {
                        // Override position if flagged
                        if (dataPlayer.override) {
                            this.clientGame.localPlayer.position = dataPlayer.position
                        }

                        // Update player data
                        // ToDo: Position should be overrided in some cases (Teleporting, Server validation, player death)

                        // ToDo: Health should be completely brain-side when damaging blocks are resolved on brain
                        // this.clientGame.localPlayer.health = dataPlayer.health
                        this.clientGame.localPlayer.stats = dataPlayer.stats
                    }
                }

                // Update scores
                UpdateLobbyPlayerData([this.clientGame.localPlayer, ...this.clientGame.networkPlayers])
            },

            // Depricated: Remove this function :)
            movePlayer: ( data, playerId ) => {
                // if (this.messageDebug) console.log( '%c Set player positions from brain (client)', 'background: #142; color: #ced' )

                // If this is not my local player...
                if (data.playerID !== this.clientGame.localPlayer?.playerID) {
                    // Get player by ID
                    const movingPlayer = this.clientGame.networkPlayers.filter(player => player.playerID === data.playerID)
                    if (movingPlayer[0]) {
                        movingPlayer[0].position = data.position
                        // ToDo: Update this when we start using the PlayerAvatar() class
                        if (movingPlayer[0].avatar) movingPlayer[0].head.rotation = data.rotation
                    }
                }
            },

            receiveChatMessage: ( data, playerId ) => {
                if (this.messageDebug) console.log( '%c Receive chat message from brain (client)', 'background: #142; color: #ced' )
                this.clientGame.displayChatMessage(data.message, data.messageName, data.nameColor, data.isServer)
            },

            updateDamagedPlayer: ( data, playerId ) => {
                if (this.messageDebug) console.log( '%c Update damaged player from brain (client)', 'background: #142; color: #ced' )
                // { hitPlayerID, damage, newHelth, newPosition }

                // Get player by ID
                let updatedPlayer = (data.hitPlayerID === this.clientGame.localPlayer?.playerID) ?
                    this.clientGame.localPlayer :
                    this.clientGame.networkPlayers.filter(player => player.playerID === data.hitPlayerID)[0]

                // Do update
                if (updatedPlayer) {
                    // ToDo: This needs to be a server-side action, not client-side
                    updatedPlayer.takeDamage(data.damage, 100, data.attackerPlayerID)
                }
            },

            updateWorldSpawn: ( data, playerId ) => {
                if (this.clientGame.clientWorld) {
                    if (this.messageDebug) console.log( '%c Update world spawn from brain (client)', 'background: #142; color: #ced' )
                    // Update client world
                    this.clientGame.clientWorld.worldSpawn = data.location
                }
            },

            updateBlockMetaData: ( data, playerId ) => {
                if (this.clientGame.clientWorld) {
                    if (this.messageDebug) console.log( `%c Update world's block metadata from brain (client)`, 'background: #142; color: #ced' )
                    //{ blockPropName, data }

                    // If the blockData object doesn't exist, create it
                    if (!this.clientGame.clientWorld.blockData) this.clientGame.clientWorld.blockData = {}

                    // Set data
                    if (data.data) this.clientGame.clientWorld.blockData[data.blockPropName] = data.data
                    else delete this.clientGame.clientWorld.blockData[data.blockPropName]
                }
            },

            // ToDo: This is a temporary solution untill we have logic on the brain to track player's spawn points & force respawn players
            respawn: ( data, playerId ) => {
                // if (this.messageDebug) console.log( '%c Set player positions from brain (client)', 'background: #142; color: #ced' )

                // This message is only intended for the player who's meant to respawn
                const myPlayer = this.clientGame.localPlayer
                if (myPlayer) {
                    // Player is dead, respawn
                    myPlayer.health = 100
                    this.clientGame.hud.enableDamageMarker(myPlayer.health)
                    myPlayer.teleportPlayer(myPlayer.respawnPoint)
                }
            },

            // ToDo: Eventually the brain should do all respawn logic
            setSpawn: ( data, playerId ) => {
                // if (this.messageDebug) console.log( '%c Set player respawn from brain (client)', 'background: #142; color: #ced' )

                // This message is only intended for the player who's respawn is meant to change
                const myPlayer = this.clientGame.localPlayer
                if (myPlayer) {
                    // Set player's spawn
                    myPlayer.setPlayerSpawn(data.position)
                }
            },

            createEffect: ( data, playerId ) => {
                if (this.messageDebug) console.log( '%c Create effect (client)', 'background: #142; color: #ced' )
                // data.position, data.entityId, data.type, data.time

                const type = data.type.split("_")?.[0]
                const subType = data.type.split("_")?.[1] || null
                console.log(data.type.split("_"))

                // Create Effect object
                switch (type) {
                    case 'ping':
                        const newPing = new Ping({
                            position: data.position,
                            lifetime: data.time,
                            clientGame: this.clientGame
                        })
                        break
                    default:
                        const newEffect = new Effect({
                            type: data.type,
                            position: data.position,
                            size: data.size || 1,
                            lifetime: data.time,
                            clientGame: this.clientGame
                        })
                        break
                }
            },

            playSound: ( data, playerId ) => {
                if (this.messageDebug) console.log( '%c Play sound (client)', 'background: #142; color: #ced' )
                // playSound

                // ToDo: change the position of the sound or change volume basde on dist to player
                // data.position

                switch (data.name) {
                    case "Rail Gun":
                        if (sounds.RAILGUN_SHOOT_1) {
                            sounds.RAILGUN_SHOOT_1.play()
                        }
                        break
                    case "SMG":
                        if (sounds.LASERGUN_SHOOT_1) {
                            sounds.LASERGUN_SHOOT_1.play()
                        }
                        break
                    default:
                        // no sound
                        break
                }
            },

            setGravity: ( data, playerId ) => {
                if (this.messageDebug) console.log( '%c Set client gravity from brain (client)', 'background: #142; color: #ced' )
                if (data.value !== null && data.value !== undefined) this.clientGame.localPlayer.gravity = data.value
            },

            setJumpsAllowed: ( data, playerId ) => {
                if (this.messageDebug) console.log( '%c Set client allowed number of jumps from brain (client)', 'background: #142; color: #ced' )
                if (data.value !== null && data.value !== undefined) this.clientGame.localPlayer.allowedJumps = data.value
            },
        }
    }

    ////////////////////////////////////////////////////
    // Connection
    ////////////////////////////////////////////////////

    // This is used to get the client connected to a networked game
    connectToNetworkedGame(ip) {
        // Remove connection to brain if it exists
        this.clientGame.removeBrain()
        //delete this.brainComs
        this.brainComs = null

        // Set `isNetworked`
        this.isNetworked = true

        // Set ip and try toconnect
        this.host = ip
        //this.socket = new socket(this.host)
    }

    ////////////////////////////////////////////////////
    // Client to Brain coms
    ////////////////////////////////////////////////////

    // Use this to send messages to the brain
    genericToBrain( comType, data ) {
        // Network message, if online
        if (!this.isNetworked && this.brainComs) this.brainComs.clientMessages[comType]( data )
        else if (this.network?.connected) this.network.emit( 'genericClientMessage', { type: comType, args: data } )
    }

    offlineConnect(cComs) {
        console.log('%c Offline connecting clientComs to brainComs... (client)', 'background: #124; color: #cde')
        const data = { clientCom: cComs }
        if (this.brainComs) this.brainComs.clientMessages['offlineConnect']( data )
        
        // We don't need a network message version for this since it's an offline only command
    }

    createNewWorld(size = defaultWorldSize) {
        console.log('%c Requesting new world generation... (client)', 'background: #124; color: #cde')
        const data = { size: size }

        // Network message
        this.genericToBrain( 'createNewWorld', data )
    }

    loadWorld(world) {
        console.log('%c Requesting world load... (client)', 'background: #124; color: #cde')
        const data = { world: world }

        // Network message
        this.genericToBrain( 'loadWorld', data )
    }

    updateSingleBlock(location, id) {
        console.log('%c Requesting update to block... (client)', 'background: #124; color: #cde')
        const data = { location: location, id: id }
        
        // Network message
        this.genericToBrain( 'updateSingleBlock', data )
    }

    updateMyGamePosition(position, rotation, animation = "idle", heldItem = null) {
        // console.log('%c Sending my position... (client)', 'background: #124; color: #cde')
        const data = { position: position, rotation: rotation, animation: animation, heldItem: heldItem }

        // Network message
        this.genericToBrain( 'movePlayer', data )
    }

    sendChatMessage(message, playerName, nameColor) {
        const data = { message: message, messageName: playerName, nameColor: nameColor }

        // Network message
        this.genericToBrain( 'sendChatMessage', data )
    }

    sendShootRequest(origin, itemUsed, hitPlayerID) {
        // ToDo: Change this to support time-stamps (later we'll move this so the server checks the player's position at this time-stamp)
        // Server needs to know: player, origin, itemUsed
        const player = this.clientGame.localPlayer
        const lookDir = player.avatar.getDirection(new BABYLON.Vector3(0, 0, 1))
        const distance = 1.5
        const effectPos = {
            x: player.position.x + (lookDir.x * distance) + 0.5,
            y: player.position.y + (lookDir.y * distance) + 0.75,
            z: player.position.z + (lookDir.z * distance)
        }


        const data = { origin: origin, gunPos: effectPos, item: itemUsed, hitPlayerID: hitPlayerID } // ToDo: Remove hitPlayerID, this check should be performed on the server

        // Network message
        this.genericToBrain( 'shootGun', data )
    }

    // ToDo: This should be removed because this is a server task
    sendObituary(deadPlayerID, killerPlayerID) {
        const data = { deadPlayerID: deadPlayerID, killerPlayerID: killerPlayerID}

        // Network message
        this.genericToBrain( 'applyObituary', data )
    }

    // Other stuff that needs to be communcated to the brain / server
    // Like:
    // changeBlockState(location, state)

}

export default ClientComs