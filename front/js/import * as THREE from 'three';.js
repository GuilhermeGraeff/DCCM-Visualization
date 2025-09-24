import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let camera, scene, renderer;
let points; // Now using a single THREE.Points object
let particleGeometry; // BufferGeometry for particles
let particleMaterial; // ShaderMaterial for particles

let sourcePositionsArray; // Float32Array for vertex shader attribute
let targetPositionsArray; // Float32Array for vertex shader attribute
let allShapeTargetPositions = []; // Array to hold all pre-calculated shape positions
let clock = new THREE.Clock();
let transitionDuration = 4; // seconds for the transition
let transitionProgress = 0;
let isTransitioning = true;
let currentShapeIndex = 0; // Start with the first shape (cube)

let numParticles = 4000; // Now a 'let' variable

// Global variables for particle customization
let particleSize = 0.05; // Now a 'let' variable
const defaultParticleColor = new THREE.Color(0xffffff); // Default to white, now a THREE.Color

// Global variable for lighting (less relevant with ShaderMaterial unless we pass lights to shader)
const lightBrightness = 10.0; // Controls the overall brightness of the scene lights

// Vertex Shader
const vertexShader = `
    uniform float transitionProgress;
    uniform float particleSize;
    attribute vec3 startPosition;
    attribute vec3 targetPosition;

    void main() {
        // Easing function: smoothstep or 0.5 - 0.5 * cos(x * PI)
        float easedProgress = 0.5 - 0.5 * cos(transitionProgress * 3.141592653589793);
        vec3 animatedPosition = mix(startPosition, targetPosition, easedProgress);

        vec4 mvPosition = modelViewMatrix * vec4(animatedPosition, 1.0);
        gl_PointSize = particleSize * (300.0 / -mvPosition.z); // Scale size with distance
        gl_Position = projectionMatrix * mvPosition;
    }
`;

// Fragment Shader
const fragmentShader = `
    uniform vec3 particleColor;

    void main() {
        gl_FragColor = vec4(particleColor, 1.0);
    }
`;

function generateCubePositions(count, gridSize, spacing) {
    const positions = [];
    const totalGridSize = gridSize * spacing;
    const offset = totalGridSize / 2 - spacing / 2;

    for (let i = 0; i < count; i++) {
        const x = (i % gridSize) * spacing - offset;
        const y = (Math.floor(i / gridSize) % gridSize) * spacing - offset;
        const z = Math.floor(i / (gridSize * gridSize)) * spacing - offset;
        positions.push(x, y, z);
    }
    return new Float32Array(positions);
}

function generateSpherePositions(count, radius) {
    const positions = [];
    for (let i = 0; i < count; i++) {
        const phi = Math.acos(-1 + (2 * i) / count); // Spherical coordinates
        const theta = Math.sqrt(count * Math.PI) * phi;

        const x = radius * Math.cos(theta) * Math.sin(phi);
        const y = radius * Math.sin(theta) * Math.sin(phi);
        const z = radius * Math.cos(phi);
        positions.push(x, y, z);
    }
    return new Float32Array(positions);
}

function generateCylinderPositions(count, radius, height) {
    const positions = [];
    if (count === 0) return new Float32Array(0);

    for (let i = 0; i < count; i++) {
        const t = i / count; // Normalized progress along the cylinder's height and circumference
        const y = height * (t - 0.5); // Distribute vertically from -height/2 to +height/2

        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        const angle = i * goldenAngle;

        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        positions.push(x, y, z);
    }
    return new Float32Array(positions);
}

function generateTorusPositions(count, majorRadius, minorRadius) {
    const positions = [];
    if (count === 0) return new Float32Array(0);

    const numMajorSegments = Math.floor(Math.sqrt(count * majorRadius / minorRadius));
    const numMinorSegments = Math.ceil(count / numMajorSegments);

    for (let i = 0; i < count; i++) {
        const majorStep = (i % numMajorSegments) / numMajorSegments;
        const minorStep = Math.floor(i / numMajorSegments) / numMinorSegments;

        const u = majorStep * Math.PI * 2; // Angle around the major radius
        const v = minorStep * Math.PI * 2; // Angle around the minor radius

        const x = (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u);
        const y = (majorRadius + minorRadius * Math.cos(v)) * Math.sin(u);
        const z = minorRadius * Math.sin(v);
        positions.push(x, y, z);
    }
    return new Float32Array(positions);
}

function generateConePositions(count, radius, height) {
    const positions = [];
    if (count === 0) return new Float32Array(0);

    for (let i = 0; i < count; i++) {
        const t = i / count; // Normalized progress from cone tip to base
        const y = height * (t - 0.5); // Distribute vertically from -height/2 to +height/2

        const currentRadius = radius * (1 - t); // At t=0 (bottom), radius=radius. At t=1 (top), radius=0.

        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        const angle = i * goldenAngle;

        const x = currentRadius * Math.cos(angle);
        const z = currentRadius * Math.sin(angle);
        positions.push(x, y, z);
    }
    return new Float32Array(positions);
}

function generateKleinBottlePositions(count, scale) {
    const positions = [];
    const numU = Math.ceil(Math.sqrt(count));
    const numV = Math.ceil(count / numU);

    for (let i = 0; i < count; i++) {
        const uIndex = i % numU;
        const vIndex = Math.floor(i / numU);

        const u = (uIndex / numU) * Math.PI * 2;
        const v = (vIndex / numV) * Math.PI * 2;

        let x, y, z;

        if (u < Math.PI) {
            x = scale * (6 * Math.cos(u) * (1 + Math.sin(u)) + 4 * (1 - Math.cos(u) / 2) * Math.cos(u) * Math.cos(v));
            y = scale * (16 * Math.sin(u) + 4 * (1 - Math.cos(u) / 2) * Math.sin(u) * Math.cos(v));
            z = scale * (4 * (1 - Math.cos(u) / 2) * Math.sin(v));
        } else {
            x = scale * (6 * Math.cos(u) * (1 + Math.sin(u)) + 4 * (1 - Math.cos(u) / 2) * Math.cos(v + Math.PI));
            y = scale * (16 * Math.sin(u));
            z = scale * (4 * (1 - Math.cos(u) / 2) * Math.sin(v));
        }
        positions.push(x, y, z);
    }
    return new Float32Array(positions);
}

function generateMobiusStripPositions(count, radius, width) {
    const positions = [];
    if (count === 0) return new Float32Array(0);

    const circumference = 2 * Math.PI * radius;
    const aspectRatio = circumference / width;

    let numT_ideal = Math.sqrt(count / aspectRatio);
    let numV_ideal = Math.sqrt(count * aspectRatio);

    let numT = Math.max(1, Math.round(numT_ideal));
    let numV = Math.max(1, Math.round(numV_ideal));

    numV = Math.max(1, Math.round(count / numT));
    
    let currentParticleCount = 0;
    const vStep = (Math.PI * 2) / numV;
    const tStep = width / numT;

    for (let i = 0; i < numV; i++) {
        const v = i * vStep;
        for (let j = 0; j < numT; j++) {
            if (currentParticleCount >= count) break; 

            const t = (j - (numT - 1) / 2) * tStep;

            const x = (radius + t * Math.cos(v / 2)) * Math.cos(v);
            const y = (radius + t * Math.cos(v / 2)) * Math.sin(v);
            const z = t * Math.sin(v / 2);
            positions.push(x, y, z);
            currentParticleCount++;
        }
        if (currentParticleCount >= count) break;
    }

    while (positions.length / 3 < count) {
        if (positions.length > 0) {
            const randomIndex = Math.floor(Math.random() * (positions.length / 3)) * 3;
            positions.push(positions[randomIndex], positions[randomIndex + 1], positions[randomIndex + 2]);
        } else {
            positions.push((Math.random() - 0.5) * width, (Math.random() - 0.5) * width, (Math.random() - 0.5) * width);
        }
    }

    return new Float32Array(positions);
}

function generateRandomPositions(count, spread) {
    const positions = [];
    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * spread * 2;
        const y = (Math.random() - 0.5) * spread * 2;
        const z = (Math.random() - 0.5) * spread * 2;
        positions.push(x, y, z);
    }
    return new Float32Array(positions);
}

function precalculateAllShapePositions(count) {
    const newAllShapeTargetPositions = [];
    const gridSize = Math.ceil(Math.cbrt(count));
    const cubeSpacing = 0.45;
    newAllShapeTargetPositions.push(generateCubePositions(count, gridSize, cubeSpacing)); // Index 0: Cube
    newAllShapeTargetPositions.push(generateSpherePositions(count, 3)); // Index 1: Sphere
    newAllShapeTargetPositions.push(generateCylinderPositions(count, 3.5, 7)); // Index 2: Cylinder (radius, height)
    newAllShapeTargetPositions.push(generateTorusPositions(count, 4, 1.5)); // Index 3: Torus (majorRadius, minorRadius)
    newAllShapeTargetPositions.push(generateConePositions(count, 3.5, 7)); // Index 4: Cone (radius, height)
    newAllShapeTargetPositions.push(generateKleinBottlePositions(count, 0.3)); // Index 5: Klein Bottle (scale)
    newAllShapeTargetPositions.push(generateMobiusStripPositions(count, 4, 2)); // Index 6: Möbius Strip (radius, width)
    return newAllShapeTargetPositions;
}

function createParticleSystem(count, initialPositions) {
    if (points) {
        scene.remove(points);
        particleGeometry.dispose();
        particleMaterial.dispose();
    }

    particleGeometry = new THREE.BufferGeometry();
    particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
            transitionProgress: { value: 0.0 },
            particleSize: { value: particleSize },
            particleColor: { value: defaultParticleColor }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        depthWrite: false // Important for particles to render correctly without z-fighting
    });

    // Create initial source and target position arrays
    sourcePositionsArray = new Float32Array(count * 3);
    targetPositionsArray = new Float32Array(count * 3);

    // Populate source positions with initial random positions
    for (let i = 0; i < count * 3; i++) {
        sourcePositionsArray[i] = initialPositions[i];
    }

    // Add attributes to geometry
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(sourcePositionsArray, 3)); // This is actually unused in the shader, but often good practice
    particleGeometry.setAttribute('startPosition', new THREE.BufferAttribute(sourcePositionsArray, 3));
    particleGeometry.setAttribute('targetPosition', new THREE.BufferAttribute(targetPositionsArray, 3));

    points = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(points);
}

function updateParticleAttributes(newSourcePositions, newTargetPositions) {
    // Ensure the new arrays have the correct size
    const count = newSourcePositions.length / 3;

    // Resize or reallocate if particle count changed significantly
    if (sourcePositionsArray.length !== newSourcePositions.length) {
        sourcePositionsArray = new Float32Array(newSourcePositions.length);
        targetPositionsArray = new Float32Array(newTargetPositions.length);
        particleGeometry.setAttribute('startPosition', new THREE.BufferAttribute(sourcePositionsArray, 3));
        particleGeometry.setAttribute('targetPosition', new THREE.BufferAttribute(targetPositionsArray, 3));
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(sourcePositionsArray, 3)); // Update dummy position attribute
    }

    sourcePositionsArray.set(newSourcePositions);
    targetPositionsArray.set(newTargetPositions);

    particleGeometry.attributes.startPosition.needsUpdate = true;
    particleGeometry.attributes.targetPosition.needsUpdate = true;
    particleGeometry.attributes.position.needsUpdate = true; // Update dummy position attribute
}

function updateParticles(newCount, newSize) {
    numParticles = newCount;
    particleSize = newSize;

    // Update uniform for particle size
    particleMaterial.uniforms.particleSize.value = newSize;

    // Pre-calculate new target positions for all shapes with the new count
    allShapeTargetPositions = precalculateAllShapePositions(numParticles);

    // Generate new random initial positions for new particles
    const randomInitialPositions = generateRandomPositions(numParticles, 15);
    const newTargetPositions = allShapeTargetPositions[currentShapeIndex];

    // Update the attributes of the existing particle system, or re-create if count changed
    if (points && points.geometry.attributes.startPosition.count === numParticles) {
        updateParticleAttributes(randomInitialPositions, newTargetPositions);
    } else {
        createParticleSystem(numParticles, randomInitialPositions); // Recreate if count changed
        updateParticleAttributes(randomInitialPositions, newTargetPositions); // Set attributes for the new system
    }

    // Reset transition to smoothly move to the new shape/count combination
    transitionProgress = 0;
    isTransitioning = true;
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a); // Dark background

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.04;

    controls.minPolarAngle = -Infinity;
    controls.maxPolarAngle = Infinity;
    controls.minAzimuthAngle = -Infinity;
    controls.maxAzimuthAngle = Infinity;

    // Lights (still good for general scene lighting, even if particles are unlit by shader)
    const ambientLight = new THREE.AmbientLight(0xffffff, lightBrightness); // soft white light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, lightBrightness);
    directionalLight.position.set(5, 5, 5).normalize();
    scene.add(directionalLight);

    // Initial pre-calculation of all target shape positions
    allShapeTargetPositions = precalculateAllShapePositions(numParticles);

    // Initial random positions for the first transition
    const randomInitialPositions = generateRandomPositions(numParticles, 15);
    createParticleSystem(numParticles, randomInitialPositions);

    // Set the initial target to the first shape (cube)
    const initialTargetPositions = allShapeTargetPositions[currentShapeIndex];
    updateParticleAttributes(randomInitialPositions, initialTargetPositions);

    // Create main control panel container
    const controlPanel = document.createElement('div');
    controlPanel.style.position = 'fixed';
    controlPanel.style.left = '15px';
    controlPanel.style.top = '15px';
    controlPanel.style.display = 'flex';
    controlPanel.style.flexDirection = 'column';
    controlPanel.style.gap = '10px';
    controlPanel.style.zIndex = '100';
    controlPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    controlPanel.style.padding = '15px';
    controlPanel.style.borderRadius = '8px';
    controlPanel.style.fontFamily = 'sans-serif';
    controlPanel.style.color = '#ffffff';
    document.body.appendChild(controlPanel);

    // Control Panel Header
    const panelHeader = document.createElement('div');
    panelHeader.style.display = 'flex';
    panelHeader.style.justifyContent = 'space-between';
    panelHeader.style.alignItems = 'center';
    panelHeader.style.marginBottom = '10px';
    controlPanel.appendChild(panelHeader);

    const panelTitle = document.createElement('h3');
    panelTitle.textContent = 'Controls';
    panelTitle.style.margin = '0';
    panelTitle.style.fontSize = '16px';
    panelTitle.style.fontWeight = 'bold';
    panelHeader.appendChild(panelTitle);

    const collapseButton = document.createElement('button');
    collapseButton.textContent = '▼'; // Down arrow for expanded state
    collapseButton.style.background = 'none';
    collapseButton.style.border = 'none';
    collapseButton.style.color = '#ffffff';
    collapseButton.style.fontSize = '18px';
    collapseButton.style.cursor = 'pointer';
    collapseButton.style.padding = '0';
    collapseButton.style.transition = 'transform 0.3s ease';
    panelHeader.appendChild(collapseButton);

    // Content wrapper for collapsable elements
    const panelContent = document.createElement('div');
    panelContent.style.display = 'flex';
    panelContent.style.flexDirection = 'column';
    panelContent.style.gap = '10px';
    controlPanel.appendChild(panelContent);

    let isPanelCollapsed = false;
    collapseButton.onclick = () => {
        isPanelCollapsed = !isPanelCollapsed;
        if (isPanelCollapsed) {
            panelContent.style.display = 'none';
            collapseButton.style.transform = 'rotate(180deg)'; // Rotate 180 for up
        } else {
            panelContent.style.display = 'flex';
            collapseButton.style.transform = 'rotate(0deg)'; // No rotation for down
        }
    };

    // Shape Selection Group
    const shapeSelectionGroup = document.createElement('div');
    shapeSelectionGroup.style.display = 'flex';
    shapeSelectionGroup.style.flexDirection = 'column';
    shapeSelectionGroup.style.gap = '8px';
    panelContent.appendChild(shapeSelectionGroup);

    const shapeNames = ['Cube', 'Sphere', 'Cylinder', 'Torus', 'Cone', 'Klein Bottle', 'Möbius Strip'];
    
    shapeNames.forEach((name, index) => {
        const button = document.createElement('button');
        button.textContent = name;
        button.style.padding = '8px 12px';
        button.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        button.style.color = '#ffffff';
        button.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        button.style.borderRadius = '6px';
        button.style.cursor = 'pointer';
        button.style.fontWeight = 'normal';
        button.style.fontFamily = 'inherit';
        button.style.fontSize = '13px';
        button.style.boxShadow = 'none';
        button.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        button.onmouseover = () => {
            button.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            button.style.color = '#fcca03';
        };
        button.onmouseout = () => {
            button.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            button.style.color = '#ffffff';
        };
        button.onclick = () => changeShape(index);
        shapeSelectionGroup.appendChild(button);
    });

    // Customization Group (for color and sliders)
    const customizationGroup = document.createElement('div');
    customizationGroup.style.display = 'flex';
    customizationGroup.style.flexDirection = 'column';
    customizationGroup.style.gap = '10px';
    panelContent.appendChild(customizationGroup);

    // Color picker
    const colorPickerContainer = document.createElement('div');
    colorPickerContainer.style.display = 'flex';
    colorPickerContainer.style.flexDirection = 'column';
    colorPickerContainer.style.gap = '5px';
    customizationGroup.appendChild(colorPickerContainer);

    const colorLabel = document.createElement('label');
    colorLabel.textContent = 'Particle Color:';
    colorLabel.style.color = '#ffffff';
    colorLabel.style.fontFamily = 'inherit';
    colorLabel.style.fontSize = '13px';
    colorPickerContainer.appendChild(colorLabel);

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = '#' + defaultParticleColor.getHexString();
    colorInput.style.width = '70px';
    colorInput.style.height = '25px';
    colorInput.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    colorInput.style.borderRadius = '4px';
    colorInput.style.backgroundColor = 'transparent';
    colorInput.style.cursor = 'pointer';
    colorInput.style.padding = '0';
    colorInput.style.webkitAppearance = 'none';
    colorInput.style.mozAppearance = 'none';
    colorInput.style.appearance = 'none';

    colorInput.style.setProperty('-webkit-color-swatch-wrapper', 'padding: 0;');
    colorInput.style.setProperty('-webkit-color-swatch', 'border: none;');
    colorInput.style.setProperty('-moz-color-swatch-wrapper', 'padding: 0;');
    colorInput.style.setProperty('-moz-color-swatch', 'border: none;');

    colorInput.onchange = (event) => {
        particleMaterial.uniforms.particleColor.value.set(event.target.value);
    };
    colorPickerContainer.appendChild(colorInput);

    // Particle Sliders Group
    const particleSlidersContainer = document.createElement('div');
    particleSlidersContainer.style.display = 'flex';
    particleSlidersContainer.style.flexDirection = 'column';
    particleSlidersContainer.style.gap = '10px';
    customizationGroup.appendChild(particleSlidersContainer);

    // Particle Size Slider
    const particleSizeContainer = document.createElement('div');
    particleSizeContainer.style.display = 'flex';
    particleSizeContainer.style.flexDirection = 'column';
    particleSizeContainer.style.gap = '5px';
    particleSlidersContainer.appendChild(particleSizeContainer);

    const particleSizeLabel = document.createElement('label');
    particleSizeLabel.textContent = 'Particle Size: ' + particleSize.toFixed(2);
    particleSizeLabel.style.color = '#ffffff';
    particleSizeLabel.style.fontFamily = 'inherit';
    particleSizeLabel.style.fontSize = '13px';
    particleSizeContainer.appendChild(particleSizeLabel);

    const particleSizeSlider = document.createElement('input');
    particleSizeSlider.type = 'range';
    particleSizeSlider.min = '0.01';
    particleSizeSlider.max = '0.1';
    particleSizeSlider.step = '0.005';
    particleSizeSlider.value = particleSize.toString();
    particleSizeSlider.style.width = '110px';
    particleSizeSlider.style.cursor = 'pointer';
    particleSizeSlider.oninput = (event) => {
        const newSize = parseFloat(event.target.value);
        particleSizeLabel.textContent = 'Particle Size: ' + newSize.toFixed(2);
        particleSize = newSize;
        particleMaterial.uniforms.particleSize.value = newSize;
    };
    particleSizeContainer.appendChild(particleSizeSlider);

    // Particle Count Slider
    const particleCountContainer = document.createElement('div');
    particleCountContainer.style.display = 'flex';
    particleCountContainer.style.flexDirection = 'column';
    particleCountContainer.style.gap = '5px';
    particleSlidersContainer.appendChild(particleCountContainer);

    const particleCountLabel = document.createElement('label');
    particleCountLabel.textContent = 'Particle Count: ' + numParticles;
    particleCountLabel.style.color = '#ffffff';
    particleCountLabel.style.fontFamily = 'inherit';
    particleCountLabel.style.fontSize = '13px';
    particleCountContainer.appendChild(particleCountLabel);

    const particleCountSlider = document.createElement('input');
    particleCountSlider.type = 'range';
    particleCountSlider.min = '100';
    particleCountSlider.max = '10000';
    particleCountSlider.step = '100';
    particleCountSlider.value = numParticles.toString();
    particleCountSlider.style.width = '110px';
    particleCountSlider.style.cursor = 'pointer';
    particleCountSlider.oninput = (event) => {
        const newCount = parseInt(event.target.value, 10);
        particleCountLabel.textContent = 'Particle Count: ' + newCount;
        if (newCount !== numParticles) {
            updateParticles(newCount, particleSize);
        }
    };
    particleCountContainer.appendChild(particleCountSlider);


    window.addEventListener('resize', onWindowResize);
}

function changeShape(index) {
    // Get current animated positions from the GPU-rendered state to use as source
    // This is a bit tricky with GPU-side interpolation. For simplicity, we'll assume
    // the current `targetPositionsArray` is a good approximation of where particles are.
    // A more accurate approach might involve reading back from a render target or
    // having a 'currentPosition' attribute that is updated on the CPU after transition.
    // For now, we'll use the current target as the source for the next transition.
    // This means if a transition is interrupted, it will start from the *intended* end of the previous one.
    sourcePositionsArray.set(targetPositionsArray); // Copy current target to be the new source

    // Set the target to the selected shape
    currentShapeIndex = index;
    const newTargetPositions = allShapeTargetPositions[currentShapeIndex];

    // Update the targetPosition attribute
    targetPositionsArray.set(newTargetPositions);
    particleGeometry.attributes.targetPosition.needsUpdate = true;
    particleGeometry.attributes.startPosition.needsUpdate = true; // Also update start to current target

    // Reset transition
    transitionProgress = 0;
    isTransitioning = true;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    
    if (isTransitioning) {
        transitionProgress += delta / transitionDuration;
        if (transitionProgress >= 1) {
            transitionProgress = 1;
            isTransitioning = false; // Transition complete
            // Once transition is complete, set source positions to target positions for next transition
            sourcePositionsArray.set(targetPositionsArray);
            particleGeometry.attributes.startPosition.needsUpdate = true;
        }
    }

    // Update the uniform for transition progress
    particleMaterial.uniforms.transitionProgress.value = transitionProgress;

    // Rotate the entire scene
    scene.rotation.x += 0.001;
    scene.rotation.y += 0.001;

    renderer.render(scene, camera);
}

init();
animate();