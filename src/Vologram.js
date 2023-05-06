import { BufferAttribute } from "three";
import * as THREE from 'three'
import { read } from "three/addons/libs/ktx-parse.module.js";
import {createElement} from "./utils.js";
import {VologramHeaderReader} from "./VologramHeaderReader.js";
import {VologramBodyReader} from "./VologramBodyReader.js";

//VologramFrame.cs AND VologramAssetLoader.cs
export class Vologram extends THREE.Group {

    constructor(folder, onProgress = () => {}, options = {}) {
        super()
        this.onProgress = onProgress
        this.options = {texture: 'texture_1024_h264.mp4', autoplay: true, ...options}

        this.elVideo = createElement(`<video width='400' height='80' muted controls loop playsinline preload='auto' crossorigin='anonymous'>`)
        this.fps = 30

        // elVideo.ontimeupdate is not triggered often enough
        this.elVideo.requestVideoFrameCallback(this.onVideoFrameCallback.bind(this))

        this.init(folder)
        window.VOLOG = this //dirty yeah, but for debugging only
    }

    async init(folder) {
        this.elVideo.src = folder + '/' + this.options.texture
        var texture = this.texture = new THREE.VideoTexture(this.elVideo)
        texture.minFilter = THREE.NearestFilter

        if(this.options.autoplay)
            this.elVideo.play()

        this.material = this.options.debugNormal
            ? new THREE.MeshNormalMaterial({
                side: THREE.DoubleSide,
                flatShading: true
            })
            : new THREE.MeshPhongMaterial({
                side: THREE.DoubleSide,
                flatShading: true,
                map: texture,
            })

        const {header, body, reader} = this.readers = await this.fetchMeshes(folder)

        const geo = this.fetchMesh(0, header, body, reader)

        this.mesh = new THREE.Mesh(geo, this.material)

        this.add(this.mesh)
    }

    async fetchMeshes(folder) {
        let header = await new VologramHeaderReader().init(folder + '/header.vols')
        let body = new VologramBodyReader(folder + '/sequence_0.vols', header.version, this.onProgress)
        let reader = await body.fetch()

        for (let i = 0; i < header.frameCount; i++) {
            body.customReadNext(reader, header.hasNormal(), header.isTextured(), false)
        }

        return {header, body, reader}
    }

    fetchMesh(frameNum, header, body, reader) {

        // body.customReadSeekFrame(reader, header.hasNormal(), header.isTextured(), frameNum)

        const headerDirectory = body.framesDirectory[frameNum]
        reader.cur = headerDirectory.cur
        body.customReadNext(reader, header.hasNormal(), header.isTextured())
        let geo = this.createGeometry(body)
        return geo
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

        if (this.prevFrameIdx !== frameIdx && this.readers) {
            const geo = this.fetchMesh(frameIdx, this.readers.header, this.readers.body, this.readers.reader)
            this.mesh.geometry.dispose()
            this.mesh.geometry = geo
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
        let geometry = new THREE.BufferGeometry()
        geometry.setIndex(new THREE.BufferAttribute(body.indicesData, 1))
        geometry.setAttribute('position', new THREE.BufferAttribute(body.verticesData, 3))
        geometry.setAttribute('normal', new THREE.BufferAttribute(body.normalsData, 3))
        geometry.setAttribute('uv', new THREE.BufferAttribute(body.uvsData, 2))

        return geometry
    }
}