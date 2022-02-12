////////////////////////////////////////////////////
// Vars
////////////////////////////////////////////////////
let camera, scene, renderer;
let mesh;
let frame = 0;
let controls;

let resFactor = 4;

let tileScale = 1;
let worldSize = 50; // In num of tiles
let playerHeight = tileScale * 1.5;

let moveForward, moveBackward, moveLeft, moveRight;
let moveSpeed = tileScale/20;

////////////////////////////////////////////////////
// Init function calls
////////////////////////////////////////////////////
init();
animate();

////////////////////////////////////////////////////
// Scene init
////////////////////////////////////////////////////
function init() {

    // Create camera
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, tileScale/5, 5000 );
    // Put camera in center and at player height
    camera.position.x = (worldSize/2) * tileScale;
    camera.position.z = -(worldSize/2) * tileScale;
    camera.position.y = playerHeight;

    // Create scene
    //scene = new THREE.Scene();
    scene = new THREE.Scene();
    {
        const color = 0x000000;  // white
        const near = tileScale;
        const far = tileScale*10;
        scene.fog = new THREE.Fog(color, near, far);
    }

    // FPS controls
    controls = new THREE.PointerLockControls( camera, document.body );
    document.body.addEventListener( 'click', () => { controls.lock(); } );
    scene.add( controls.getObject() );

    initMovementControls();

    // Load texture
    const texture = new THREE.TextureLoader().load( './client/src/textures/textures.png' );
    texture.minFilter = THREE.NearestFilter; //THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.NearestFilter;

    // Create geometry
    const geometry = new THREE.BoxGeometry( tileScale, tileScale, tileScale );
    const material = new THREE.MeshBasicMaterial( { map: texture } );

    // Add mesh to scene
    mesh = new THREE.Mesh( geometry, material );
    // scene.add( mesh );

    // Create floor
    for (let i = 0; i < worldSize; i++) {
        for (let j = 0; j < worldSize; j++) {
            // let randTile = 0;
            let randTile = Math.floor(Math.random() * 8);
            if (j >= 24 && j <= 26 && i >= 24 && i <= 26) randTile = 4;
            createQuadwithUV( {x: i*tileScale, y: 0, z: -j*tileScale}, texture, randTile );
        }
    }

    // Create renderer
    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setPixelRatio( window.devicePixelRatio/resFactor );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    // Set event listener
    window.addEventListener( 'resize', onWindowResize );

}

////////////////////////////////////////////////////
// Misc. Event Listeners
////////////////////////////////////////////////////
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

////////////////////////////////////////////////////
// Animation loop
////////////////////////////////////////////////////
function animate() {

    requestAnimationFrame( animate );

    frame++;

    // mesh.rotation.x += 0.005;
    // mesh.rotation.y += 0.01;

    // camera.position.y = (Math.sin(frame/5) * 5) + 155;
    // camera.position.x = (Math.sin(frame/250) * 1000) + 2500;
    // camera.position.z = (Math.cos(frame/250) * 1000) - 2500;
    // camera.rotation.y = (frame/250) - Math.PI/3;

    // Movement update
    movementUpdate();

    renderer.render( scene, camera );

}

////////////////////////////////////////////////////
// Basic mesh creation
////////////////////////////////////////////////////
function createCubeWithUV() {
    // UV coordiantes
    //https://stackoverflow.com/questions/20774648/three-js-generate-uv-coordinate
    // Minecrafty
    //https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_minecraft.html
    // Performance
    //https://threejs.org/examples/#webgl_instancing_performance
}

function createQuadwithUV( {x, y, z}, tex, idx) {
    const geometry = new THREE.PlaneGeometry( tileScale, tileScale );

    // Set UV of geometry
    let tileUV = getTileUVByIndex(idx);
    let uvAttribute = geometry.attributes.uv;
    uvAttribute.setXY( 0, tileUV[0].u, tileUV[0].v );
    uvAttribute.setXY( 1, tileUV[1].u, tileUV[1].v );
    uvAttribute.setXY( 2, tileUV[2].u, tileUV[2].v );
    uvAttribute.setXY( 3, tileUV[3].u, tileUV[3].v );

    // Make object
    const material = new THREE.MeshBasicMaterial( { map: tex/*, side: THREE.DoubleSide */ } );
    const plane = new THREE.Mesh( geometry, material );

    // Rotate and position plane
    plane.rotation.x = -Math.PI/2;
    plane.position.x = x;
    plane.position.y = y;
    plane.position.z = z;

    // Add to scene
    scene.add( plane );
}

function getTileUVByIndex(idx) {
    let row = 0;
    let maxTileRow = 16; // the totla number of tiles in a row & col
    let tileInc = 1/maxTileRow;
    
    // calculate the UV points for the tile
    let top = row * tileInc;
    let bottom = top + tileInc;
    let left = idx * tileInc;
    let right = left + tileInc;

    return [
        {u: (left), v: (1-top)}, // 0 - Top Left
        {u: (right), v: (1-top)}, // 1 - Top Right
        {u: (left), v: (1-bottom)}, // 2 - Bottom Left
        {u: (right), v: (1-bottom)}  // 3 - Bottom Right
    ];
}

////////////////////////////////////////////////////
// Basic FPS movement
////////////////////////////////////////////////////
function initMovementControls() {
    const onKeyDown = function ( event ) {

        switch ( event.code ) {

            case 'ArrowUp':
            case 'KeyW':
                moveForward = true;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = true;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight = true;
                break;

            case 'Space':
                //if ( canJump === true ) velocity.y += 350;
                //canJump = false;
                break;

        }
    }

    const onKeyUp = function ( event ) {

        switch ( event.code ) {

            case 'ArrowUp':
            case 'KeyW':
                moveForward = false;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = false;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight = false;
                break;

        }

    };

    document.addEventListener( 'keydown', onKeyDown );
    document.addEventListener( 'keyup', onKeyUp );
}

function movementUpdate() {
    // Move controler
    let isMoving = false;
    if (moveForward) {
        controls.moveForward(moveSpeed);
        isMoving = true;
    }
    if (moveBackward) {
        controls.moveForward(-moveSpeed);
        isMoving = true;
    }

    if (moveRight) {
        controls.moveRight(moveSpeed);
        isMoving = true;
    }
    if (moveLeft) {
        controls.moveRight(-moveSpeed);
        isMoving = true;
    }

    // Bob camera
    if (isMoving) camera.position.y = (Math.sin(frame/4) * (tileScale/20)) + playerHeight;
}