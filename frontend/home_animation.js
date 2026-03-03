import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// GSAP is loaded globally via script tag in index.html, but we can access it here.
// We assume gsap and ScrollTrigger are available on window.

const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue
scene.fog = new THREE.Fog(0x87CEEB, 10, 50);

// Objects
const objectsToUpdate = [];

// --- 1. Farm (Ground) ---
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x4C9A2A });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI * 0.5;
ground.position.y = 0;
scene.add(ground);

// --- 2. Plants (Cones) ---
const plantGeometry = new THREE.ConeGeometry(0.2, 0.8, 8);
const plantMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const plantsGroup = new THREE.Group();
scene.add(plantsGroup);

const plantCount = 20;
for (let i = 0; i < plantCount; i++) {
    const plant = new THREE.Mesh(plantGeometry, plantMaterial);
    const angle = Math.random() * Math.PI * 2;
    const radius = 3 + Math.random() * 4;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    plant.position.set(x, 0, z); // Start underground or scale 0
    plant.scale.set(0, 0, 0); // Start invisible
    plantsGroup.add(plant);
}

// --- 3. Vegetables (Spheres) ---
const vegGeometry = new THREE.SphereGeometry(0.15, 16, 16);
const vegMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6347 }); // Tomato red
const vegGroup = new THREE.Group();
scene.add(vegGroup);

// Create veg for each plant
plantsGroup.children.forEach(plant => {
    const veg = new THREE.Mesh(vegGeometry, vegMaterial);
    veg.position.copy(plant.position);
    veg.position.y = 0.5; // On top of plant
    veg.scale.set(0, 0, 0); // Hidden
    vegGroup.add(veg);
});

// --- 4. Crate/Box ---
const crateGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
const crateMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
const crate = new THREE.Mesh(crateGeometry, crateMaterial);
crate.position.set(5, 0.5, 5); // To the side
scene.add(crate);

// --- 5. Vehicle ---
const vehicleGroup = new THREE.Group();
scene.add(vehicleGroup);
vehicleGroup.position.set(15, 0, 5); // Start off-screen

const bodyGeo = new THREE.BoxGeometry(2, 1, 4);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0000FF });
const body = new THREE.Mesh(bodyGeo, bodyMat);
body.position.y = 0.5;
vehicleGroup.add(body);

const cabGeo = new THREE.BoxGeometry(2, 1.5, 1.5);
const cab = new THREE.Mesh(cabGeo, bodyMat);
cab.position.set(0, 0.75, 1.5);
vehicleGroup.add(cab);

const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
const wheelPositions = [
    [-1.1, 0.4, 1.5], [1.1, 0.4, 1.5], // Front
    [-1.1, 0.4, -1.5], [1.1, 0.4, -1.5] // Back
];
wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI * 0.5;
    wheel.position.set(...pos);
    vehicleGroup.add(wheel);
});


// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);
scene.add(camera);

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- ANIMATIONS (GSAP ScrollTrigger) ---
// We need to register ScrollTrigger. Since we use CDN in HTML, it's global.
gsap.registerPlugin(ScrollTrigger);

const tl = gsap.timeline({
    scrollTrigger: {
        trigger: ".section-container", // We will create this in HTML
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
        // markers: true // Debug
    }
});

// Phase 1: Growth (Camera moves in, Plants scale up)
tl.to(camera.position, { x: 0, y: 3, z: 6, duration: 2 }, "growth")
    .to(plantsGroup.children.map(p => p.scale), { x: 1, y: 1, z: 1, duration: 2, stagger: 0.1 }, "growth");

// Phase 2: Production (Vegetables appear)
tl.to(vegGroup.children.map(v => v.scale), { x: 1, y: 1, z: 1, duration: 1, stagger: 0.1 }, "production");

// Phase 3: Harvest (Vegetables move to Crate)
// We'll move all vegetables to the crate position
tl.to(vegGroup.children.map(v => v.position), {
    x: crate.position.x,
    y: crate.position.y + 0.5,
    z: crate.position.z,
    duration: 3,
    stagger: 0.05
}, "harvest")
    .to(vegGroup.children.map(v => v.scale), { x: 0, y: 0, z: 0, duration: 0.5 }, ">-1"); // Disappear into crate

// Phase 4: Logistics (Vehicle arrives)
tl.to(vehicleGroup.position, { x: 5, z: 2, duration: 3, ease: "power1.out" }, "logistics")
    .to(camera.position, { x: 8, y: 4, z: 8, duration: 3 }, "logistics");

// Phase 5: Loading (Crate moves to Vehicle)
tl.to(crate.position, { x: vehicleGroup.position.x, y: 1.5, z: vehicleGroup.position.z, duration: 1 }, "loading")
    .to(crate.scale, { x: 0, y: 0, z: 0, duration: 0.5 }, ">-0.2"); // Put in truck

// Phase 6: Departure (Vehicle leaves)
tl.to(vehicleGroup.position, { x: -20, duration: 4, ease: "power1.in" }, "departure")
    .to(camera.position, { x: 0, y: 10, z: 20, duration: 4 }, "departure");

// Tick
const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // Rotate plants slightly for life
    plantsGroup.rotation.y = Math.sin(elapsedTime * 0.5) * 0.1;

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};

tick();
