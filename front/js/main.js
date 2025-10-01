/*

Aqui fica o principal arquivo que é chamado no index para a renderização de todos os objetos necessários para a visualização
Também instancia a principal função presente no arquivo SceneManager.js que é responsável por gerenciar a cena 

*/

import SceneManager from './SceneManager.js'

const sceneManager = new SceneManager();

bindEventListeners();
render();

function bindEventListeners() {
    window.addEventListener('resize', sceneManager.onWindowResize, false)
}

function render() {
    requestAnimationFrame(render);
    sceneManager.update();
}