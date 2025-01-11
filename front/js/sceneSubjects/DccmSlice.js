import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import DccmFunctions from '../funcionalities/DccmFunctions'
import dccm_data_without_ligand from '../../data/msc_output_without_ligand.js'
import dccm_data_with_ligand from '../../data/msc_output_with_ligand.js'
import dccm_data_other from '../../data/msc_output_other.js'



class DccmSlice {
	constructor(scene, with_ligand, neg_tre, pos_tre, selected_slice, display_unselected_layers) {

		// , dccm <- este será o parâmetro
		var dccm_data = null

		if(with_ligand){
			dccm_data = dccm_data_with_ligand
		} else {
			dccm_data = dccm_data_without_ligand
		}

		// dccm_data = dccm_data_other

		this.parentObject = new THREE.Object3D()
		this.number_of_slices = dccm_data.length;
		this.number_of_residues = dccm_data[0].length;
		this.step_length = 0.09;
		this.particle_size = 0.022;
		this.geometry = null;
		this.material = null;

		const fontLoader = new FontLoader();
		const dccm = new DccmFunctions();

		for (let i = 0; i < dccm_data.length; i++) { //     v-padding-v
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


			var dccm_points = dccm.createParticleSlice(dccm_data[i], 1, 0.05, (-1) - (i * 0.1), this.step_length, this.particle_size, neg_tre, pos_tre);
			this.geometry = dccm_points[0];
			this.material = dccm_points[1];
			var points = new THREE.Points(this.geometry, this.material);
			this.parentObject.add(points)
			this.particle_size = 0.022;
			
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
					textMesh.position.x = (this.number_of_residues * 0.1) - 0.30;
					textMesh.position.y = 0;
					textMesh.position.z = -0.97 - (i * this.step_length * 1.112); // -0.97 and 1.11 arbitrary
					textMesh.rotateX(-Math.PI / 2);
					scene.add(textMesh);
				}
			);

			

			scene.add(this.parentObject);
		}

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