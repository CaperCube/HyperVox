//ToDo: move this list to a comon location
export const entityTypes = {
    simple: 'simple',
    pickup: 'pickup',
    projectile: 'projectile',
    player: 'player',
}

export default class BrainEntity {
    constrctor(eType = entityTypes.simple, eName = 'New Entity', myId) {
        // Core data
        this.entityID = myId || Math.random()
        this.entityType = eType
        this.entityName = entName

        // Position
        this.position = startPos

        // Vars for validation
        // (Not implemented yet. See 'docs/LagCompensation.md')
        this.positionHistory = {
            //'stamp-1230'
        }
    }
}