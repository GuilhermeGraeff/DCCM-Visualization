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

DCCMSlice constructor