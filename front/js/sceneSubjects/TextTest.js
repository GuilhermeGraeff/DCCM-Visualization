import * as THREE from 'three'
import {Text} from 'troika-three-text'

function TextTest(scene) {

	const myText = new Text()
	scene.add(myText)

	myText.text = 'Hello world!'
	myText.fontSize = 0.2
	myText.position.z = -2
	myText.color = 0x9966FF

	myText.sync()
	
	this.update = function(time) {
		const scale = Math.sin(time)+2;

	}
}

export default TextTest