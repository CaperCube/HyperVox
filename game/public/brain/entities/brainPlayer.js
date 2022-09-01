// ToDo: move getRandomName to server, why should the client need this?
import { getRandomName } from '../../client/js/clientConstants.js'
import { gameModes } from '../../common/commonConstants.js'
import BrainEntity, { entityTypes } from './brainEntity.js'

export default class BrainPlayer extends BrainEntity {
    constructor(playerID) {
        // Do parrent constructor
        super(entityTypes.player, 'New Player', playerID)

        // Player vars
        this.playerID = playerID
        this.playerName = getRandomName()//'Player' // ToDo: use 'getRandomPlayerName()'

        // Game vars
        this.isAdmin = false // ToDo: set as true if this is the first player in the lobby
        this.gameMode = gameModes.creative // this overrides 'gameOptions.gameMode'

        this.respawmPoint = { x: 0, y: 0, z: 0 } // not yet implemented
        this.position = { x: 0, y: 0, z: 0 }
        this.rotation = { x: 0, y: 0, z: 0 }
        this.health = 100 // not yet implemented

        this.stats = {
            kills: 0,
            deaths: 0,
            points: 0
        }

        // Vars for validation
        // (Not implemented yet. See 'docs/LagCompensation.md')
        // this.positionHistory = {
        //     //'stamp-1230'
        // }
    }
}