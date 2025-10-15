import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import DccmFunctions from '../funcionalities/DccmFunctions'


class DccmSlice {
	constructor(scene, initialSettings, correlation_file_path, dynamicBackground, onDataLoadedCallback) {

        this.dccmTools = new DccmFunctions();
        this.parentObject = new THREE.Object3D();
        this.slicePoints = []; 
        this.textMeshes = [];
        this.dccmData = null;
        this.isInitialized = false;
		this.dynamicBackground = dynamicBackground;

        this.onDataLoaded = onDataLoadedCallback;

        this._initialize(scene, initialSettings, correlation_file_path);
    }

	async _initialize(scene, settings, dataUrl) {
        try {
            const dccmData = await this.dccmTools.loadBinaryDCCM(dataUrl);
			
            if (this.onDataLoaded) {
                this.onDataLoaded(dccmData.numSlices);
            }

            if (this.dynamicBackground) {
                this.dynamicBackground.updateDimensions(dccmData.numAtoms, dccmData.numSlices);
            }

            this.dccmData = dccmData;
            const fontLoader = new FontLoader();
            fontLoader.load('/fonts/droid_serif_regular.typeface.json', (font) => {

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

				for (let i = 0; i < dccmData.numAtoms; i++) {
                    const textGeometry = new TextGeometry(dccmData.residueNames[(dccmData.numAtoms-1) - i], {
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

                this.updateFromSettings(settings);
            });
        } catch (error) {
            console.error("Failed to load or process DCCM data:", error);
        }
    }

	updateFromSettings(settings) {
        if (!this.isInitialized) return;
        if (this.dynamicBackground) {
			this.dynamicBackground.updateDimensions(this.dccmData.numAtoms, this.dccmData.numSlices);
		}
        const negative_treshold = settings['modify negative threshold'];
        const positive_treshold = settings['modify positive threshold'];
        const selected_slice = settings['selected slice'];
        const display_unselected_layers = settings['display unselected layers'];

        this.slicePoints.forEach(slice => {
            const { points, sliceIndex, sliceMatrix } = slice;

    
            const isSelected = sliceIndex === selected_slice;
            if (selected_slice !== -1 && !isSelected && !display_unselected_layers) {
                points.visible = false;
                this.textMeshes[sliceIndex].visible = false;
            } else {
                points.visible = true;
                this.textMeshes[sliceIndex].visible = true;
            }

            points.material.size = (selected_slice === -1 || isSelected) ? 0.16 : 0.022;

            const positions = [];
            const colors = [];
            const newPointData = []; 
            const step_length = 0.09;
            const pos_x = 1, pos_y = 0.05, pos_z = (-1) - (sliceIndex * 0.1);

            for (let residue = 0; residue < sliceMatrix.length; residue++) {
                for (let j = 0; j < sliceMatrix[residue].length; j++) {
                    const value = sliceMatrix[residue][j];
                    if (value > -negative_treshold && value < positive_treshold) {
                        continue;
                    }
                    positions.push(pos_x + (residue * step_length), pos_y + (j * step_length), pos_z);
                    const color_gradient = this.dccmTools.gradientColorForCorrelationForParticles(value);
                    colors.push(color_gradient[0] / 255.0, color_gradient[1] / 255.0, color_gradient[2] / 255.0);
                    newPointData.push({
                        residueI: residue,
                        residueJ: j,
                        value: value.toFixed(4)
                    });
                }
            }
            
            slice.pointData = newPointData;

            points.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            points.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            points.geometry.attributes.position.needsUpdate = true;
            points.geometry.attributes.color.needsUpdate = true;
            points.geometry.computeBoundingSphere();
        });
    }

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