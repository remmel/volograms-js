import * as THREE from 'three'
import {createElement} from "./utils.js";
import {VologramHeaderReader} from "./VologramHeaderReader.js";
import {VologramBodyReader} from "./VologramBodyReader.js";

//VologramFrame.cs AND VologramAssetLoader.cs
export class Vologram extends THREE.Group {

    constructor(folder, onProgress = () => {}, options = {texture: 'texture_2048_h264.mp4'}) {
        super()
        this.onProgress = onProgress

        this.elVideo = createElement(`<video width='400' height='80' muted controls loop playsinline preload='auto' crossorigin='anonymous'>`)
        this.geometries = []
        this.fps = 30

        this.options = options

        //this.elVideo.ontimeupdate = e => this.update(e)

        this.init(folder)
        window.V = this
    }

    async init(folder) {
        this.geometries = await this.fetchMeshes(folder)
        this.elVideo.src = folder + '/' + this.options.texture
        // this.elVideo.playbackRate = 0.1
        var texture = this.texture = new THREE.VideoTexture(this.elVideo)
        texture.minFilter = THREE.NearestFilter
        this.elVideo.play()

        this.material = new THREE.MeshPhongMaterial({
            side: THREE.DoubleSide,
            flatShading: true,
            map: texture,
        })

        //init mesh with 1st geometry
        this.mesh = new THREE.Mesh(this.geometries[0], this.material)

        this.add(this.mesh)
    }

    async fetchMeshes(folder) {
        let geometries = []
        let header = await new VologramHeaderReader().init(folder + '/header.vols')
        //TODO must handle multiple files not only number 0
        let body = new VologramBodyReader(folder + '/sequence_0.vols', header.version, this.onProgress)
        let reader = await body.fetch()
        for (let i = 0; i < header.frameCount; i++) {
            body.customReadNext(reader, header.hasNormal(), header.isTextured())
            let geo = this.createGeometry(body)
            geometries.push(geo)
        }
        return geometries
    }

    //or ontimeupdate
    update(delta) {//alternative is to do something like this.elVideo.currentTime+=delta
        if (this.geometries.length === 0) return

        //TODO should handle that it takes a couple of ms to lead new mesh
        var frameIdx = this.getFrameIdx(this.elVideo.currentTime)

        if (this.prevFrameIdx !== frameIdx) {
            if (frameIdx >= this.geometries.length) return console.error("out frame:" + frameIdx + " time: " + this.elVideo.currentTime)
            this.mesh.geometry = this.geometries[frameIdx]
            // if(this.prevFrameIdx !== undefined)
            //     this.geometries[this.prevFrameIdx].dispose()
            this.prevFrameIdx = frameIdx
        }
    }

    getFrameIdx(currentTime) { //eg [0.667-0.700[=20
        return Math.floor(currentTime * this.fps) //30fps
    }

    /**
     * Create geometry from .vol body information
     * @param {VologramBodyReader} body
     * @returns {THREE.BufferGeometry}
     */
    createGeometry(body) {
        let vertices = []
        let uvs = []
        body.verticesData.forEach(xyz => vertices.push(xyz.x, xyz.y, xyz.z))
        body.uvsData.forEach(xy => uvs.push(xy.x, xy.y))

        let geometry = new THREE.BufferGeometry()
        geometry.setIndex(body.indicesData)
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
        return geometry
    }
}