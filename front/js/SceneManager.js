
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import GeneralLights from './sceneSubjects/GeneralLights';
import AxisMark from './sceneSubjects/AxisMark'
import DccmSlice from './sceneSubjects/DccmSlice' // Mudar aquiiiiiiiiiii
import GroundPlane from './sceneSubjects/GroundPlane'
// import TextTest from './sceneSubjects/TextTest'

import simulationData from './simulation_data_files_path.js';

// import WebGPURenderer from 'three/src/renderers/webgpu/WebGPURenderer.js';

function SceneManager() {
    const clock = new THREE.Clock();
    
    const screenDimensions = {
        width: window.innerWidth,
        height: window.innerHeight
    }
    let simulationController = null;
    let replicaController = null;
    let fileController = null;

    const scene = buildScene();
    const renderer = buildRender(screenDimensions);
    const camera = buildCamera(screenDimensions);
    const controls = buildControls();
    const stats = createStats();
    const panel = createPanel();
    var sceneSubjects = createSceneSubjects(scene);
    var settings;
   


    // Set camera to orbit the center of the visualization
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshNormalMaterial();
    const objectToOrbit = new THREE.Mesh(geometry, material);
    objectToOrbit.position.set(15, 15, 0);
    scene.add(objectToOrbit);
    controls.target.copy(objectToOrbit.position);
    scene.remove(objectToOrbit);


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
        camera.position.x = 15
        camera.position.y = 20
        camera.position.z = 30

        return camera;
    }

    function buildControls() {
        const controls = new OrbitControls(camera, renderer.domElement)
        return controls;
    }

    function createSceneSubjects(scene) {
        
        var sceneSubjects = [
            new GeneralLights(scene),
            new AxisMark(scene),
            new GroundPlane(scene),
            new DccmSlice(scene, settings['modify negative threshold'], settings['modify positive threshold'], settings['selected slice'], settings['display unselected layers'], simulationData[settings['simulation']][settings['replica']][settings['fileType']]),
        ];
        
        return sceneSubjects;
    }

    function createStats() {
        const stats = Stats()
        document.body.appendChild(stats.dom)

        return stats;
    }

    function createPanel() {
        const panel = new GUI( { width: 310 } );

        const folder1 = panel.addFolder( 'DCCM settings' );

        const folder2 = panel.addFolder( 'Simulation Data' );
        
        const simulationNames = Object.keys(simulationData);
        const initialSim = simulationNames[0];
        const replicaNames = Object.keys(simulationData[initialSim]);
        const initialRep = replicaNames[0];
        const fileNames = Object.keys(simulationData[initialSim][initialRep]);
        const initialFile = fileNames[5];

        settings = {
            'modify positive threshold': 0.4,
            'modify negative threshold': 0.4,
            'selected slice': -1,
            'display unselected layers': true,
            'removeObjects': removeObjects,
            'applyChanges': applyChanges,
            'simulation': initialSim,
            'replica': initialRep,
            'fileType': initialFile,
        };
        
        folder1.add( settings, 'modify positive threshold', 0, 1, 0.05 ).onChange( applyChanges);
        folder1.add( settings, 'modify negative threshold', 0, 1, 0.05 ).onChange( applyChanges );
        folder1.add( settings, 'selected slice', -1, 50, 1 ).onChange( applyChanges );
        folder1.add( settings, 'display unselected layers' ).onChange( applyChanges );
        folder1.add( settings, 'removeObjects' );
        folder1.add( settings, 'applyChanges' );
       
        simulationController = folder2.add(settings, 'simulation', simulationNames).name('Simulation');
        replicaController = folder2.add(settings, 'replica', replicaNames).name('Replica');
        fileController = folder2.add(settings, 'fileType', fileNames).name('File Type');
    
        simulationController.onChange(applyChanges);
        replicaController.onChange(applyChanges);
        fileController.onChange(applyChanges);

        folder1.open();
        folder2.open();

        return panel
    }
    
    function removeObjects() {
        sceneSubjects[3].disposePoints(scene,sceneSubjects[3].parentObject)
        while(scene.children.length > 0){ 
            scene.remove(scene.children[0]); 
        }
        console.log(scene.children)
        renderer.render(scene, camera);
    }


    function applyChanges() {

        sceneSubjects[3].disposePoints(scene,sceneSubjects[3].parentObject)
        while(scene.children.length > 0){ 
            scene.remove(scene.children[0]); 
        }
        sceneSubjects = [
            new GeneralLights(scene),
            new AxisMark(scene),
            new GroundPlane(scene, sceneSubjects[3].number_of_residues, sceneSubjects[3].number_of_slices),
            new DccmSlice(scene, settings['modify negative threshold'], settings['modify positive threshold'], settings['selected slice'], settings['display unselected layers'], simulationData[settings['simulation']][settings['replica']][settings['fileType']]),
        ];
        renderer.render(scene, camera);
    }
    

    // Dccm management:

    this.update = function() {

        const elapsedTime = clock.getElapsedTime();

        controls.update();

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