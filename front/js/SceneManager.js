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
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import GeneralLights from './sceneSubjects/GeneralLights';
import AxisMark from './sceneSubjects/AxisMark';
// import Hud from './sceneSubjects/Hud';
import DccmSlice from './sceneSubjects/DccmSlice';
import DynamicBackground from './sceneSubjects/DynamicBackground';

import simulationData from './simulation_data_files_path.js';

// TODO: Adaptar para o uso de GPU na renderização 
// import WebGPURenderer from 'three/src/renderers/webgpu/WebGPURenderer.js'; 

function SceneManager() {


    const clock = new THREE.Clock();
    
    // Inicializa variáveis utilizadas em diferentes contextos
    const screenDimensions = {
        width: window.innerWidth,
        height: window.innerHeight
    };

    let simulationController = null;
    let replicaController = null;
    let fileController = null;
    let isVisualizationActive = false;
    let mousePositionX = 0;
    let mousePositionY = 0;

    let currentFilePath = null;
    let sceneSubjects;
    let settings;
    let sliceController = null;
    // let hudVisibility = false;

    let pointsController = null;
    let avgFpsController = null;

    const metricsList = [];
    let frameCount = 0;
    let lastTimeFPS = performance.now();
    let currentFPS = 60;

    let isBenchmarking = false;
    let benchmarkQueue = [];
    let currentTestIndex = 0;
    const TEST_DURATION_MS = 15000;

    let fpsSamples = []; 
    let currentMetricSession = null;

    // Instancia Raycaster para a função de 'Tooltip' ao passar o mouse em cima de um ponto
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.07; 
    const mouse = new THREE.Vector2();
    // Tooltip div
    const tooltipDiv = document.createElement('div');
    tooltipDiv.className = 'tooltip';
    tooltipDiv.style.position = 'absolute';
    tooltipDiv.style.display = 'none';
    document.body.appendChild(tooltipDiv);
    window.addEventListener('pointermove', onPointerMove);

    // Painel inicial da aplicação
    const welcomeScreen = document.getElementById('welcome-screen');
    const startButton = document.getElementById('start-button');
    startButton.addEventListener('click', () => {
        welcomeScreen.classList.add('hidden');
        panel.show();
        isVisualizationActive = true;
    });

    // Inicializa componentes da cena
    const scene = buildScene();
    const renderer = buildRender(screenDimensions);
    const camera = buildCamera(screenDimensions);
    const controls = buildControls();
    const stats = createStats();
    const panel = createPanel();
    panel.hide();

    // scene.add(camera);

    // Cria os sujeitos da cena
    // sceneSubjects = createSceneSubjects(scene,camera); 
    sceneSubjects = createSceneSubjects(scene); 

    // Reposiciona o centro que a câmera orbita em torno
    const objectToOrbit = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshNormalMaterial());
    objectToOrbit.position.set(15, 15, 0);
    scene.add(objectToOrbit);
    controls.target.copy(objectToOrbit.position);
    scene.remove(objectToOrbit);

    function handlePointsCount(count){
        settings['visible points'] = count; 
        if (pointsController) {
            pointsController.updateDisplay(); 
        }

        if (currentMetricSession) {
            currentMetricSession.visible_points = count;
            currentMetricSession.pos_threshold = settings['modify positive threshold'];
            currentMetricSession.neg_threshold = settings['modify negative threshold'];
        }
    };

    function onPointerMove(event) {
        // Normaliza a posição do mouse (de -1 a +1)
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

        mousePositionX = event.clientX;
        mousePositionY = event.clientY;
    }

    function buildScene() {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x959595);
        scene.backgroundBlurriness = 0;
        return scene;
    }

    function buildRender({ width, height }) {
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

    
        const gl = renderer.getContext();
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

        console.log("GPU Vendor:", vendor);
        console.log("GPU Renderer:", gpu);

        return renderer;
    }

    function buildCamera({ width, height }) {
        const aspectRatio = width / height;
        const fieldOfView = 60;
        const nearPlane = 0.1;
        const farPlane = 1000; 
        const camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);
        camera.position.x = 15;
        camera.position.y = 20;
        camera.position.z = 30;
        return camera;
    }

    function buildControls() {
        const controls = new OrbitControls(camera, renderer.domElement);
        return controls;
    }

    function updateSliceControllerMax(numSlices) {
        sliceController.max(numSlices - 1);
        if (settings['selected slice'] >= numSlices) {
            settings['selected slice'] = -1;
        }
        sliceController.updateDisplay();


        // // Se o dado foi carregado, podemos atualizar os heatmaps do HUD
        // const dccmSlice = sceneSubjects[3];
        // const hud = sceneSubjects[4];
        
        // let matrix = dccmSlice.dccmTools.getSliceAsMatrix;
        // console.log("cuuu"+ matrix);
        // if (dccmSlice && hud) {
        //     hud.itens.forEach(item => camera.remove(item));
        // // Cria os novos com os dados reais
        //     hud.itens = hud.createItens(camera, matrix);
        // }
    }

    function startAutomatedBenchmark() {
        benchmarkQueue = [];
        const thresholds = [0.1, 0.3, 0.5, 0.7, 0.9];
        
        // 1. Monta a fila de testes percorrendo seu simulationData
        Object.keys(simulationData).forEach(sim => {
            Object.keys(simulationData[sim]).forEach(rep => {
                Object.keys(simulationData[sim][rep]).forEach(fileType => {
                    thresholds.forEach(t => {
                        benchmarkQueue.push({
                            simulation: sim,
                            replica: rep,
                            fileType: fileType,
                            threshold: t
                        });
                    });
                });
            });
        });
        console.log(benchmarkQueue)
        console.log(`Iniciando Benchmark: ${benchmarkQueue.length} configurações encontradas.`);
        isBenchmarking = true;
        currentTestIndex = 0;
        runNextBenchmarkStep();
    }

    function runNextBenchmarkStep() {
        if (currentTestIndex >= benchmarkQueue.length) {
            isBenchmarking = false;
            alert("Benchmark concluído! Você já pode baixar o CSV.");
            return;
        }

        const test = benchmarkQueue[currentTestIndex];
        
        // Atualiza as configurações
        settings.simulation = test.simulation;
        settings.replica = test.replica;
        settings.fileType = test.fileType;
        settings['modify positive threshold'] = test.threshold;
        settings['modify negative threshold'] = test.threshold;

        // Reseta métricas de FPS para este teste específico
        fpsSamples = [];
        
        // Aplica as mudanças (isso vai disparar o carregamento do arquivo)
        applyChanges();

        // Aguarda o tempo estipulado para coletar FPS enquanto a câmera gira
        setTimeout(() => {
            currentTestIndex++;
            runNextBenchmarkStep();
        }, TEST_DURATION_MS);
    }

    function handlePerformanceData(data){

        const memoryUse = performance.memory ? (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB' : 'N/A';
    
        const newEntry = {
            timestamp: new Date().toISOString(),
            filename: data.filename,
            simulation: settings.simulation,
            replica: settings.replica,
            fileType: settings.fileType,
            pos_threshold: settings['modify positive threshold'],
            neg_threshold: settings['modify negative threshold'],
            load_time_ms: data.load_time_ms,
            render_time_ms: data.render_time_ms,
            avg_fps: settings['average fps'],
            memory_heap: memoryUse,
            visible_points: settings['visible points']
        };
        
        metricsList.push(newEntry);

        currentMetricSession = newEntry; 
        
        console.log(`Nova métrica: ${data.filename} | Threshold: ${newEntry.pos_threshold} | Pontos: ${newEntry.visible_points}`);
    };

    function createSceneSubjects(scene, camera) {   
        currentFilePath = simulationData[settings.simulation][settings.replica][settings.fileType];

        const dynamicBackground = new DynamicBackground(scene);

        const dccmSubject = new DccmSlice(scene, settings, currentFilePath, dynamicBackground, updateSliceControllerMax, handlePerformanceData, handlePointsCount);

        // const hud = new Hud(scene, camera, hudVisibility)

        var subjects = [
            new GeneralLights(scene),
            new AxisMark(scene),
            dynamicBackground,
            dccmSubject,
            // hud
        ];
        return subjects;
    }

    function createStats() {
        const stats = Stats();
        document.body.appendChild(stats.dom);
        return stats;
    }

    function createPanel() {
        const panel = new GUI( { width: 310 } );
        const dccmFolder = panel.addFolder( 'DCCM settings' );
        const simulationDataFolder = panel.addFolder( 'Simulation Data' );
        
        const simulationNames = Object.keys(simulationData);
        const initialSim = simulationNames[0];
        const replicaNames = Object.keys(simulationData[initialSim]);
        const initialRep = replicaNames[0];
        const fileNames = Object.keys(simulationData[initialSim][initialRep]);
        const initialFile = fileNames[fileNames.length-1];

        settings = {
            // 'show 2d comparison': true,
            'modify positive threshold': 0.4,
            'modify negative threshold': 0.4,
            'selected slice': -1,
            'display unselected layers': true,
            'simulation': initialSim,
            'replica': initialRep,
            'fileType': initialFile,
            'visible points': 0,
            'average fps': 0
        };
        
        // panel.add( settings, 'show 2d comparison' ).onChange( applyChanges );
        dccmFolder.add( settings, 'modify positive threshold', 0, 1, 0.05 ).onChange( applyChanges);
        dccmFolder.add( settings, 'modify negative threshold', 0, 1, 0.05 ).onChange( applyChanges );
        sliceController = dccmFolder.add(settings, 'selected slice', -1, 1, 1);
        sliceController.onChange(applyChanges); 
        dccmFolder.add( settings, 'display unselected layers' ).onChange( applyChanges );
       
        

        simulationController = simulationDataFolder.add(settings, 'simulation', simulationNames).name('Simulation');
        replicaController = simulationDataFolder.add(settings, 'replica', replicaNames).name('Replica');
        fileController = simulationDataFolder.add(settings, 'fileType', fileNames).name('File Type');
    
        simulationController.onChange(applyChanges);
        replicaController.onChange(applyChanges);
        fileController.onChange(applyChanges);

        
        
        const exportFolder = panel.addFolder('Performance Metrics');

        pointsController = exportFolder.add(settings, 'visible points').disable().listen();
        
        avgFpsController = exportFolder.add(settings, 'average fps').disable().listen();
        
        const benchmarkActions = {
            'Run Full Benchmark': startAutomatedBenchmark
        };
        exportFolder.add(benchmarkActions, 'Run Full Benchmark');

        dccmFolder.open();
        simulationDataFolder.open();
        exportFolder.open();

        const exportFunctions = {
            'Download CSV': exportMetricsToCSV
        };
        exportFolder.add(exportFunctions, 'Download CSV');
        exportFolder.open();

        return panel
    }

    // Atualiza a visualização conforme as configurações selecionadas
    function applyChanges() {
        const newFilePath = simulationData[settings.simulation][settings.replica][settings.fileType];
        const dccmSlice = sceneSubjects[3];
        const dynamicBackground = sceneSubjects[2];
        
        // const hud = sceneSubjects[4];

        // // Toggle de visibilidade do HUD
        // if (settings['show 2d comparison'] !== hudVisibility) {
        //     hudVisibility = settings['show 2d comparison'];
        //     // Se ocultar, podemos setar o background e itens como invisíveis
        //     if (hud) {
        //         hud.background.visible = hudVisibility;
        //         hud.itens.forEach(i => i.visible = hudVisibility);
        //     }
        // }
        
        if (newFilePath !== currentFilePath) {
            currentFilePath = newFilePath;

            fpsSamples = [];
            currentMetricSession = null;
            settings['average fps'] = 0;

            if (dccmSlice) {
                dccmSlice.dispose(scene);
            }
            if (dynamicBackground) {
                dynamicBackground.hide();
            }
            sceneSubjects[3] = new DccmSlice(scene, settings, currentFilePath, dynamicBackground, updateSliceControllerMax, handlePerformanceData, handlePointsCount);
        } else {
            if (dccmSlice) {
                dccmSlice.updateFromSettings(settings);
            }
        }
    }

    function exportMetricsToCSV() {
        if (metricsList.length === 0) {
            alert("Nenhuma métrica registrada ainda. Altere alguns arquivos para gerar dados.");
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "timestamp,filename,simulation,replica,pos_threshold,neg_threshold,load_time_ms,render_time_ms,avg_fps,memory_heap_mb,visible_points\n";
        
        metricsList.forEach(row => {
            csvContent += `${row.timestamp},${row.filename},${row.simulation},${row.replica},${row.pos_threshold},${row.neg_threshold},${row.load_time_ms},${row.render_time_ms},${row.avg_fps},${row.memory_heap.replace(' MB', '')}, ${row.visible_points}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "dccm_performance_metrics.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // 
    this.update = function() {
        stats.update();
        controls.update();

        if (isBenchmarking) {
            const time = Date.now() * 0.001; // Tempo em segundos
            const radius = 40; // Raio da órbita
            camera.position.x = 15 + Math.cos(time) * radius;
            camera.position.z = 0 + Math.sin(time) * radius;
            camera.lookAt(15, 15, 0); // Foca no centro da visualização
        } else {
            controls.update(); // Só usa o controle manual se não estiver em benchmark
        }

            frameCount++;
            const now = performance.now();
            if (now >= lastTimeFPS + 1000) {
                currentFPS = (frameCount * 1000) / (now - lastTimeFPS);
    
                if (currentFPS > 5 && isVisualizationActive && currentMetricSession) { 
                    fpsSamples.push(currentFPS);
                    
                    const sum = fpsSamples.reduce((a, b) => a + b, 0);
                    const avg = (sum / fpsSamples.length).toFixed(1);
                    
                    settings['average fps'] = avg;
                    
                    currentMetricSession.avg_fps = avg; 
                }

                lastTimeFPS = now;
                frameCount = 0;
            }

        raycaster.setFromCamera(mouse, camera);

        // Define quais pontos irão interagir com o mouse
        let interactiveObjects = [];
        if (sceneSubjects[3] && isVisualizationActive) {
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
        if (isVisualizationActive) {
            if (intersects.length > 0) {
                const intersection = intersects[0];
                const pointIndex = intersection.index; 
                const intersectedObject = intersection.object;

                // Encontra qual fatia o objeto intersectado pertence
                const sourceSlice = sceneSubjects[3].slicePoints.find(sp => sp.points === intersectedObject);
                
                if (sourceSlice && sourceSlice.pointData[pointIndex]) {
                    const data = sourceSlice.pointData[pointIndex];
                    const resNames = sceneSubjects[3].dccmData.residueNames;

                    // Monta o texto do tooltip
                    tooltipDiv.style.display = 'block';
                    tooltipDiv.innerHTML = `
                        Slice: ${sourceSlice.sliceIndex}<br>
                        Correlação: ${data.value}<br>
                        Resíduos: ${resNames[data.residueI]} ${data.residueI+1} ↔ ${resNames[data.residueJ]} ${data.residueJ+1}
                    `;

                    // Posiciona o tooltip um pouco acima do ponteiro do mouse
                    tooltipDiv.style.left = `${mousePositionX + 10}px`;
                    tooltipDiv.style.top = `${mousePositionY - 30}px`;
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
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.render(scene, camera);
    }
}

export default SceneManager