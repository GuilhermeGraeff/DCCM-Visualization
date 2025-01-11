import * as THREE from 'three'
import {Text} from 'troika-three-text'

function TextTest(scene) {

	const myText = new Text()
	scene.add(myText)

	// Set properties to configure:
	myText.text = 'Hello world!'
	myText.fontSize = 0.2
	myText.position.z = -2
	myText.color = 0x9966FF

	// Update the rendering:
	myText.sync()
	
	this.update = function(time) {
		const scale = Math.sin(time)+2;

		// mesh.scale.set(scale, scale, scale);
	}
}

export default TextTest