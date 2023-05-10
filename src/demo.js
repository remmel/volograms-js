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
    const el = document.getElementById('loading')
    el.innerText = Math.round(p*100) + '%'

    if(p === 1.0) { //when loaded/100%
        // Play and unmute when clicking on canvas (because of Chrome policy; cannot be autoplay)
        renderer.domElement.onclick = e => {
            vologram.elVideo.play()
            vologram.elVideo.muted = false
            renderer.domElement.onclick = null
        }
    }
}

// Play/Pause button and Sound/Mute button
document.getElementById('playpause').onclick = e => vologram.elVideo.paused ? vologram.elVideo.play() : vologram.elVideo.pause()
document.getElementById('sound').onclick = e => vologram.elVideo.muted = !vologram.elVideo.muted


let url = 'https://www.metalograms.com/ftp/vv/volograms/1670754904327_ld'
let vologram = new Vologram(url, updateLoading)
scene.add(vologram)

function animate() {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
}

animate()