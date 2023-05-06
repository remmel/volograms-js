import * as THREE from "three";
import { BinaryReader, TypedArrays } from "./BinaryReader.js"
import {fetchOnProgress} from "./utils.js"

export class VologramBodyReader {

    constructor(url, version, onProgress = () => {}) {
        this._url = url
        this._version = version

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

        this.framesDirectory = {}

        this.onProgress = onProgress
    }

    isKeyFrame() {
        return this.keyFrame === 1 || this.keyFrame === 2
    }

    async fetch() {
        let response = await fetchOnProgress(this._url, this.onProgress)
        return new BinaryReader(response.response)
    }

    customReadNext(reader, hasNormals, textured, readFrameData = true) {
        const frameCur = reader.cur
        this.frameNumber = reader.readInt32()
        this.meshDataSize = reader.readInt32()
        this.keyFrame = reader.readByte()
        this.frameHeaderCheck()

        if(readFrameData) {
            this.readKeyFrameDataIfSkipped(reader, hasNormals, textured)
            this.readFrameData(reader, hasNormals, textured)
        } else {
            this.handleFramesDirectory(frameCur, reader.cur)
            this.skipFrameData(reader)
        }
    }

    readKeyFrameDataIfSkipped(reader, hasNormals, textured) { //this is really dirty, need to rework that
        const frameDirectory = this.framesDirectory[this.frameNumber]
        if(!this.isKeyFrame() && this.lastKeyFrameNumber !== frameDirectory.lastKeyFrameNumber) {
            const keyframeDirectory = this.framesDirectory[frameDirectory.lastKeyFrameNumber]
            const cur = reader.cur
            reader.cur = keyframeDirectory.frameDataCur
            this.keyFrame = keyframeDirectory.keyFrame
            this.readFrameData(reader, hasNormals, textured)
            this.keyFrame = 0
            this.lastKeyFrameNumber = keyframeDirectory.frameNumber
            reader.cur = cur
        }
    }

    skipFrameData(reader) {
        reader.cur += this.meshDataSize + 4 //where is the missing float32?!?
    }

    handleFramesDirectory(cur, frameDataCur) {
        if (this.isKeyFrame()) {
            this.lastKeyFrameNumber = this.frameNumber
        }

        this.framesDirectory[this.frameNumber] = {
            cur,
            frameDataCur,
            frameNumber: this.frameNumber,
            meshDataSize: this.meshDataSize,
            keyFrame: this.keyFrame,
            lastKeyFrameNumber: this.lastKeyFrameNumber
        }
    }

    ////VologramFrame.cs:ParseBody

    readFrameData(reader, hasNormals, textured) {
        this.readVerticesData(reader)

        if (hasNormals)
            this.readNormalsData(reader)

        // New UVs from that frame
        if (this.isKeyFrame()) {
            this.lastKeyFrameNumber = this.frameNumber
            this.readIndicesData(reader)
            this.readUvsData(reader)
        }

        if (textured)
            this.readTextureData(reader)

        this._frameMeshDataSize = reader.readInt32()
        // this.frameDataSizeCheck()
    }

    readVerticesData(reader) {
        this._verticesSize = reader.readInt32()
        this.verticesData = reader.readArray(this._verticesSize, TypedArrays.float32) // read Vector3 - 3 float - 3x4=12 byte each Vector3
    }

    readNormalsData(reader) {
        this._normalSize = reader.readInt32()
        if (this._normalSize <= 0) throw new Error(`Invalid normals length value (${this._normalSize})`)
        if (this._normalSize !== this._verticesSize) throw new Error(`The number of normals (size:${this._normalSize}) does not match the number of vertices (size:${this._verticesSize}`)
        this.normalsData = reader.readArray(this._normalSize, TypedArrays.float32) // nb items : {x,y,z} * (this._normalSize / 12)
    }

    readIndicesData(reader) {
        this._indicesSize = reader.readInt32()
        if (this._indicesSize <= 0) throw new Error(`Invalid indices length value (${this._indicesSize})`)
        this.indicesData = null

        let verticesCount = this._verticesSize / 4
        if (verticesCount / 3 < 65535) {
            this.usingShortIndices = true
            this.indicesData = reader.readArray(this._indicesSize, TypedArrays.uint16) //2=SIZE_C_SHORT
        } else {
            this.usingShortIndices = false
            this.indicesData = reader.readArray(this._indicesSize, TypedArrays.uint32) //4=SIZE_C_INT
        }
    }

    readUvsData(reader) {
        this._uvsSize = reader.readInt32() //size in bytes
        if (this._uvsSize <= 0) throw new Error("Invalid uvs length value (" + this._uvsSize + ")")
        if (this._uvsSize / 2 !== this._verticesSize / 3) throw new Error(`The number of UVs does not match the number of vertices: ${this._uvsSize}(_uvsSize)/2 !== ${this._verticesSize}(_verticesSize)/3`)

        this.uvsData = reader.readArray(this._uvsSize, TypedArrays.float32)
    }

    readTextureData(reader) { //TODO try it, current vols file; do not contains texture
        this._textureSize = reader.readInt32()
        this.textureData = []

        if (this._textureSize <= 0) throw new Error(`Invalid texture size value (${this._textureSize})`)
        this.textureData = reader.readArray(this._textureSize, TypedArrays.uint8)
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