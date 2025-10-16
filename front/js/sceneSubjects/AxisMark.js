/* 

Aqui está a construção do indicativo dos eixos que (semi-retas) que cruzam a origem (0,0,0) da visualização da aplicação. 

*/

import * as THREE from 'three'

function AxisMark(scene) {

	const blue_material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
	const green_material = new THREE.LineBasicMaterial( { color: 0x00ff00 } );
	const red_material = new THREE.LineBasicMaterial( { color: 0xff0000 } );

	const blue_points = [];
	const green_points = [];
	const red_points = [];


	blue_points.push( new THREE.Vector3( 0, 0, -1 ) );
	blue_points.push( new THREE.Vector3( 0, 0, 1 ) );
	green_points.push( new THREE.Vector3( 0, -1, 0 ) );
	green_points.push( new THREE.Vector3( 0, 1, 0 ) );
	red_points.push( new THREE.Vector3( -1, 0, 0 ) );
	red_points.push( new THREE.Vector3( 1, 0, 0 ) );


	const blue_points_geometry = new THREE.BufferGeometry().setFromPoints( blue_points );
	const green_points_geometry = new THREE.BufferGeometry().setFromPoints( green_points );
	const red_points_geometry = new THREE.BufferGeometry().setFromPoints( red_points );

	const blue_line = new THREE.Line( blue_points_geometry, blue_material );
	const green_line = new THREE.Line( green_points_geometry, green_material );
	const red_line = new THREE.Line( red_points_geometry, red_material );

	scene.add( blue_line );
	scene.add( green_line );
	scene.add( red_line );
	
	this.update = function(time) {
		const scale = Math.sin(time)+2;
	}
}

export default AxisMark