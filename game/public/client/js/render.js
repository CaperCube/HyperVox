let camera, scene, renderer;
let mesh;
let frame = 0;

init();
animate();

function init() {

    // Create camera
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 400;

    // Create scene
    //scene = new THREE.Scene();
    scene = new THREE.Scene();
    {
        const color = 0x000000;  // white
        const near = 10;
        const far = 500;
        scene.fog = new THREE.Fog(color, near, far);
    }

    // Load texture
    const texture = new THREE.TextureLoader().load( './client/src/textures/box.png' );
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.LinearMipMapLinearFilter;

    // Create geometry
    const geometry = new THREE.BoxGeometry( 100, 100, 100 );
    const material = new THREE.MeshBasicMaterial( { map: texture } );

    // Add mesh to scene
    mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    // Create renderer
    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    // Set event listener
    window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );

    frame++;

    mesh.rotation.x += 0.005;
    mesh.rotation.y += 0.01;

    camera.position.z = (Math.sin(frame/100) * 100) + 400;

    renderer.render( scene, camera );

}

function createCubeWithUV() {
    // UV coordiantes
    //https://stackoverflow.com/questions/20774648/three-js-generate-uv-coordinate
    // Minecrafty
    //https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_minecraft.html
    // Performance
    //https://threejs.org/examples/#webgl_instancing_performance
}