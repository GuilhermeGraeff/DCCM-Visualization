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
  cubeInstance.rotation.x += 0.01
  cubeInstance.rotation.y += 0.01
  stats.end()

  render()

  stats.update()
}

function render() {
  renderer.render(scene, camera)
}

animate()
//render()