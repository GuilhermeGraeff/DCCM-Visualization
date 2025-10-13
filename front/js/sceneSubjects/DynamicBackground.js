/* 

Aqui está a construção do plano branco presente nas faces da visualização, dinâmica conforme o número de frames/resíduos da simulação

*/

import * as THREE from 'three';

class DynamicBackground {
    constructor(scene) {
        this.top = this.createPlane(new THREE.Color(0xe0e0e0)); // Top plane (floor)
        this.left = this.createPlane(new THREE.Color(0xe0e0e0)); // Left wall
        this.right = this.createPlane(new THREE.Color(0xe0e0e0)); // Right wall
        this.back = this.createPlane(new THREE.Color(0xe0e0e0)); // Back wall
        this.bottom = this.createPlane(new THREE.Color(0xe0e0e0)); // bottom wall

        // --- Correct Initial Orientations ---
        // Top plane (floor) is rotated to be flat on the XZ plane.
        

        // Side walls are rotated 90 degrees around the Y axis to stand up.
        this.left.rotation.y = Math.PI / 2;
        this.right.rotation.y = -Math.PI / 2;
        this.top.rotation.x = -Math.PI / 2;

        this.bottom.rotation.x = -Math.PI / 2;

        // The back wall needs no rotation.

        scene.add(this.top, this.left, this.right, this.back, this.bottom);
    }

    createPlane(planeColor){
        const geometry = new THREE.PlaneGeometry(1, 1); // Start with a 1x1 plane


        const uniforms = {
            centerColor: { value: new THREE.Color(0xffffff) },
            edgeColor: { value: new THREE.Color(0x888888) },
            fadeStart: { value: 0.995 },
            fadeEnd: { value:  0.995 }
        };
        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                uniform vec3 centerColor;
                uniform vec3 edgeColor;
                uniform float fadeStart;
                uniform float fadeEnd;

                void main() {
                    // Calcula a distância do pixel atual ao centro do plano (0.5, 0.5)
                    // Normalizamos para que o centro seja 0.0 e a borda seja 0.5
                    vec2 distToCenter = abs(vUv - vec2(0.5));
                    
                    // Pegamos a maior distância (horizontal ou vertical) para lidar com as bordas em todos os lados
                    float maxDist = max(distToCenter.x, distToCenter.y);
                    
                    // Normaliza maxDist de 0.0 (centro) a 0.5 (borda) para 0.0 a 1.0 para o smoothstep
                    float normalizedDist = maxDist * 2.0;

                    // Usa smoothstep para criar uma transição suave.
                    // fadeStart e fadeEnd são relativos à distância do centro (0.0 a 0.5).
                    // Convertemos para que 0.0 seja o centro e 1.0 seja a borda (multiplicando por 2)
                    // fadeFactor será 1.0 no centro, 0.0 nas bordas, e suavemente transacionará no meio.
                    float fadeFactor = 1.0 - smoothstep(fadeStart, fadeEnd, normalizedDist);

                    // Mistura as cores: se fadeFactor é 1.0, usa centerColor; se 0.0, usa edgeColor.
                    gl_FragColor = vec4(mix(edgeColor, centerColor, fadeFactor), 1.0);
                }
            `,
            side: THREE.FrontSide
        });

        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.visible = false; // Start hidden until dimensions are set
        return mesh;
    }
    
    updateDimensions(numResidues, numSlices) {
        // These calculations appear to be from your original code.
        const plane_width = 0.096 * numResidues;
        const plane_depth = (0.0985 * numSlices) + 1.8;
        
        // Center the planes
        const centerX = plane_width / 2;
        const centerZ = -plane_depth / 2;
        const wallHeight = numResidues * 0.093;

        // --- Update Top (Floor) Plane ---
        this.top.scale.set(plane_width, plane_depth, 1);
        this.top.position.set(centerX, wallHeight, centerZ);
        this.top.visible = true;
        this.top.material.side = THREE.BackSide;

        
        // --- Update Side Walls ---
        // Assume a fixed height for the walls, e.g., 20 units.

        // Left Wall
        this.left.scale.set(plane_depth, wallHeight, 1);
        this.left.position.set(0, wallHeight / 2, centerZ);
        this.left.visible = true;

        // Right Wall
        this.right.scale.set(plane_depth, wallHeight, 1);
        this.right.position.set(plane_width, wallHeight / 2, centerZ);
        this.right.visible = true;

        // Back Wall
        this.back.scale.set(plane_width, wallHeight, 1);
        this.back.position.set(centerX, wallHeight / 2, -plane_depth);
        this.back.visible = true;

        // Bottom Wall
        this.bottom.scale.set(plane_width, plane_depth, 1);
        this.bottom.position.set(centerX, 0, centerZ);
        this.bottom.visible = true;
    }
    
    hide() {
        this.top.visible = false;
        this.left.visible = false;
        this.right.visible = false;
        this.back.visible = false;
        this.bottom.visible = false;

    }

    show() {
        this.top.visible = true;
        this.left.visible = true;
        this.right.visible = true;
        this.back.visible = true;
        this.bottom.visible = true;
    }

    update(time) {
        console.log('DynamicBackground updated')
    }

    dispose(scene) {
        // Helper to dispose of a single mesh
        const disposeMesh = (mesh) => {
            if (mesh) {
                mesh.geometry.dispose();
                mesh.material.dispose();
                scene.remove(mesh);
            }
        };

        disposeMesh(this.top);
        disposeMesh(this.left);
        disposeMesh(this.right);
        disposeMesh(this.back);
        disposeMesh(this.bottom);
    }
}

export default DynamicBackground;