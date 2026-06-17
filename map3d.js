// 3D Map using Three.js
let scene, camera, renderer, playerBase, enemyBases = [];

function init3DMap() {
    const canvas3DContainer = document.getElementById('canvas3D');
    if (!canvas3DContainer) return;
    
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.Fog(0x87ceeb, 200, 1000);
    
    // Camera setup
    const width = canvas3DContainer.clientWidth;
    const height = canvas3DContainer.clientHeight;
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 50, 80);
    camera.lookAt(0, 0, 0);
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    canvas3DContainer.appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Conveyor Belt (center)
    createConveyorBelt();
    
    // Player Base (blue, bottom left)
    playerBase = createBase(new THREE.Vector3(-60, 0, 0), 0x3498db, 'YOUR BASE');
    
    // Enemy Bases (red)
    const enemyPositions = [
        new THREE.Vector3(60, 0, 0),
        new THREE.Vector3(0, 0, 60),
        new THREE.Vector3(-60, 0, 60),
        new THREE.Vector3(60, 0, 60)
    ];
    
    gameState.enemies.forEach((enemy, index) => {
        if (index < enemyPositions.length) {
            const base = createBase(enemyPositions[index], 0xe74c3c, enemy.name);
            enemyBases.push(base);
        }
    });
    
    // Skybox
    createSkybox();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start animation loop
    animate3D();
}

function createConveyorBelt() {
    const geometry = new THREE.BoxGeometry(40, 5, 30);
    const material = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
    const belt = new THREE.Mesh(geometry, material);
    belt.position.y = 2.5;
    belt.castShadow = true;
    belt.receiveShadow = true;
    
    // Add animation to belt
    belt.userData.animate = true;
    belt.userData.startTime = Date.now();
    
    scene.add(belt);
    
    // Add text label
    addLabel(belt.position, 'SHOP');
}

function createBase(position, color, label) {
    const baseGroup = new THREE.Group();
    
    // Base platform
    const baseGeometry = new THREE.BoxGeometry(30, 3, 30);
    const baseMaterial = new THREE.MeshPhongMaterial({ color: color });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.y = 1.5;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    baseGroup.add(baseMesh);
    
    // Walls
    const wallGeometry = new THREE.BoxGeometry(30, 15, 3);
    const wallMaterial = new THREE.MeshPhongMaterial({ color: color, opacity: 0.8 });
    
    const walls = [
        new THREE.Vector3(0, 10, 15),
        new THREE.Vector3(0, 10, -15),
        new THREE.Vector3(15, 10, 0),
        new THREE.Vector3(-15, 10, 0)
    ];
    
    walls.forEach(wallPos => {
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.copy(wallPos);
        wall.castShadow = true;
        wall.receiveShadow = true;
        baseGroup.add(wall);
    });
    
    // Flag on top
    const flagGeometry = new THREE.BoxGeometry(3, 15, 8);
    const flagMaterial = new THREE.MeshPhongMaterial({ color: color });
    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.y = 20;
    flag.castShadow = true;
    baseGroup.add(flag);
    
    baseGroup.position.copy(position);
    baseGroup.userData.label = label;
    baseGroup.userData.color = color;
    
    scene.add(baseGroup);
    return baseGroup;
}

function createSkybox() {
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
        color: 0x87ceeb,
        side: THREE.BackSide
    });
    const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skyMesh);
}

function addLabel(position, text) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const geometry = new THREE.PlaneGeometry(20, 5);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.position.y += 30;
    if (camera) mesh.lookAt(camera.position);
    scene.add(mesh);
}

function animate3D() {
    requestAnimationFrame(animate3D);
    
    if (!scene) return;
    
    // Rotate conveyor belt
    scene.children.forEach(child => {
        if (child.userData && child.userData.animate) {
            const elapsed = (Date.now() - child.userData.startTime) / 1000;
            child.rotation.z = (elapsed * 2) % (Math.PI * 2);
        }
    });
    
    // Gentle rotation of bases
    enemyBases.forEach((base) => {
        if (base) base.rotation.y += 0.002;
    });
    
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function onWindowResize() {
    const canvas3DContainer = document.getElementById('canvas3D');
    if (!canvas3DContainer || !camera || !renderer) return;
    
    const width = canvas3DContainer.clientWidth;
    const height = canvas3DContainer.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// Initialize 3D map when game loads
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const canvas3D = document.getElementById('canvas3D');
        if (canvas3D) {
            init3DMap();
        }
    }, 500);
});
