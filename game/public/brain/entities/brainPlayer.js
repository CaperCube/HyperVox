import { getRandomName } from '../../common/commonConstants.js'
import { gameModes } from '../../common/commonConstants.js'
import BrainEntity, { entityTypes } from './brainEntity.js'

export default class BrainPlayer extends BrainEntity {
    constructor(playerID) {
        // Do parrent constructor
        super(entityTypes.player, 'New Player', playerID)

        // Player vars
        this.playerID = playerID
        this.playerName = getRandomName()

        // Game vars
        this.isAdmin = false
        this.gameMode = gameModes.creative // this overrides 'gameOptions.gameMode'

        this.respawmPoint = { x: 0, y: 0, z: 0 } // not yet implemented
        this.override = false // When enabled, the server has control of this player's position
        this.position = { x: 0, y: 0, z: 0 }
        this.rotation = { x: 0, y: 0, z: 0 }
        this.health = 100 // not yet implemented

        this.passwordAttempts = 0

        this.stats = {
            kills: 0,
            deaths: 0,
            score: 0,
            // startTime: 0,
        }

        this.startTime = 0

        // Vars for validation
        // (Not implemented yet. See 'docs/LagCompensation.md')
        // this.positionHistory = {
        //     //'stamp-1230'
        // }
    }

    ResetStats() {
        this.stats = {
            kills: 0,
            deaths: 0,
            score: 0,
        }
    }
}