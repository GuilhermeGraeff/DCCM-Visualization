/*

Arquivo responsável por gerenciar a cena como um todo, responsável por:
    Painel de alteração de parâmetros
    Cena
    Câmera
    Controles
    Status
    Inclusive o plano e as fatias próprias do método
    Aplicação das mudanças enfrentadas pelo painel (atualização de tresholds, sistemas, réplicas e tamanho d fatias)

*/
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

import GeneralLights from './sceneSubjects/GeneralLights';
import AxisMark from './sceneSubjects/AxisMark'
import DccmSlice from './sceneSubjects/DccmSlice'
import DynamicBackground from './sceneSubjects/DynamicBackground'
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

    let visualizacaoAtiva = false;

    const welcomeScreen = document.getElementById('welcome-screen');
    const startButton = document.getElementById('start-button');

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.07; 
    const mouse = new THREE.Vector2();

    let mouseClientX = 0;
    let mouseClientY = 0;

    
    const tooltipDiv = document.createElement('div');
    tooltipDiv.className = 'tooltip'; // Antes era 'dccm-label'
    tooltipDiv.style.position = 'absolute';
    tooltipDiv.style.display = 'none'; // Começa escondido
    document.body.appendChild(tooltipDiv);
    window.addEventListener('pointermove', onPointerMove);

    startButton.addEventListener('click', () => {
        welcomeScreen.classList.add('hidden');
        panel.show();
        visualizacaoAtiva = true;
    });

    let currentFilePath = null;
    let sceneSubjects;
    let settings;
    let sliceController = null;

    const panel = createPanel();
    panel.hide();


    sceneSubjects = createSceneSubjects(scene); 


    const objectToOrbit = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshNormalMaterial());
    objectToOrbit.position.set(15, 15, 0);
    scene.add(objectToOrbit);
    controls.target.copy(objectToOrbit.position);
    scene.remove(objectToOrbit);

    function onPointerMove(event) {
        // Normaliza a posição do mouse (de -1 a +1)
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

        mouseClientX = event.clientX;
        mouseClientY = event.clientY;
    }

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

        
    function updateSliceControllerMax(numSlices) {
        sliceController.max(numSlices - 1);
        if (settings['selected slice'] >= numSlices) {
            settings['selected slice'] = -1;
        }
        sliceController.updateDisplay();
    }

    function createSceneSubjects(scene) {
        
        currentFilePath = simulationData[settings.simulation][settings.replica][settings.fileType];

        const dynamicBackground = new DynamicBackground(scene);


        const dccmSubject = new DccmSlice(scene, settings, currentFilePath, dynamicBackground, updateSliceControllerMax);

        var subjects = [
            new GeneralLights(scene),
            new AxisMark(scene),
            dynamicBackground,
            dccmSubject,
        ];
        
        return subjects;
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
            'simulation': initialSim,
            'replica': initialRep,
            'fileType': initialFile,
        };
        
        folder1.add( settings, 'modify positive threshold', 0, 1, 0.05 ).onChange( applyChanges);
        folder1.add( settings, 'modify negative threshold', 0, 1, 0.05 ).onChange( applyChanges );
        sliceController = folder1.add(settings, 'selected slice', -1, 1, 1);
        sliceController.onChange(applyChanges); 
        folder1.add( settings, 'display unselected layers' ).onChange( applyChanges );
       
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


    function applyChanges() {

        const newFilePath = simulationData[settings.simulation][settings.replica][settings.fileType];
        const dccmSlice = sceneSubjects[3];
        const dynamicBackground = sceneSubjects[2];

        if (newFilePath !== currentFilePath) {
            currentFilePath = newFilePath;
            if (dccmSlice) {
                dccmSlice.dispose(scene);
            }

            if (dynamicBackground) {
                dynamicBackground.hide();
            }
            sceneSubjects[3] = new DccmSlice(scene, settings, currentFilePath, dynamicBackground, updateSliceControllerMax);
        } else {
            if (dccmSlice) {
                dccmSlice.updateFromSettings(settings);
            }
        }
    }

    this.update = function() {
        stats.update();
        controls.update();

        raycaster.setFromCamera(mouse, camera);

        let interactiveObjects = [];
        if (sceneSubjects[3] && visualizacaoAtiva) {
            const selectedSliceIndex = settings['selected slice'];
            
            if (selectedSliceIndex !== -1) {
                const activeSlice = sceneSubjects[3].slicePoints.find(sp => sp.sliceIndex === selectedSliceIndex);
                if (activeSlice) {
                    interactiveObjects.push(activeSlice.points);
                }
            } else {
                interactiveObjects = sceneSubjects[3].slicePoints.map(sp => sp.points);
            }
        }
        
        const intersects = raycaster.intersectObjects(interactiveObjects, false);
        if (visualizacaoAtiva) {
            if (intersects.length > 0) {
                const intersection = intersects[0];
                const pointIndex = intersection.index; 
                const intersectedObject = intersection.object;

                // Encontra a qual fatia (slice) o objeto intersectado pertence
                const sourceSlice = sceneSubjects[3].slicePoints.find(sp => sp.points === intersectedObject);
                
                if (sourceSlice && sourceSlice.pointData[pointIndex]) {
                    const data = sourceSlice.pointData[pointIndex];
                    const resNames = sceneSubjects[3].dccmData.residueNames;

                    // Monta o texto do tooltip
                    tooltipDiv.style.display = 'block';
                    tooltipDiv.innerHTML = `
                        Slice: ${sourceSlice.sliceIndex}<br>
                        Correlação: ${data.value}<br>
                        Resíduos: ${resNames[data.residueI]} ↔ ${resNames[data.residueJ]}
                    `;
                    // Posiciona o tooltip um pouco acima do ponteiro do mouse
                    tooltipDiv.style.left = `${mouseClientX + 10}px`;
                    tooltipDiv.style.top = `${mouseClientY - 30}px`;
                } else {
                    tooltipDiv.style.display = 'none';
                }
            } else {
                tooltipDiv.style.display = 'none';
            }
        }
        renderer.render(scene, camera);
    }

    this.onWindowResize = function() {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.render(scene, camera);
    }
}

export default SceneManager