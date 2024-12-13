import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'dat.gui'


// Use MeshNormalMaterial or MeshMatcapMaterial
function createCube(color=0x00ff00, wireframe=false, x=0, y=0, z=0, ) {
    var geometry = new THREE.BoxGeometry()
    var material = new THREE.MeshMatcapMaterial({
        color: color,
        wireframe: wireframe,
    })
    var cube = new THREE.Mesh(geometry, material)
    cube.x = x
    cube.y = y
    cube.z = z
    return cube
}

function loadCATrajectory() {
    
}

const scene = new THREE.Scene()

const color = new THREE.Color().setHex( 0x959595 );

scene.background = color
scene.backgroundBlurriness = 0.5
// const backgroundColor = new THREE.Color().setHex( 0x112233 )
// scene.background.color = backgroundColor

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.z = 2

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
//controls.addEventListener('change', render)


var cubeInstance = createCube(0xff0000)
console.log(cubeInstance)
scene.add(cubeInstance)


//create a blue LineBasicMaterial
const blue_material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
const green_material = new THREE.LineBasicMaterial( { color: 0x00ff00 } );
const red_material = new THREE.LineBasicMaterial( { color: 0xff0000 } );

const blue_points = [];
const green_points = [];
const red_points = [];


blue_points.push( new THREE.Vector3( 0, 0, 0 ) );
blue_points.push( new THREE.Vector3( 0, 0, 1 ) );
green_points.push( new THREE.Vector3( 0, 0, 0 ) );
green_points.push( new THREE.Vector3( 0, 1, 0 ) );
red_points.push( new THREE.Vector3( 0, 0, 0 ) );
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

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  render()
}

const stats = Stats()
document.body.appendChild(stats.dom)

const gui = new GUI()
const cubeFolder = gui.addFolder('Cube')
cubeFolder.add(cubeInstance.rotation, 'x', 0, Math.PI * 2)
cubeFolder.add(cubeInstance.rotation, 'y', 0, Math.PI * 2)
cubeFolder.add(cubeInstance.rotation, 'z', 0, Math.PI * 2)
cubeFolder.open()
const cameraFolder = gui.addFolder('Camera')
cameraFolder.add(camera.position, 'z', 0, 10)
cameraFolder.open()

function animate() {
  requestAnimationFrame(animate)

  stats.begin()
  cubeInstance.rotation.x += 0.1
  cubeInstance.position.x += 1

  cubeInstance.rotation.y += 0.001
  stats.end()

  render()

  stats.update()
}

function render() {
  renderer.render(scene, camera)
}

animate()
//render()