import {BinaryReader} from "./BinaryReader.js"
import {fetchOnProgress} from "./utils.js"

export class VologramBodyReader {

    constructor(url, version, onProgress = () => {}) {
        this._url = url
        this._version = version

        this.frameNumber = -1
        this.lastKeyFrameNumber = undefined
        this._previousFrame = -1
        this.meshDataSize = undefined
        this.keyFrame = undefined
        this._verticesSize = undefined

        this.verticesData = []
        this.normalsData = []
        this.indicesData = []
        this.uvsData = []
        this.textureData = []

        this.onProgress = onProgress
    }

    isKeyFrame() {
        return this.keyFrame === 1
    }

    async fetch() {
        let response = await fetchOnProgress(this._url, this.onProgress)
        // let response = await fetch(this._url); let arraybuffer = await(response.arrayBuffer())
        return new BinaryReader(response.response)
    }

    customReadNext(reader, hasNormals, textured) {
        this.frameNumber = reader.readInt32()
        this.meshDataSize = reader.readInt32()
        this.keyFrame = reader.readByte()
        this.frameHeaderCheck()
        this.readFrameData(reader, hasNormals, textured)
    }

    ////VologramFrame.cs:ParseBody

    readFrameData(reader, hasNormals, textured) {
        this.readVerticesData(reader)

        if (hasNormals)
            this.readNormalsData(reader)

        // New UVs from that frame
        if (this.keyFrame === 1 || this.keyFrame === 2) {
            this.lastKeyFrameNumber = this.frameNumber
            this.readIndicesData(reader)
            this.readUvsData(reader)
        }

        if (textured)
            this.readTextureData(reader)

        this._frameMeshDataSize = reader.readInt32()
        this.frameDataSizeCheck()
    }

    readVerticesData(reader) {
        this._verticesSize = reader.readInt32()
        this.verticesData = []
        // read Vector3 - 3 float - 3x4=12 byte each Vector3
        for (let i = 0; i < this._verticesSize / 12; i++) { //probably something more effecient than that
            this.verticesData.push({
                x: reader.readSingle(),
                y: reader.readSingle(),
                z: reader.readSingle()
            })
        }
    }

    readNormalsData(reader) {
        this._normalSize = reader.readInt32()
        if (this._normalSize <= 0) throw new Error(`Invalid normals length value (${this._normalSize})`)
        if (this._normalSize !== this._verticesSize) throw new Error(`The number of normals (size:${this._normalSize}) does not match the number of vertices (size:${this._verticesSize}`)
        // for(let i=0;i<this._normalSize/4;i++) this.normalsData.push(reader.readSingle())
        this.normalsData = []
        for (let i = 0; i < this._normalSize / 12; i++) {
            this.normalsData.push({
                x: reader.readSingle(),
                y: reader.readSingle(),
                z: reader.readSingle()
            })
        }
    }

    readIndicesData(reader) {
        this._indicesSize = reader.readInt32()
        if (this._indicesSize <= 0) throw new Error(`Invalid indices length value (${this._indicesSize})`)
        this.indicesData = []

        let verticesCount = this._verticesSize / 4
        if (verticesCount / 3 < 65535) {
            this.usingShortIndices = true
            for (let i = 0; i < this._indicesSize / 2; i++) { //2=SIZE_C_SHORT
                this.indicesData.push(reader.readShort()) //this.indicesDataS
            }
        } else {
            this.usingShortIndices = false
            for (let i = 0; i < this._indicesSize / 4; i++) { //4=SIZE_C_INT
                this.indicesData.push(reader.readInt32())
            }
        }
    }

    readUvsData(reader) {
        this._uvsSize = reader.readInt32()
        if (this._uvsSize <= 0) throw new Error("Invalid uvs length value (" + this._uvsSize + ")")
        if (this._uvsSize / 2 !== this._verticesSize / 3) throw new Error(`The number of UVs does not match the number of vertices: ${this._uvsSize}(_uvsSize)/2 !== ${this._verticesSize}(_verticesSize)/3`)
        this.uvsData = []

        for (let i = 0; i < this._uvsSize / 8; i++) {
            this.uvsData.push({
                x: reader.readSingle(),
                y: reader.readSingle()
            })
        }
    }

    readTextureData(reader) { //TODO try it!
        this._textureSize = reader.readInt32()
        this.textureData = []

        if (this._textureSize <= 0) throw new Error(`Invalid texture size value (${this._textureSize})`)
        for (let i = 0; i < this._textureSize; i++) {
            this.textureData.push(reader.readByte())
        }
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