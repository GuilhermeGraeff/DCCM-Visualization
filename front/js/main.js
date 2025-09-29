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