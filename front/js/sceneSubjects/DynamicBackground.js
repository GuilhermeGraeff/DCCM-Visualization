/* 

Aqui está a construção do plano branco presente nas faces da visualização, dinâmica conforme o 
número de frames/resíduos da simulação

*/

import * as THREE from 'three';

class DynamicBackground {
    constructor(scene) {
        this.top = this.createPlane(); 
        this.left = this.createPlane();
        this.right = this.createPlane();
        this.back = this.createPlane();
        this.bottom = this.createPlane();

        // Corrige o ângulo de cada plano que necessita de correção
        this.left.rotation.y = Math.PI / 2;
        this.right.rotation.y = -Math.PI / 2;
        this.top.rotation.x = -Math.PI / 2;
        this.bottom.rotation.x = -Math.PI / 2;


        scene.add(this.top, this.left, this.right, this.back, this.bottom);
    }

    createPlane(){
        const geometry = new THREE.PlaneGeometry(1, 1); // Start with a 1x1 plane

        const uniforms = {
            centerColor: { value: new THREE.Color(0xffffff) },
            edgeColor: { value: new THREE.Color(0x888888) },
            fadeStart: { value: 0.995 },
            fadeEnd: { value:  0.995 }
        };
        
        // Shader responsável pela criação das bordas nos planos
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
                    
                    // Maior distância do centro, lidar com as bordas em todos os lados
                    float maxDist = max(distToCenter.x, distToCenter.y);
                    
                    // Normaliza maxDist de 0.0 (centro) a 0.5 (borda) para 0.0 a 1.0
                    float normalizedDist = maxDist * 2.0;

                    // Reliza uma transição suave das cores selecionadas
                    float fadeFactor = 1.0 - smoothstep(fadeStart, fadeEnd, normalizedDist);

                    // Mistura as cores: se fadeFactor é 1.0, usa centerColor; se 0.0, usa edgeColor.
                    gl_FragColor = vec4(mix(edgeColor, centerColor, fadeFactor), 1.0);
                }
            `,
            side: THREE.FrontSide
        });

        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.visible = false;
        return mesh;
    }
    
    updateDimensions(numResidues, numSlices) {
        // Esta função atualiza as dimensões do plano, possui alguns valores brutos que são responsáveis por ajustes de tamanho
        const plane_width = 0.096 * numResidues;
        const plane_depth = (0.0985 * numSlices) + 1.8;
        
        // Centraliza os planos
        const centerX = plane_width / 2;
        const centerZ = -plane_depth / 2;
        const wallHeight = numResidues * 0.093;

        // Top Wall
        this.top.scale.set(plane_width, plane_depth, 1);
        this.top.position.set(centerX, wallHeight, centerZ);
        this.top.visible = true;
        this.top.material.side = THREE.BackSide;

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
        console.log('DynamicBackground updated');
    }

    dispose(scene) {
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