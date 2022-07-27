# Movment rules

- Movement should be acceleration based
- Movement acceleration should not applied if the player is moving past a certian max walking speed
- Movement acceleration should be dampened when in air
- The jump force is a vector sum of (up * jumpForce) and some factor of the (input vector + movement vector)

## Psudo code

```js
groundFric = 0.5
airFric = 0.95

// The direction of the lateral jump force should be applied
const forwardJumpDir = (inputVector + movementVector.normalize()).normalize()
// The vector of the force of the lateral jump
const forwardJumpForce = forwardJumpDir * (jumpForce / 2)
// The total jump velocity vector
const jumpForce = forwardJumpForce + (Vector3.up * jumpForce)
```