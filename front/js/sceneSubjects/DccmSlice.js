import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import DccmFunctions from '../funcionalities/DccmFunctions' // Mudar Aquiiiiiii


class DccmSlice {
	constructor(scene, with_ligand, neg_tre, pos_tre, selected_slice, display_unselected_layers, correlation_file_path) {

		// for (let i = 0; i < dccm_data[0].length; i++) {
		//   fontLoader.load(
		// 	'node_modules/three/examples/fonts/droid/droid_serif_regular.typeface.json',
		// 	(droidFont) => {
		// 	  const textGeometry = new TextGeometry(`Resíduo ${i}`,{
		// 		depth: 0.001,
		// 		size: 0.055,
		// 		font: droidFont
		// 	  })
		// 	  const textMaterial = new THREE.MeshMatcapMaterial({ color: 0x303030})
		// 	  const textMesh = new THREE.Mesh(textGeometry, textMaterial)
		// 	  textMesh.position.x = 0.98 + (i * this.step_length * 1.0001) // -0.97 and 1.11 arbitrary
		// 	  textMesh.position.y = 0
		// 	  textMesh.position.z = -0.97
		
		// 	  textMesh.rotateX(-Math.PI / 2)
		// 	  textMesh.rotateZ(-Math.PI / 2)
		// 	  scene.add(textMesh)
		// 	}
		//   )
		// }
		// for (let i = 0; i < dccm_data[0].length; i++) {
		//   fontLoader.load(
		// 	'node_modules/three/examples/fonts/droid/droid_serif_regular.typeface.json',
		// 	(droidFont) => {
		// 	  const textGeometry = new TextGeometry(`Resíduo ${dccm_data[0].length - i -1}`,{
		// 		depth: 0.001,
		// 		size: 0.055,
		// 		font: droidFont
		// 	  })
		// 	  const textMaterial = new THREE.MeshMatcapMaterial({ color: 0x303030})
		// 	  const textMesh = new THREE.Mesh(textGeometry, textMaterial)
		// 	  textMesh.position.x = 0.5  // -0.97 and 1.11 arbitrary
		// 	  textMesh.position.y = 0.025 + (i * this.step_length * 1.0001)
		// 	  textMesh.position.z = -1
		
		// 	  textMesh.rotateX(0*Math.PI / 2)
		// 	  textMesh.rotateZ(0*Math.PI / 2)
		// 	  scene.add(textMesh)
		// 	}
		//   )
		// }
		const fontLoader = new FontLoader();
		const dccmTools = new DccmFunctions();
		// 'wt' 'wt_lig' 'asp84glu' 'asp84glu_lig' 'asp294his' 'asp294his_lig'
		const dataUrl = correlation_file_path;
		
		dccmTools.loadBinaryDCCM(dataUrl)
					.then(dccmData => {
						// console.log("Dados prontos para uso!");
						// USO OTIMIZADO: Acessar um valor específico
						// Pega o valor da fatia 0, entre os átomos 10 e 20
						const value = dccmData.getDCCMValue(0, 10, 20);
						// console.log("Valor específico:", value);

						// USO PARA COMPATIBILIDADE:
						// Se precisar passar uma matriz 2D completa para sua função existente,
						// use o método getSliceAsMatrix.
						
						let fullMatrix = []
						for(let i = 0; i < dccmData.numSlices; i++)
							fullMatrix.push(dccmData.getSliceAsMatrix(i));
						
						this.parentObject = new THREE.Object3D()
						this.number_of_slices = dccmData.numSlices;
						this.number_of_residues = dccmData.numAtoms;
						this.step_length = 0.09;
						this.particle_size = 0.022;
						this.geometry = null;
						this.material = null;

						for (let i = 0; i < dccmData.numSlices; i++) { //     v-padding-v
							if (selected_slice == -1){
								this.particle_size = 0.16
							} else {
								if(i == selected_slice){
									this.particle_size = 0.16
								} else {
									if(!display_unselected_layers){
										continue
									}
								}
							}
				
							// console.log(fullMatrix)
							var dccm_points = dccmTools.createParticleSlice(fullMatrix[i], 1, 0.05, (-1) - (i * 0.1), this.step_length, this.particle_size, neg_tre, pos_tre);
							this.geometry = dccm_points[0];
							this.material = dccm_points[1];
							var points = new THREE.Points(this.geometry, this.material);
							this.parentObject.add(points)
							this.particle_size = 0.022;
							
							// const myText = new Text()
							// scene.add(myText)
				
							// // Set properties to configure:
							// myText.text = 'Hello world!'
							// myText.fontSize = 0.055
							// // myText.position.x = (this.number_of_residues * 0.1) - 0.30;
							// // myText.position.y = 0;
							// myText.position.z = -0.97 - (i * this.step_length * 1.112);
							// myText.color = 0x9966FF
				
							// // Update the rendering:
							// myText.sync()
					
				
							fontLoader.load(
								'node_modules/three/examples/fonts/droid/droid_serif_regular.typeface.json',
								(droidFont) => {
									const textGeometry = new TextGeometry(`Slice ${i}`, {
										depth: 0.001,
										size: 0.055,
										font: droidFont
									});
									const textMaterial = new THREE.MeshMatcapMaterial({ color: 0x303030 });
									const textMesh = new THREE.Mesh(textGeometry, textMaterial);
									textMesh.position.x = (this.number_of_residues * 0.09427) - 0.30;
									textMesh.position.y = 0;
									textMesh.position.z = -0.97 - (i * this.step_length * 1.112); // -0.97 and 1.11 arbitrary
									textMesh.rotateX(-Math.PI / 2);
									scene.add(textMesh);
								}
							);
							scene.add(this.parentObject);
						}
					})
					.catch(error => {
						console.error("Falha ao carregar ou processar os dados DCCM:", error);
					});
		this.update = function (time) {
			const scale = Math.sin(time) + 2;
			// mesh.scale.set(scale, scale, scale);
		};
	}
	disposePoints(obj) {
		if(obj.children.length > 0){
			for (let x = obj.children.length - 1; x >= 0; x--) {
				this.disposePoints(obj.children[x])
			}
		}
		if(obj.isMesh){
			obj.geometry.dispose()
			obj.material.dispose()
		}
		if(obj.parent){
			obj.parent.remove(obj)
		}
		
	}
}

export default DccmSlice