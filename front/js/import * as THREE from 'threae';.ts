import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let camera, scene, renderer, controls;
let particles, particleGeometry, particleMaterial;
let blackHoleMesh, blackHoleMaterial;
let renderTarget;
let accretionDiskParticles, accretionDiskGeometry, accretionDiskMaterial;
let starfieldGeometry, starfieldMaterial, starfieldParticles; // New variables for starfield

let eventHorizonCore;

const particleCount = 300000; // Increased particle count for a denser effect
const positions = new Float32Array(particleCount * 3);
const velocities = new Float32Array(particleCount * 3);

const accretionDiskParticleCount = 0; // Significantly more particles for a denser, glowing disk
const accretionDiskPositions = new Float32Array(accretionDiskParticleCount * 3);
const accretionDiskColors = new Float32Array(accretionDiskParticleCount * 3);
const accretionDiskVelocities = new Float32Array(accretionDiskParticleCount * 3);

const blackHoleMass = 3000; // Represents the strength of the gravitational pull
const eventHorizonRadius = 30; // Particles disappear when they reach this distance
const spawnRadius = 290; // Particles respawn at this distance
const accretionDiskRadius = 30; // Max radius for the accretion disk - slightly larger
const accretionDiskInnerRadius = eventHorizonRadius * 1.5; // Inner edge of the disk

// Starfield constants
const starCount = 10000; // Number of stars
const starfieldRadius = 1500; // Radius of the starfield sphere

init();
animate();

function init() {
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000); // Black background
    document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.5, 2000);
    camera.position.z = 50;
    camera.position.y = -500;

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Create a render target to capture the scene behind the black hole
    renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        stencilBuffer: false
    });

    // --- Starfield Background --- (Added before other particles so it's truly in the background)
    starfieldGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        // Distribute stars in a sphere far from the center
        const phi = Math.acos(Math.random() * 2 - 1);
        const theta = Math.random() * Math.PI * 2;
        const r = starfieldRadius * (0.8 + Math.random() * 0.2); // Vary radius slightly

        starPositions[i3] = r * Math.sin(phi) * Math.cos(theta);
        starPositions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        starPositions[i3 + 2] = r * Math.cos(phi);
    }
    starfieldGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

    starfieldMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.8, // Small star size
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
    });
    starfieldParticles = new THREE.Points(starfieldGeometry, starfieldMaterial);
    scene.add(starfieldParticles);

    // --- Main Particle System (Falling Particles) ---
    particleGeometry = new THREE.BufferGeometry();

    // Initialize particle positions and velocities
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        // Spawn particles in a sphere far from the center
        const phi = Math.acos(Math.random() * 2 - 1);
        const theta = Math.random() * Math.PI * 2;
        const r = spawnRadius * (0.7 + Math.random() * 0.3); // Vary spawn radius slightly

        positions[i3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = r * Math.cos(phi);

        // Give particles an initial tangential velocity to start orbiting
        // and a slight inward push
        const posVec = new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]);
        const tangent = new THREE.Vector3(-posVec.y, posVec.x, 0).normalize();
        const initialSpeed = Math.sqrt(blackHoleMass / posVec.length()) * 0.5; // Start with a fraction of orbital velocity
        const inwardPush = 0.005; // Small inward radial velocity

        velocities[i3] = tangent.x * initialSpeed - posVec.x * inwardPush;
        velocities[i3 + 1] = tangent.y * initialSpeed - posVec.y * inwardPush;
        velocities[i3 + 2] = tangent.z * initialSpeed - posVec.z * inwardPush;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Custom shader for round particles and fading luminosity
    const vertexShader = `
        uniform float size;
        uniform float scale;
        attribute float alpha;
        varying float vAlpha;
        void main() {
            vAlpha = alpha;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (scale / length(mvPosition.xyz)); // Scale size with distance
            gl_Position = projectionMatrix * mvPosition;
        }
    `;

    const fragmentShader = `
        uniform vec3 color;
        varying float vAlpha;
        void main() {
            float r = 0.0, delta = 0.0, alpha = 1.0;
            vec2 cxy = 2.0 * gl_PointCoord - 1.0;
            r = dot(cxy, cxy);
            alpha = smoothstep(0.9, 1.0, r);
            gl_FragColor = vec4(color, vAlpha * (1.0 - alpha)); // Apply fading luminosity and circular shape
        }
    `;

    // Create an array for alpha values (luminosity/opacity)
    const alphas = new Float32Array(particleCount);
    particleGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(0xffffff) },
            size: { value: 1 }, // Base size for particles
            scale: { value: window.innerHeight / 2 }, // Scale factor for perspective
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
    });

    particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // --- Accretion Disk Particle System ---
    accretionDiskGeometry = new THREE.BufferGeometry();

    const colorWhite = new THREE.Color(0xffffff);
    const colorRed = new THREE.Color(0xff4500); // Orange-red
    const colorYellow = new THREE.Color(0xffff00); // Added yellow for more fiery glow

    for (let i = 0; i < accretionDiskParticleCount; i++) {
        const i3 = i * 3;

        // Spawn particles in a flattened disk
        const r = accretionDiskInnerRadius + Math.random() * (accretionDiskRadius - accretionDiskInnerRadius);
        const theta = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * 0.8; // Thin disk, slightly more height variation

        accretionDiskPositions[i3] = r * Math.cos(theta);
        accretionDiskPositions[i3 + 1] = height;
        accretionDiskPositions[i3 + 2] = r * Math.sin(theta);

        // Initial orbital velocity for disk particles
        const posVec = new THREE.Vector3(accretionDiskPositions[i3], accretionDiskPositions[i3 + 1], accretionDiskPositions[i3 + 2]);
        const tangent = new THREE.Vector3(-posVec.z, 0, posVec.x).normalize(); // Tangential in XZ plane
        const initialSpeed = Math.sqrt(blackHoleMass / posVec.length()) * 0.9; // Slightly faster orbital velocity for more motion

        accretionDiskVelocities[i3] = tangent.x * initialSpeed;
        accretionDiskVelocities[i3 + 1] = 0; // Keep flat initially
        accretionDiskVelocities[i3 + 2] = tangent.z * initialSpeed;

        // Assign initial color based on distance
        const normalizedDist = THREE.MathUtils.mapLinear(r, accretionDiskInnerRadius, accretionDiskRadius, 0.0, 1.0);
        // Lerp from a fiery red/orange near the center to yellow/white further out
        const color = new THREE.Color().copy(colorRed).lerp(colorYellow, normalizedDist * 0.7).lerp(colorWhite, normalizedDist * 0.3);
        accretionDiskColors[i3] = color.r;
        accretionDiskColors[i3 + 1] = color.g;
        accretionDiskColors[i3 + 2] = color.b;
    }

    accretionDiskGeometry.setAttribute('position', new THREE.BufferAttribute(accretionDiskPositions, 3));
    accretionDiskGeometry.setAttribute('color', new THREE.BufferAttribute(accretionDiskColors, 3));

    const accretionDiskVertexShader = `
        uniform float size;
        uniform float scale;
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (scale / length(mvPosition.xyz));
            gl_Position = projectionMatrix * mvPosition;
        }
    `;

    const accretionDiskFragmentShader = `
        varying vec3 vColor;
        void main() {
            float r = 0.0, delta = 0.0, alpha = 1.0;
            vec2 cxy = 2.0 * gl_PointCoord - 1.0;
            r = dot(cxy, cxy);
            alpha = smoothstep(0.9, 1.0, r);
            gl_FragColor = vec4(vColor, (1.0 - alpha) * 1.5); // Boosted alpha for more glow
        }
    `;

    accretionDiskMaterial = new THREE.ShaderMaterial({
        uniforms: {
            size: { value: 3.5 }, // Larger particles for the disk
            scale: { value: window.innerHeight / 2 },
        },
        vertexShader: accretionDiskVertexShader,
        fragmentShader: accretionDiskFragmentShader,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        vertexColors: true, // Enable vertex colors
    });

    accretionDiskParticles = new THREE.Points(accretionDiskGeometry, accretionDiskMaterial);
    scene.add(accretionDiskParticles);

    // Black hole sphere for lensing effect
    const blackHoleGeo = new THREE.SphereGeometry(eventHorizonRadius * 1.05, 64, 64); // Slightly larger than EH for distortion
    blackHoleMaterial = new THREE.ShaderMaterial({
        uniforms: {
            tDiffuse: { value: null }, // Will hold the rendered scene texture
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            blackHolePos: { value: new THREE.Vector3(0, 0, 0) },
            eventHorizonRadius: { value: eventHorizonRadius },
            lensingStrength: { value: 0.15 } // Adjust this for more/less distortion
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform vec2 resolution;
            uniform vec3 blackHolePos;
            uniform float eventHorizonRadius;
            uniform float lensingStrength;
            varying vec2 vUv;

            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;

                // Convert black hole position to screen space
                vec4 bhScreenPos = projectionMatrix * modelViewMatrix * vec4(blackHolePos, 1.0);
                vec2 bhScreenUV = (bhScreenPos.xy / bhScreenPos.w * 0.5) + 0.5;

                vec2 toCenter = uv - bhScreenUV;
                float dist = length(toCenter);

                // Apply distortion based on distance from black hole center in screen space
                // More complex lensing would involve ray bending, but this is a simpler approximation
                float distortionFactor = pow(eventHorizonRadius / (dist * resolution.x), 1.5) * lensingStrength; // Scale distortion with radius and screen distance
                vec2 distortedUV = uv + normalize(toCenter) * distortionFactor;

                vec4 color = texture2D(tDiffuse, distortedUV);

                // Make the very center completely black to represent the actual black hole
                // The fade has been adjusted to ensure a solid black core.
                float coreRadius = eventHorizonRadius * 0.8; // Define a smaller core radius that is always black
                float fadeStart = eventHorizonRadius * 1.2; // Where the fade from lensing to black begins

                if (dist * resolution.x < fadeStart) { // Screen space radius
                    float fade = smoothstep(fadeStart, coreRadius, dist * resolution.x);
                    color = mix(color, vec4(0.0, 0.0, 0.0, 1.0), fade);
                }

                gl_FragColor = color;
            }
        `,
        transparent: true,
        depthWrite: false // Important for rendering correctly over background
    });

    // opaque core at the exact event horizon size
    const coreGeo = new THREE.SphereGeometry(eventHorizonRadius, 64, 64);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    eventHorizonCore = new THREE.Mesh(coreGeo, coreMat);
    eventHorizonCore.position.set(0, 0, 0);
    eventHorizonCore.renderOrder = 0; // draw first

    scene.add(eventHorizonCore);

    blackHoleMesh = new THREE.Mesh(blackHoleGeo, blackHoleMaterial);
    scene.add(blackHoleMesh);

    // Pre-simulate the animation for 20 seconds to get past the initial state
    const preSimulationSteps = 15 * 60; // 20 seconds * 60 frames/second
    for (let step = 0; step < preSimulationSteps; step++) {
        updateParticleStates();
        updateAccretionDiskStates();
    }
    // Ensure the positions are updated in the GPU after pre-simulation
    particleGeometry.attributes.position.needsUpdate = true;
    accretionDiskGeometry.attributes.position.needsUpdate = true;
    accretionDiskGeometry.attributes.color.needsUpdate = true;

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    particleMaterial.uniforms.scale.value = window.innerHeight / 2; // Update scale on resize
    accretionDiskMaterial.uniforms.scale.value = window.innerHeight / 2; // Update scale for disk
    renderTarget.setSize(window.innerWidth, window.innerHeight);
    blackHoleMaterial.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
}

function updateParticleStates() {
    const pPositions = particleGeometry.attributes.position.array;
    const pAlphas = particleGeometry.attributes.alpha.array; // Get alpha attribute array

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        const px = pPositions[i3];
        const py = pPositions[i3 + 1];
        const pz = pPositions[i3 + 2];

        const distSq = px * px + py * py + pz * pz;
        const dist = Math.sqrt(distSq);

        // Calculate alpha based on distance from the event horizon
        // Fades from 1 (far) to 0 (near event horizon)
        const fadeStartDistance = eventHorizonRadius + 10; // Start fading 10 units away
        if (dist < fadeStartDistance) {
            pAlphas[i] = THREE.MathUtils.mapLinear(dist, eventHorizonRadius, fadeStartDistance, 0.0, 1.0);
        } else {
            pAlphas[i] = 1.0;
        }

        // Check for event horizon crossing
        if (dist < eventHorizonRadius) {
            // Reset particle to a new random spawn point far away
            const phi = Math.acos(Math.random() * 2 - 1);
            const theta = Math.random() * Math.PI * 2;
            const r = spawnRadius * (0.7 + Math.random() * 0.3);

            pPositions[i3] = r * Math.sin(phi) * Math.cos(theta);
            pPositions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            pPositions[i3 + 2] = r * Math.cos(phi);

            // Reset velocity to a new tangential velocity at the new spawn point
            const newPosVec = new THREE.Vector3(pPositions[i3], pPositions[i3 + 1], pPositions[i3 + 2]);
            const tangent = new THREE.Vector3(-newPosVec.y, newPosVec.x, 0).normalize();
            const initialSpeed = Math.sqrt(blackHoleMass / newPosVec.length()) * 0.5;
            const inwardPush = 0.005;

            velocities[i3] = tangent.x * initialSpeed - newPosVec.x * inwardPush;
            velocities[i3 + 1] = tangent.y * initialSpeed - newPosVec.y * inwardPush;
            velocities[i3 + 2] = tangent.z * initialSpeed - newPosVec.z * inwardPush;

            continue; // Skip further calculations for this particle in this frame
        }

        // Calculate gravitational force (inverse cube law for stronger acceleration)
        const forceMagnitude = blackHoleMass / (distSq * dist); // F = M / r^3 (instead of r^2)

        // Accelerate towards the center
        const ax = -px * forceMagnitude;
        const ay = -py * forceMagnitude;
        const az = -pz * forceMagnitude;

        // Update velocities
        velocities[i3] += ax;
        velocities[i3 + 1] += ay;
        velocities[i3 + 2] += az;

        // Update positions
        pPositions[i3] += velocities[i3];
        pPositions[i3 + 1] += velocities[i3 + 1];
        pPositions[i3 + 2] += velocities[i3 + 2];
    }
    particleGeometry.attributes.alpha.needsUpdate = true; // Mark alpha attribute for update
}

function updateAccretionDiskStates() {
    const pPositions = accretionDiskGeometry.attributes.position.array;
    const pColors = accretionDiskGeometry.attributes.color.array;

    const colorWhite = new THREE.Color(0xffffff);
    const colorRed = new THREE.Color(0xff4500);
    const colorYellow = new THREE.Color(0xffff00);

    for (let i = 0; i < accretionDiskParticleCount; i++) {
        const i3 = i * 3;

        let px = pPositions[i3];
        let py = pPositions[i3 + 1];
        let pz = pPositions[i3 + 2];

        const distSq = px * px + py * py + pz * pz;
        const dist = Math.sqrt(distSq);

        // Recalculate color based on current distance
        const normalizedDist = THREE.MathUtils.mapLinear(dist, accretionDiskInnerRadius, accretionDiskRadius, 0.0, 1.0);
        const color = new THREE.Color().copy(colorRed).lerp(colorYellow, normalizedDist * 0.7).lerp(colorWhite, normalizedDist * 0.3);
        pColors[i3] = color.r;
        pColors[i3 + 1] = color.g;
        pColors[i3 + 2] = color.b;

        // If particle falls into event horizon or goes too far, respawn it
        if (dist < eventHorizonRadius || dist > accretionDiskRadius * 1.5) {
            const r = accretionDiskInnerRadius + Math.random() * (accretionDiskRadius - accretionDiskInnerRadius);
            const theta = Math.random() * Math.PI * 2;
            const height = (Math.random() - 0.5) * 0.8; // Thin disk, slightly more height variation

            px = r * Math.cos(theta);
            py = height;
            pz = r * Math.sin(theta);

            pPositions[i3] = px;
            pPositions[i3 + 1] = py;
            pPositions[i3 + 2] = pz;

            const newPosVec = new THREE.Vector3(px, py, pz);
            const tangent = new THREE.Vector3(-newPosVec.z, 0, newPosVec.x).normalize();
            const initialSpeed = Math.sqrt(blackHoleMass / newPosVec.length()) * 0.9; // Slightly faster orbital velocity

            accretionDiskVelocities[i3] = tangent.x * initialSpeed;
            accretionDiskVelocities[i3 + 1] = 0; // Keep flat initially
            accretionDiskVelocities[i3 + 2] = tangent.z * initialSpeed;

            continue; // Skip further calculations for this particle in this frame
        }

        // Apply gravitational force to disk particles
        const forceMagnitude = blackHoleMass / (distSq * dist); // F = M / r^3

        const ax = -px * forceMagnitude;
        const ay = -py * forceMagnitude * 0.1; // Reduced pull in Y to keep it flat
        const az = -pz * forceMagnitude;

        accretionDiskVelocities[i3] += ax;
        accretionDiskVelocities[i3 + 1] += ay;
        accretionDiskVelocities[i3 + 2] += az;

        // Add some friction/damping to prevent velocities from growing too large
        accretionDiskVelocities[i3] *= 0.993; // Slightly less damping
        accretionDiskVelocities[i3 + 1] *= 0.993;
        accretionDiskVelocities[i3 + 2] *= 0.993;

        // Update positions
        pPositions[i3] += accretionDiskVelocities[i3];
        pPositions[i3 + 1] += accretionDiskVelocities[i3 + 1];
        pPositions[i3 + 2] += accretionDiskVelocities[i3 + 2];

        // Ensure particles stay relatively flat
        pPositions[i3 + 1] *= 0.98; // Gently pull towards the XZ plane, slightly stronger
    }
    accretionDiskGeometry.attributes.position.needsUpdate = true;
    accretionDiskGeometry.attributes.color.needsUpdate = true;
}

function animate() {
    requestAnimationFrame(animate);

    updateParticleStates();
    updateAccretionDiskStates();

    particleGeometry.attributes.position.needsUpdate = true;
    accretionDiskGeometry.attributes.position.needsUpdate = true;
    accretionDiskGeometry.attributes.color.needsUpdate = true;

    // Render the scene (particles) to the render target first
    blackHoleMesh.visible = false; // Hide black hole mesh when rendering to target
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);

    // Render the main scene to the screen
    blackHoleMesh.visible = true; // Show black hole mesh for final render
    blackHoleMaterial.uniforms.tDiffuse.value = renderTarget.texture;
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);

    controls.update();
}