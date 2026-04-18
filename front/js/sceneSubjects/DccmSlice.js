/* 

Aqui está a construção de uma fatia de correlação da visualização, 
cada fatia é gerada separadamente, permitindo a navegação dos dados 
através do 'selected slice'

*/


import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import DccmFunctions from '../funcionalities/DccmFunctions'


class DccmSlice {
	constructor(scene, initialSettings, correlation_file_path, dynamicBackground, onDataLoadedCallback, onPerformanceMeasured, onPointsCountUpdated) {

        // Inicializa as propriedades necessárias para o funcionamento da classe
        this.dccmTools = new DccmFunctions();
        this.parentObject = new THREE.Object3D();
        this.slicePoints = []; 
        this.textMeshes = [];
        this.dccmData = null;
        this.isInitialized = false;
		this.dynamicBackground = dynamicBackground;
        this.onDataLoaded = onDataLoadedCallback;
        this.onPerformanceMeasured = onPerformanceMeasured;
        this.onPointsCountUpdated = onPointsCountUpdated;
        this.filePath = correlation_file_path;

        this._initialize(scene, initialSettings, correlation_file_path);
    }

    // Esta função carrega os dados, constrói os pontos e desenha o texto referente aos resíduos e também à fatia
	async _initialize(scene, settings, dataUrl) {
        try {

            const loadStart = performance.now();

            const dccmData = await this.dccmTools.loadBinaryDCCM(dataUrl);
			
            const loadEnd = performance.now();
            const loadTimeMs = loadEnd - loadStart;

            // Atualiza a dimensão da visualização conforme o número de fatias/resíudos
            if (this.onDataLoaded) {
                this.onDataLoaded(dccmData.numSlices);
            }

            if (this.dynamicBackground) {
                this.dynamicBackground.updateDimensions(dccmData.numAtoms, dccmData.numSlices);
            }

            this.dccmData = dccmData;
            const fontLoader = new FontLoader();

            const renderStart = performance.now();

            fontLoader.load('fonts/droid_serif_regular.typeface.json', (font) => {

                // Desenha os pontos e também escreve o texto(label) referente à fatia atual
                for (let i = 0; i < dccmData.numSlices; i++) {
                    const sliceMatrix = dccmData.getSliceAsMatrix(i);
                    const [geometry, material, pointData] = this.dccmTools.createParticleSlice(
                        sliceMatrix, 1, 0.05, (-1) - (i * 0.1), 0.09, 0.022, 
                        settings['modify negative threshold'], 
                        settings['modify positive threshold']
                    );
                    const points = new THREE.Points(geometry, material);

                    const textGeometry = new TextGeometry(`Slice ${i}`, {
                        depth: 0.00000001, size: 0.055, font: font
                    });
                    const textMaterial = new THREE.MeshBasicMaterial({ color: 0x303030 });
                    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
                    textMesh.position.set(
                        (dccmData.numAtoms * 0.09427) - 0.30,
                        0.001,
                        -0.97 - (i * 0.09 * 1.112)
                    );
                    textMesh.rotateX(-Math.PI / 2);

                    this.parentObject.add(points);
                    scene.add(textMesh);
                    
                    this.slicePoints.push({ points, sliceIndex: i, sliceMatrix, pointData });
                    this.textMeshes.push(textMesh);
                }

                // Escreve o texto(label) referente ao resíduo 
				for (let i = 0; i < dccmData.numAtoms; i++) {
                    const textGeometry = new TextGeometry(dccmData.residueNames[(dccmData.numAtoms-1) - i] + ' ' + (dccmData.numAtoms - i), {
                        depth: 0.00000001, size: 0.055, font: font
                    });
                    const textMaterial = new THREE.MeshBasicMaterial({ color: 0x303030 });
                    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
                    textMesh.position.set(
                        29.32 - (i * 0.09),
                        0.001, 
                        -0.87 
                    );
                    textMesh.rotateX(-Math.PI / 2);
                    textMesh.rotateZ(-Math.PI / 2);

                    scene.add(textMesh);
                    this.textMeshes.push(textMesh);
                }

                scene.add(this.parentObject);
                this.isInitialized = true;

                this.updateFromSettings(settings, true);

                const renderEnd = performance.now();
                const renderTimeMs = renderEnd - renderStart;

                if (this.onPerformanceMeasured) {
                    this.onPerformanceMeasured({
                        filename: dataUrl.split('/').pop(),
                        load_time_ms: dccmData.loadTimeMs.toFixed(2),
                        render_time_ms: renderTimeMs.toFixed(2),
                    });
                }
            });
        } catch (error) {
            console.error("Failed to load or process DCCM data:", error);
        }
    }

    // Após inicializado, atualiza os dados conforme a simulação selecionada, assim como atualiza a visualização conforme as configurações selecionadas
	updateFromSettings(settings, isFirstRender = false) {
        if (!this.isInitialized) return;

        const updateStart = performance.now();

        if (this.dynamicBackground) {
			this.dynamicBackground.updateDimensions(this.dccmData.numAtoms, this.dccmData.numSlices);
		}
        const negative_treshold = settings['modify negative threshold'];
        const positive_treshold = settings['modify positive threshold'];
        const selected_slice = settings['selected slice'];
        const display_unselected_layers = settings['display unselected layers'];

        let totalVisiblePoints = 0;

        this.slicePoints.forEach(slice => {
            const { points, sliceIndex, sliceMatrix } = slice;

            // Visualiza apenas a fatia selecionada, se == -1 então visualiza todas as fatias
            const isSelected = sliceIndex === selected_slice;
            if (selected_slice !== -1 && !isSelected && !display_unselected_layers) {
                points.visible = false;
                this.textMeshes[sliceIndex].visible = false;
            } else {
                points.visible = true;
                this.textMeshes[sliceIndex].visible = true;
            }

            // Diminui o tamanho dos pontos ds fatias não selecionadas
            points.material.size = (selected_slice === -1 || isSelected) ? 0.16 : 0.075;

            const positions = [];
            const colors = [];
            const newPointData = []; 
            const step_length = 0.09;
            const pos_x = 1, pos_y = 0.05, pos_z = (-1) - (sliceIndex * 0.1);

            // Filtra os pontos(correlações e anti-correlações) pelos limites definidos na configuração
            for (let i = 0; i < sliceMatrix.length; i++) {
                for (let j = 0; j < sliceMatrix[i].length; j++) {
                    const value = sliceMatrix[i][j];
                    if (value > -negative_treshold && value < positive_treshold) {
                        continue;
                    }
                    positions.push(pos_x + (i * step_length), pos_y + (j * step_length), pos_z);
                    const color_gradient = this.dccmTools.gradientColorForCorrelationForParticles(value);
                    colors.push(color_gradient[0] / 255.0, color_gradient[1] / 255.0, color_gradient[2] / 255.0);
                    newPointData.push({
                        residueI: i,
                        residueJ: j,
                        value: value.toFixed(4)
                    });
                }
            }
            
            slice.pointData = newPointData;
            
            if (slice.points.visible) {
                totalVisiblePoints += slice.pointData.length;
            }

            points.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            points.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            points.geometry.attributes.position.needsUpdate = true;
            points.geometry.attributes.color.needsUpdate = true;
            points.geometry.computeBoundingSphere();
        });

        const updateEnd = performance.now();
        const updateTimeMs = updateEnd - updateStart;

        if (this.onPerformanceMeasured && !isFirstRender) {
            this.onPerformanceMeasured({
                filename: this.filePath ? this.filePath.split('/').pop() : "unknown",
                load_time_ms: this.dccmData.loadTimeMs ? this.dccmData.loadTimeMs.toFixed(2) : "0.00",
                render_time_ms: updateTimeMs.toFixed(2),
            });
        }

        if (this.onPointsCountUpdated) {
            this.onPointsCountUpdated(totalVisiblePoints);
        }
    }

    // Descarta os pontos
	dispose(scene) {
        if (!this.isInitialized) return;
        
        this.slicePoints.forEach(slice => {
            slice.points.geometry.dispose();
            slice.points.material.dispose();
        });
        
        this.textMeshes.forEach(mesh => {
            mesh.geometry.dispose();
            mesh.material.dispose();
            scene.remove(mesh);
        });

        scene.remove(this.parentObject);
        this.slicePoints = [];
        this.textMeshes = [];
        this.isInitialized = false;
    }

	update(time) {
		const scale = Math.sin(time) + 2;
	};
}

export default DccmSlice