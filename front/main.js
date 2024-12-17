import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'dat.gui'

import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'

import myArray from './data/MscOutputArray.js'

// Funções relacionadas a cena 

const scene = new THREE.Scene()

const color = new THREE.Color().setHex( 0x959595 );

scene.background = color
scene.backgroundBlurriness = 0.5


// Funções relacionadas à camera

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.z = 2

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)


window.addEventListener('resize', onWindowResize, false)

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  render()
}

const stats = Stats()
document.body.appendChild(stats.dom)

// Funções do Menu

// const gui = new GUI()
// const cubeFolder = gui.addFolder('Cube')
// cubeFolder.add(cubeInstance.rotation, 'x', 0, Math.PI * 2)
// cubeFolder.add(cubeInstance.rotation, 'y', 0, Math.PI * 2)
// cubeFolder.add(cubeInstance.rotation, 'z', 0, Math.PI * 2)
// cubeFolder.open()
// const cameraFolder = gui.addFolder('Camera')
// cameraFolder.add(camera.position, 'z', 0, 10)
// cameraFolder.open()

  // xesquedele


// Funções relacionadas á visualização do S-DCCM

  // Ler Matriz DCCM


function gradientColorForCorrelation(value) {
  const blue = { r: 0, g: 0, b: 255 };   // Azul
  const white = { r: 255, g: 255, b: 255 }; // Branco
  const red = { r: 255, g: 0, b: 0 };    // Vermelho

  let resultColor;

  if (value < 0) {
    const t = (value + 1); 
    resultColor = {
      r: Math.round(blue.r * (1 - t) + white.r * t),
      g: Math.round(blue.g * (1 - t) + white.g * t),
      b: Math.round(blue.b * (1 - t) + white.b * t),
    };
  } else {
    const t = value; 
    resultColor = {
      r: Math.round(white.r * (1 - t) + red.r * t),
      g: Math.round(white.g * (1 - t) + red.g * t),
      b: Math.round(white.b * (1 - t) + red.b * t),
    };
  }
  return `rgb(${resultColor.r}, ${resultColor.g}, ${resultColor.b})`;
}

function gradientColorForCorrelationForParticles(value) {
  const blue = { r: 0, g: 0, b: 255 };   // Azul
  const white = { r: 255, g: 255, b: 255 }; // Branco
  const red = { r: 255, g: 0, b: 0 };    // Vermelho

  let resultColor;

  if (value < 0) {
    const t = (value + 1); 
    resultColor = {
      r: Math.round(blue.r * (1 - t) + white.r * t),
      g: Math.round(blue.g * (1 - t) + white.g * t),
      b: Math.round(blue.b * (1 - t) + white.b * t),
    };
  } else {
    const t = value; 
    resultColor = {
      r: Math.round(white.r * (1 - t) + red.r * t),
      g: Math.round(white.g * (1 - t) + red.g * t),
      b: Math.round(white.b * (1 - t) + red.b * t),
    };
  }
  return [resultColor.r, resultColor.g, resultColor.b];
}


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


  // Cubos - Isso aqui provaelmente não vai funcionar

function createCube(color=0x00ff00, wireframe=false, x=0, y=0, z=0, size=0.1 ) {
  var geometry = new THREE.BoxGeometry()
  var material = new THREE.MeshMatcapMaterial({
      color: color,
      wireframe: wireframe,
  })
  var cube = new THREE.Mesh(geometry, material)

  cube.position.set( x, y, z );

  cube.scale.set( size, size, size );

  return cube
}

function createRandomDCCM( size ) {
  var random_DCCM_columns = new Array();
  for (var i = 0; i < size; i++) {
    var random_DCCM_line = new Array();
    for (var j = 0; j < size; j++) {
      random_DCCM_line.push((Math.random()*2) - 1)
    }
    random_DCCM_columns.push(random_DCCM_line)
  }
  return random_DCCM_columns
}

//                                                step_length -> Define as dimensões de cada cubo
function createCubeSlice( slice, pos_x, pos_y, pos_z, step_length ) {
  var DCCM_slice = new Array();
  for (var i = 0; i < slice.length; i++) {
    for (var j = 0; j < slice[i].length; j++) {
      var cubeInstance = createCube(gradientColorForCorrelation(slice[i][j]), false, pos_x+(i*step_length), pos_y+(j*step_length), pos_z, step_length)
      DCCM_slice.push(cubeInstance)
    }
  }
  return DCCM_slice
}

  // TODO: Partículas (se ficar muito ruim com a renderização dos cubos)

function createParticleSlice( slice, pos_x, pos_y, pos_z, step_length, particle_size ) {
  const particle_geometry = new THREE.BufferGeometry();

  const positions = [];
	const colors = [];

  for (var residue = 0; residue < slice.length; residue++) {
    for (var j = 0; j < slice[residue].length; j++) {
      positions.push( pos_x+(residue*step_length), pos_y+(j*step_length), pos_z );
      var color_gradient = gradientColorForCorrelationForParticles(slice[residue][j])
			colors.push( color_gradient[0]/255.0, color_gradient[1]/255.0, color_gradient[2]/255.0)
    }
  }
  
  particle_geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
  particle_geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

  particle_geometry.computeBoundingSphere();

  const particle_material = new THREE.PointsMaterial( { size: particle_size, vertexColors: true } );

  var points = new THREE.Points( particle_geometry, particle_material );
  return points
}




var random_ddcms = []
var number_of_slices = myArray.length
var number_of_residues = myArray[0].length
var step_length = 0.09
var plane_length = step_length * number_of_residues
var plane_depth = step_length * number_of_slices
var particle_size = 0.11




// for (let i = 0; i < number_of_slices; i++) {
//   random_ddcms.push(createRandomDCCM(number_of_residues))
// }

const fontLoader = new FontLoader()

for (let i = 0; i < myArray.length; i++) {   //     v-padding-v
  var dccm_points = createParticleSlice(myArray[i], 1, 0.05, (-1) - (i*0.1), step_length, particle_size )

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


for (let i = 0; i < myArray[0].length; i++) {
  fontLoader.load(
    'node_modules/three/examples/fonts/droid/droid_serif_regular.typeface.json',
    (droidFont) => {
      const textGeometry = new TextGeometry(`Resíduo ${i}`,{
        depth: 0.001,
        size: 0.055,
        font: droidFont
      })
      const textMaterial = new THREE.MeshMatcapMaterial({ color: 0x303030})
      const textMesh = new THREE.Mesh(textGeometry, textMaterial)
      textMesh.position.x = 0.98 + (i * step_length * 1.0001) // -0.97 and 1.11 arbitrary
      textMesh.position.y = 0
      textMesh.position.z = -0.97

      textMesh.rotateX(-Math.PI / 2)
      textMesh.rotateZ(-Math.PI / 2)
      scene.add(textMesh)
    }
  )
}

// Add plane
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


function animate() {
  requestAnimationFrame(animate)

  stats.begin()


  stats.end()

  render()


  stats.update()
}


function render() {
  renderer.render(scene, camera)
}

animate()
//render()



// const geometry = new THREE.BufferGeometry();

// const n_particles_col = 10
// const n_particles_row = 10 

// const particles_vertices = []
// for (let i = 0; i < n_particles_col; i++) {
//   for (let j = 0; j < n_particles_row; j++) {
//     const point = [i, j, 0]
//     particles_vertices.push(...point)
//   }
// }

// const vertices = new Float32Array(particles_vertices);

// geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
// const material = new THREE.PointsMaterial( { color: 0xff0000 } );
// const mesh = new THREE.Points( geometry, material );

