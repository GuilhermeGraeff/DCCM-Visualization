import * as THREE from 'three'


function GroundPlane(scene) {


    // , plane_length, plane_depth
    var number_of_residues = 300
    var number_of_slices = 18
    var step_length = 0.09
    var plane_length = step_length * number_of_residues
    var plane_depth = step_length * number_of_slices

    const plane_geometry = new THREE.BufferGeometry();

    var adjust = 2 // default = 2, somme padding
    const plane_vertices = new Float32Array( [
        (1.0 * plane_length) + adjust, 0.0,    0.0,
        (1.0 * plane_length) + adjust, 0.0,  (-1.0 * plane_depth) - adjust,
        0.0,                           0.0,  (-1.0 * plane_depth) - adjust,

        0.0,                           0.0,    0.0,
        (1.0 * plane_length) + adjust, 0.0,    0.0,
        0.0,                           0.0,  (-1.0 * plane_depth) - adjust,
    ] );

    // itemSize = 3 because there are 3 values (components) per vertex
    plane_geometry.setAttribute( 'position', new THREE.BufferAttribute( plane_vertices, 3 ) );
    const material = new THREE.MeshBasicMaterial( { color: 0xf0f0f0 } );
    const mesh = new THREE.Mesh( plane_geometry, material );

    scene.add(mesh)
	
	this.update = function(time) {
		const scale = Math.sin(time)+2;

		// mesh.scale.set(scale, scale, scale);
	}
}

export default GroundPlane