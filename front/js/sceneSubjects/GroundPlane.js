import * as THREE from 'three'


function GroundPlane(scene, number_of_residues, number_of_slices) {


    var step_length = 0.09
    var plane_length = step_length * number_of_residues
    var plane_depth = step_length * number_of_slices

    const plane_geometry = new THREE.BufferGeometry();

    var adjust = 2
    const plane_vertices = new Float32Array( [
        (1.0 * plane_length) + adjust, 0.0,    0.0,
        (1.0 * plane_length) + adjust, 0.0,  (-1.0 * plane_depth) - adjust,
        0.0,                           0.0,  (-1.0 * plane_depth) - adjust,

        0.0,                           0.0,    0.0,
        (1.0 * plane_length) + adjust, 0.0,    0.0,
        0.0,                           0.0,  (-1.0 * plane_depth) - adjust,
    ] );

    plane_geometry.setAttribute( 'position', new THREE.BufferAttribute( plane_vertices, 3 ) );
    const material = new THREE.MeshBasicMaterial( { color: 0xf0f0f0 } );
    const mesh = new THREE.Mesh( plane_geometry, material );

    scene.add(mesh)
	
	this.update = function(time) {
		const scale = Math.sin(time)+2;
	}
}

export default GroundPlane