import * as THREE from 'three'
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js"
import {Vologram} from "./Vologram.js"

// setup render, scene, light, orbitcontrol
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
scene.add(new THREE.AmbientLight(0xFFFFFF, 1))

const controls = new OrbitControls(camera, renderer.domElement)
camera.position.set(0, 2, 2)
controls.target.set(0, 0.9, 0)
controls.update()

//setup some helper on the scene
scene.add(new THREE.AxesHelper(1))
scene.add(new THREE.GridHelper(10, 10))

// as a volograms takes time to be downloaded, display loading information
const updateLoading = p => {
    const el = document.getElementById('gui')
    el.innerText = Math.round(p*100) + '%'
}

let url = 'https://www.kustgame.com/ftp/vv/volograms/remy_ld'
let vologram = new Vologram(url, updateLoading)
scene.add(vologram)

function animate() {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
}

animate()