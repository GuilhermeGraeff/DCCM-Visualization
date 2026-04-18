/* 

Aqui está a construção do plano branco presente nas faces da visualização, dinâmica conforme o 
número de frames/resíduos da simulação

*/

import * as THREE from 'three';

class Hud{
    constructor(scene, camera, dccm_data) {
        let itenzinhos = []
        this.background = this.createBackground(camera); 
        this.itens = this.createItens(camera, dccm_data);
        camera.add(this.background);
    }

    createBackground(camera){
        const geometry = new THREE.PlaneGeometry(window.innerWidth/430, window.innerHeight/800);
        // const geometry = new THREE.PlaneGeometry(0.2, 0.2);
    
    
        // 2. Create material (color, options)
        const material = new THREE.MeshBasicMaterial({ 
        color: 0xffff00, 
        side: THREE.DoubleSide, // Makes the plane visible from both sides
        depthTest: false,  // NÃO testa profundidade (fica sempre na frente)
        depthWrite: false
        });
    
    
        const plane = new THREE.Mesh(geometry, material);
    
        plane.position.set(0, -0.5, -2);
        plane.renderOrder = 998;
  
        camera.add(plane);
  
        plane.visible = true;

        return plane;
    }

    // createItens(camera, dccmData) {
    //     if (!dccmData) return [];
        
    //     let itenzinhos = [];
    //     const numDisplay = Math.min(dccmData.numSlices, 4); // Exibir as primeiras 4 fatias

    //     for (let i = 0; i < numDisplay; i++) {
    //         const matrix = dccmData.getSliceAsMatrix(i);
            
    //         // Criar textura do heatmap para esta fatia
    //         const size = dccmData.numAtoms;
    //         const data = new Uint8Array(size * size * 3);
            
    //         for (let y = 0; y < size; y++) {
    //             for (let x = 0; x < size; x++) {
    //                 const val = matrix[y][x];
    //                 const r = (y * size + x) * 3;
    //                 // Mapeamento: Positivo = Vermelho, Negativo = Azul
    //                 if (val > 0) {
    //                     data[r] = 255; data[r+1] = 255*(1-val); data[r+2] = 255*(1-val);
    //                 } else {
    //                     const v = Math.abs(val);
    //                     data[r] = 255*(1-v); data[r+1] = 255*(1-v); data[r+2] = 255;
    //                 }
    //             }
    //         }

    //         const texture = new THREE.DataTexture(data, size, size, THREE.RGBFormat);
    //         texture.needsUpdate = true;

    //         const geometry = new THREE.PlaneGeometry(0.4, 0.4);
    //         const material = new THREE.MeshBasicMaterial({ 
    //             map: texture, 
    //             depthTest: false,
    //             transparent: true 
    //         });

    //         const plane = new THREE.Mesh(geometry, material);
            
    //         // Posicionamento Lado a Lado
    //         // Z precisa ser um tiquinho menor que o fundo (-1.99) para não sumir
    //         plane.position.set((i * 0.1), -0.4, -1.99); 
    //         plane.renderOrder = 1000;

    //         console.log(plane.position)

    //         camera.add(plane);
    //         itenzinhos.push(plane);
    //     }
    //     return itenzinhos;
    // }

    // createItens(camera, dccmData) {
    //     const itenzinhos = [];
    //     const numSlices = dccmData.numSlices;
        
    //     // Define um limite máximo de fatias para exibir no HUD para não poluir
    //     const maxDisplay = Math.min(numSlices, 4); 

    //     for (let i = 0; i < maxDisplay; i++) {
    //         const matrix = dccmData.getSliceAsMatrix(i);
    //         const texture = this.createHeatmapTexture(matrix);

    //         const geometry = new THREE.PlaneGeometry(0.5, 0.5);
    //         const material = new THREE.MeshBasicMaterial({ 
    //             map: texture,
    //             side: THREE.DoubleSide,
    //             depthTest: false
    //         });

    //         const plane = new THREE.Mesh(geometry, material);
            
    //         // Lado a lado: posicionamento horizontal (-1, -0.33, 0.33, 1)
    //         plane.position.set((i * 0.6) - 0.9, -0.3, -2);
    //         plane.renderOrder = 1000;

    //         camera.add(plane);
    //         itenzinhos.push(plane);
    //     }
    //     return itenzinhos;
    // }
    createItens(camera, itenzinhos){
        let count = 0;
        for (let item in [0,1,2,3]){
            const geometry = new THREE.PlaneGeometry((window.innerWidth/2000), (window.innerHeight/1800));
            // const geometry = new THREE.PlaneGeometry(0.2, 0.2);
    
    
            // 2. Create material (color, options)
            const material = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, 
            side: THREE.DoubleSide, // Makes the plane visible from both sides
            depthTest: false,  // NÃO testa profundidade (fica sempre na frente)
            depthWrite: false
            });
        
        
            const plane = new THREE.Mesh(geometry, material);
        
            plane.position.set((count*0.667) -1, -0.3, -2);
            plane.renderOrder = 999;
    
            camera.add(plane);
            itenzinhos.push(plane);

            plane.visible = true;
            count = count + 1;
        }
        
        
        return itenzinhos;
    }
    
    createHeatmapTexture(matrix) {
        const size = matrix.length;
        const data = new Uint8Array(size * size * 3); // RGB

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const val = matrix[i][j]; // Valor entre -1 e 1
                const stride = (i * size + j) * 3;

                // Mapeamento simples: Negativo (Azul), Zero (Branco), Positivo (Vermelho)
                if (val > 0) {
                    data[stride] = 255;                   // R
                    data[stride + 1] = 255 * (1 - val);   // G
                    data[stride + 2] = 255 * (1 - val);   // B
                } else {
                    const absVal = Math.abs(val);
                    data[stride] = 255 * (1 - absVal);    // R
                    data[stride + 1] = 255 * (1 - absVal);// G
                    data[stride + 2] = 255;               // B
                }
            }
        }

        const texture = new THREE.DataTexture(data, size, size, THREE.RGBFormat);
        texture.needsUpdate = true;
        return texture;
    }

    // updateDimensions(numResidues, numSlices) {
    //     // Esta função atualiza as dimensões do plano, possui alguns valores brutos que são responsáveis por ajustes de tamanho
    //     const plane_width = 0.096 * numResidues;
    //     const plane_depth = (0.0985 * numSlices) + 1.8;
        
    //     // Centraliza os planos
    //     const centerX = plane_width / 2;
    //     const centerZ = -plane_depth / 2;
    //     const wallHeight = numResidues * 0.093;

    //     // Top Wall
    //     this.top.scale.set(plane_width, plane_depth, 1);
    //     this.top.position.set(centerX, wallHeight, centerZ);
    //     this.top.visible = true;
    //     this.top.material.side = THREE.BackSide;

    //     // Left Wall
    //     this.left.scale.set(plane_depth, wallHeight, 1);
    //     this.left.position.set(0, wallHeight / 2, centerZ);
    //     this.left.visible = true;

    //     // Right Wall
    //     this.right.scale.set(plane_depth, wallHeight, 1);
    //     this.right.position.set(plane_width, wallHeight / 2, centerZ);
    //     this.right.visible = true;

    //     // Back Wall
    //     this.back.scale.set(plane_width, wallHeight, 1);
    //     this.back.position.set(centerX, wallHeight / 2, -plane_depth);
    //     this.back.visible = true;

    //     // Bottom Wall
    //     this.bottom.scale.set(plane_width, plane_depth, 1);
    //     this.bottom.position.set(centerX, 0, centerZ);
    //     this.bottom.visible = true;
    // }

    
    // hide() {
    //     this.top.visible = false;
    //     this.left.visible = false;
    //     this.right.visible = false;
    //     this.back.visible = false;
    //     this.bottom.visible = false;

    // }

    // show() {
    //     this.top.visible = true;
    //     this.left.visible = true;
    //     this.right.visible = true;
    //     this.back.visible = true;
    //     this.bottom.visible = true;
    // }

    // update(time) {
    //     console.log('DynamicBackground updated');
    // }

    // dispose(scene) {
    //     const disposeMesh = (mesh) => {
    //         if (mesh) {
    //             mesh.geometry.dispose();
    //             mesh.material.dispose();
    //             scene.remove(mesh);
    //         }
    //     };

    //     disposeMesh(this.top);
    //     disposeMesh(this.left);
    //     disposeMesh(this.right);
    //     disposeMesh(this.back);
    //     disposeMesh(this.bottom);
    // }
}

export default Hud;