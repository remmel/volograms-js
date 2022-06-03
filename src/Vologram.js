import * as THREE from 'three'
import {createElement} from "./utils.js";
import {VologramHeaderReader} from "./VologramHeaderReader.js";
import {VologramBodyReader} from "./VologramBodyReader.js";

//VologramFrame.cs AND VologramAssetLoader.cs
export class Vologram extends THREE.Group {

    constructor(folder, onProgress = () => {}, options = {}) {
        super()
        this.onProgress = onProgress
        this.options = {texture: 'texture_2048_h264.mp4', autoplay: true, ...options}

        this.elVideo = createElement(`<video width='400' height='80' muted controls loop playsinline preload='auto' crossorigin='anonymous'>`)
        this.geometries = []
        this.fps = 30

        // elVideo.ontimeupdate is not triggered often enough
        this.elVideo.requestVideoFrameCallback(this.onVideoFrameCallback.bind(this))

        this.init(folder)
        window.VOLOG = this //dirty yeah, but for debugging only
    }

    async init(folder) {
        this.geometries = await this.fetchMeshes(folder)
        this.elVideo.src = folder + '/' + this.options.texture
        // this.elVideo.playbackRate = 0.1
        var texture = this.texture = new THREE.VideoTexture(this.elVideo)
        texture.minFilter = THREE.NearestFilter

        if(this.options.autoplay)
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
        //Load all the geometry in memory. Dirty but OK, as Volograms currently last 5sec max
        let body = new VologramBodyReader(folder + '/sequence_0.vols', header.version, this.onProgress)
        let reader = await body.fetch()
        for (let i = 0; i < header.frameCount; i++) {
            body.customReadNext(reader, header.hasNormal(), header.isTextured())
            let geo = this.createGeometry(body)
            geometries.push(geo)
        }
        return geometries
    }

    /**
     * Loop system (was before in update())
     * this is better to use requestVideoFrameCallback.metadata.mediaTime has it's more stable (always the same for one frame),
     * rather that this.elVideo.currentTime which depends of when it was trigger. Because the time between each frame is not exactly 1/30
     * this is better to "always fall" at the "center" (or same offset) of a frame as we are not sure if a little before is previous frame or current (idem after)
     * Alternative to get precise frame number is to encode it in the video
     */
    onVideoFrameCallback(now, metadata) {
        var frameIdx = this.getFrameIdx(metadata.mediaTime)

        if (this.prevFrameIdx !== frameIdx) {
            if (frameIdx >= this.geometries.length) return console.error("out frame:" + frameIdx + " time: " + this.elVideo.currentTime)
            this.mesh.geometry = this.geometries[frameIdx]
            // if(this.prevFrameIdx !== undefined)
            //     this.geometries[this.prevFrameIdx].dispose()
            this.prevFrameIdx = frameIdx
        }

        this.elVideo.requestVideoFrameCallback(this.onVideoFrameCallback.bind(this))
    }
    
    update(delta) {
        //currently not used anymore but maybe in the future
    }

    /**
     * For some video, the first is 0 and other 0.02322
     * Need add at least 0.00001 for 0 based te be in correct frame
     * @param time
     * @returns {number}
     */
    getFrameIdx(time) { //eg [0.667-0.700[=20
        return Math.floor(time * this.fps + 0.0001) //30fps
    }

    /**
     * Create geometry from .vol body information
     * @param {VologramBodyReader} body
     * @returns {THREE.BufferGeometry}
     */
    createGeometry(body) {
        let vertices = []
        let uvs = []
        // as this is done at init, we do not care to optimize it,
        // but would be better to not copy the data, only using pointer
        // we prefer here code readability over optimization
        body.verticesData.forEach(xyz => vertices.push(xyz.x, xyz.y, xyz.z))
        body.uvsData.forEach(xy => uvs.push(xy.x, xy.y))

        let geometry = new THREE.BufferGeometry()
        geometry.setIndex(body.indicesData)
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
        return geometry
    }
}