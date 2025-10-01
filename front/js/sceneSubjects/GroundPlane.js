/* 

Aqui está a construção do plano branco presente na face inferior da visualização, dinâmica conforme o número de frames/resíduos da simulação

*/

import * as THREE from 'three';

class GroundPlane {
    constructor(scene) {
        const geometry = new THREE.BufferGeometry();

        const material = new THREE.MeshBasicMaterial({ color: 0xf0f0f0, side: THREE.DoubleSide });
        
        this.mesh = new THREE.Mesh(geometry, material);

        this.mesh.visible = false; 

        scene.add(this.mesh);
    }


    updateDimensions(numResidues, numSlices) {
        const plane_length = 0.09 * numResidues;
        const plane_depth = 0.099 * numSlices;
        const adjust = 2;

        const vertices = new Float32Array([
            (1.0 * plane_length) + adjust, 0.0, 0.0,
            (1.0 * plane_length) + adjust, 0.0, (-1.0 * plane_depth) - adjust,
            0.0,                           0.0, (-1.0 * plane_depth) - adjust,

            0.0,                           0.0, 0.0,
            (1.0 * plane_length) + adjust, 0.0, 0.0,
            0.0,                           0.0, (-1.0 * plane_depth) - adjust,
        ]);

        this.mesh.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        this.mesh.geometry.computeVertexNormals();

        this.mesh.visible = true;
    }
    
    hide() {
        this.mesh.visible = false;
    }

    update(time) {
        console.log('GroundPlane updated')
    }

    dispose(scene) {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            scene.remove(this.mesh);
        }
    }
}

export default GroundPlane;