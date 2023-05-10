import * as THREE from "three";
import { BinaryReader, TypedArrays } from "./BinaryReader.js"
import {fetchOnProgress} from "./utils.js"

export class VologramBodyReader {

    constructor(url, header, onProgress = () => {}) {
        this.header = header

        this._url = url

        this.frameNumber = -1
        this.lastKeyFrameNumber = undefined //lastKeyFrameLoaded
        this._previousFrame = -1
        this.meshDataSize = undefined

        this.keyFrame = undefined
        this._verticesSize = undefined

        /** @type {Float32Array} */
        this.verticesData = null
        this.normalsData = null
        /** @type {Uint16Array} */
        this.indicesData = null
        /** @type {Float32Array} */
        this.uvsData = null
        this.textureData = null

        // ptr to frame start and frameData (vertices)
        this.framesDirectory = {}

        this.onProgress = onProgress
    }

    isKeyFrame() {
        return this.keyFrame === 1 || this.keyFrame === 2
    }

    async fetch() {
        let response = await fetchOnProgress(this._url, this.onProgress)
        this.reader = new BinaryReader(response.response)

        this.createFrameDictionary()
    }

    createFrameDictionary() {
        let keyFrameNumber = null
        for (let i = 0; i < this.header.frameCount; i++) {

            let cur = this.reader.cur
            this.readNextFrame(false)

            if (this.isKeyFrame()) {
                keyFrameNumber = this.frameNumber
            }

            this.framesDirectory[this.frameNumber] = {
                cur,
                frameNumber: this.frameNumber,
                meshDataSize: this.meshDataSize,
                keyFrame: this.keyFrame,
                keyFrameNumber
            }

        }
    }

    /**
     * Read whatever frame and takes care that previous keyframe was loaded
     * @param frameNum
     */
    readSeekFrame(frameNum) {
        const frameDirectory = this.framesDirectory[frameNum]

        // if keyframe not loaded
        if(frameDirectory.keyFrame === 0 && frameDirectory.keyFrameNumber !== this.lastKeyFrameNumber) {
            //prev version, was more optimized because was loading only this.readFrameData() not unnecessary data such as vertices, but cleaner code now. And normally skipped frame should not happen often
            this.reader.cur = frameDirectory.cur
            const keyframeDirectory = this.framesDirectory[frameDirectory.keyFrameNumber]
            this.reader.cur = keyframeDirectory.cur
            this.readNextFrame(true)
        }

        this.reader.cur = frameDirectory.cur
        this.readNextFrame(true)
    }

    /**
     * Read the next frame, next according to reader.cur (ptr)
     * @param readFrameData read the frame data or skip them (useful to optimize the creation of the dictionary)
     */

    readNextFrame(readFrameData = true) {
        this.frameNumber = this.reader.readInt32()
        this.meshDataSize = this.reader.readInt32()
        this.keyFrame = this.reader.readByte()
        this.frameHeaderCheck()

        if(readFrameData) {
            this.readFrameData()
        } else {
            this.skipFrameData()
        }
    }

    skipFrameData() {
        this.reader.cur += this.meshDataSize + 4 //where is the missing float32?!?
    }

    ////VologramFrame.cs:ParseBody

    readFrameData() {
        this.readVerticesData()

        if (this.header.hasNormal())
            this.readNormalsData()

        // New UVs from that frame
        if (this.isKeyFrame()) {
            this.lastKeyFrameNumber = this.frameNumber
            this.readIndicesData()
            this.readUvsData()
        }

        if (this.header.isTextured())
            this.readTextureData()

        this._frameMeshDataSize = this.reader.readInt32()
        this.frameDataSizeCheck()
    }

    readVerticesData() {
        this._verticesSize = this.reader.readInt32()
        this.verticesData = this.reader.readArray(this._verticesSize, TypedArrays.float32) // read Vector3 - 3 float - 3x4=12 byte each Vector3
    }

    readNormalsData() {
        this._normalSize = this.reader.readInt32()
        if (this._normalSize <= 0) throw new Error(`Invalid normals length value (${this._normalSize})`)
        if (this._normalSize !== this._verticesSize) throw new Error(`The number of normals (size:${this._normalSize}) does not match the number of vertices (size:${this._verticesSize}`)
        this.normalsData = this.reader.readArray(this._normalSize, TypedArrays.float32) // nb items : {x,y,z} * (this._normalSize / 12)
    }

    readIndicesData() {
        this._indicesSize = this.reader.readInt32()
        if (this._indicesSize <= 0) throw new Error(`Invalid indices length value (${this._indicesSize})`)
        this.indicesData = null

        let verticesCount = this._verticesSize / 4
        if (verticesCount / 3 < 65535) {
            this.usingShortIndices = true
            this.indicesData = this.reader.readArray(this._indicesSize, TypedArrays.uint16) //2=SIZE_C_SHORT
        } else {
            this.usingShortIndices = false
            this.indicesData = this.reader.readArray(this._indicesSize, TypedArrays.uint32) //4=SIZE_C_INT
        }
    }

    readUvsData() {
        this._uvsSize = this.reader.readInt32() //size in bytes
        if (this._uvsSize <= 0) throw new Error("Invalid uvs length value (" + this._uvsSize + ")")
        if (this._uvsSize / 2 !== this._verticesSize / 3) throw new Error(`The number of UVs does not match the number of vertices: ${this._uvsSize}(_uvsSize)/2 !== ${this._verticesSize}(_verticesSize)/3`)

        this.uvsData = this.reader.readArray(this._uvsSize, TypedArrays.float32)
    }

    readTextureData() { //TODO try it, current vols file; do not contains texture
        this._textureSize = this.reader.readInt32()
        this.textureData = []

        if (this._textureSize <= 0) throw new Error(`Invalid texture size value (${this._textureSize})`)
        this.textureData = this.reader.readArray(this._textureSize, TypedArrays.uint8)
    }

    frameHeaderCheck() {
        if (this.frameNumber < 0) throw new Error(`Invalid frameNumber (${this.frameNumber})`)
        if (this.meshDataSize < 1) throw new Error(`Invalid meshDataSize (${this.meshDataSize})`)
        if (this.keyFrame > 2) throw new Error(`Invalid keyFrame (${this.keyFrame})`)
    }

    frameDataSizeCheck() {
        if (this._frameMeshDataSize !== this.meshDataSize)
            throw new Error(`Total size before ${this.meshDataSize} and after ${this._frameMeshDataSize} body do not match`)
    }
}