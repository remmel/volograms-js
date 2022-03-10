import {BinaryReader} from "./BinaryReader.js"

// VologramHeaderReader.cs
export class VologramHeaderReader {

    async init(url) { //asynced constructor
        let response = await fetch(url)
        let reader = new BinaryReader(await (response.arrayBuffer()))

        this.format = reader.readString()
        this.version = reader.readInt32()
        this.compression = reader.readInt32()
        this.meshName = reader.readString()
        this.material = reader.readString()
        this.shader = reader.readString()
        this.topology = reader.readInt32()
        this.frameCount = reader.readInt32()

        if (this.version >= 11) {
            this.normals = reader.readByte()
            this.textured = reader.readByte()
            this.textureWidth = reader.readInt16()
            this.textureHeight = reader.readInt16()
            this.textureFormat = reader.readInt16()

            if (this.version >= 12) {
                this.translation = [reader.readSingle(), reader.readSingle(), reader.readSingle()]
                //data.dataView.getFloat32(75, true) //position 74 in C#
                this.rotation = [reader.readSingle(), reader.readSingle(), reader.readSingle(), reader.readSingle()]
                // this.scale0 = data.dataView.getFloat32(90, true)
                this.scale = reader.readSingle()
            }
        }
        return this
    }

    hasNormal() {
        return this.normals === 1
    }

    isTextured() {
        return this.textured === 1
    }
}