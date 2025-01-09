import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import DccmFunctions from '../funcionalities/DccmFunctions'
import dccm_data from '../../data/msc_output_art.js'

function DccmSlice(scene) {

	// , dccm <- este será o parâmetro
	var number_of_slices = dccm_data.length
	var number_of_residues = dccm_data[0].length
	var step_length = 0.09
	var particle_size = 0.11


	const fontLoader = new FontLoader()
	const dccm = new DccmFunctions()

	for (let i = 0; i < dccm_data.length; i++) {   //     v-padding-v

		// if (i == 3){
		//   particle_size = 0.11
		// }
		var dccm_points = dccm.createParticleSlice(dccm_data[i], 1, 0.05, (-1) - (i*0.1), step_length, particle_size )
		// particle_size = 0.022
		fontLoader.load(
			'node_modules/three/examples/fonts/droid/droid_serif_regular.typeface.json',
			(droidFont) => {
			const textGeometry = new TextGeometry(`Slice ${i}`,{
				depth: 0.001,
				size: 0.055,
				font: droidFont
			})
			const textMaterial = new THREE.MeshMatcapMaterial({ color: 0x303030})
			const textMesh = new THREE.Mesh(textGeometry, textMaterial)
			textMesh.position.x = (number_of_residues * 0.1) - 0.30
			textMesh.position.y = 0
			textMesh.position.z = -0.97 - (i * step_length * 1.112) // -0.97 and 1.11 arbitrary
			textMesh.rotateX(-Math.PI / 2)
			scene.add(textMesh)
			}
		)

		scene.add(dccm_points)
	}

	this.update = function(time) {
		const scale = Math.sin(time)+2;

		// mesh.scale.set(scale, scale, scale);
	}
}

export default DccmSlice