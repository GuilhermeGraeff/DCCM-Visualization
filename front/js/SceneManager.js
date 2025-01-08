
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'

import GeneralLights from './sceneSubjects/GeneralLights';
import AxisMark from './sceneSubjects/AxisMark'
import DccmSlice from './sceneSubjects/DccmSlice'


function SceneManager() {
    const clock = new THREE.Clock();
    
    const screenDimensions = {
        width: window.innerWidth,
        height: window.innerHeight
    }
    
    const scene = buildScene();
    const renderer = buildRender(screenDimensions);
    const camera = buildCamera(screenDimensions);
    const controls = buildControls();
    const sceneSubjects = createSceneSubjects(scene);
    const stats = createStats();

    
    function buildScene() {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x959595);
        scene.backgroundBlurriness = 0

        return scene;
    }

    function buildRender({ width, height }) {
        const renderer = new THREE.WebGLRenderer()
        renderer.setSize(window.innerWidth, window.innerHeight)
        document.body.appendChild(renderer.domElement)

        return renderer;
    }

    function buildCamera({ width, height }) {
        const aspectRatio = width / height;
        const fieldOfView = 60;
        const nearPlane = 0.1;
        const farPlane = 1000; 
        const camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);
        camera.position.z = 2

        return camera;
    }

    function buildControls() {
        const controls = new OrbitControls(camera, renderer.domElement)
        return controls;
    }

    function createSceneSubjects(scene) {
        
        const sceneSubjects = [
            new GeneralLights(scene),
            new AxisMark(scene),
            new DccmSlice(scene)
        ];
        
        return sceneSubjects;
    }

    function createStats() {
        const stats = Stats()
        document.body.appendChild(stats.dom)

        return stats;
    }

    this.update = function() {
        
        const elapsedTime = clock.getElapsedTime();

        for(let i=0; i<sceneSubjects.length; i++){
            if (Array.isArray(sceneSubjects[i])){
                for(let j=0; j<sceneSubjects[i].length; j++){
                    sceneSubjects[i][j].update(elapsedTime);
                }
            } else {
                sceneSubjects[i].update(elapsedTime);
            }
        }
        stats.begin()


        stats.end()

        renderer.render(scene, camera);

        stats.update()
    }

    this.onWindowResize = function() {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
        render()
    }
}

export default SceneManager