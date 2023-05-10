// const { IOBuffer } = require('iobuffer') //npm i iobuffer
//let iobuffer = new IOBuffer(arrayBuffer)

// TODO use https://www.npmjs.com/package/iobuffer?activeTab=readme instead

export const TypedArrays = {
    int8: Int8Array,
    uint8: Uint8Array,
    int16: Int16Array,
    uint16: Uint16Array,
    int32: Int32Array,
    uint32: Uint32Array,
    uint64: BigUint64Array,
    int64: BigInt64Array,
    float32: Float32Array,
};

export class BinaryReader {
    constructor(arrayBuffer) {
        this.array = new Uint8Array(arrayBuffer)
        this.dataView = new DataView(arrayBuffer)
        this.cur=0
        this.arrayBuffer = arrayBuffer
    }

    readString(){
        let val = ''
        let size = this.array[this.cur]
        this.cur++

        for(let i = 0; i<size; i++, this.cur++) {
            let cascii = this.array[this.cur]
            let char = String.fromCharCode(cascii)
            val += char
        }

        return val
    }

    readInt32() {
        let val =  this.dataView.getInt32(this.cur,true)
        this.cur += 4 //move pointer 4 bytes further
        return val
    }

    readInt16() {
        let val = this.dataView.getInt32(this.cur, true)
        this.cur += 2
        return val
    }

    readByte() {
        return this.array[this.cur++]
    }

    readSingle(d){
        let val =  this.dataView.getFloat32(this.cur, true) //see IOBuffer.ts readFloat32

        this.cur += 4
        return val
    }


    /**
     * @param bytes bytes to read (eg 1 float32 is 4 bytes === 32 bits)
     // * @returns {Float32Array|}
     */
    readArray(bytes, type = TypedArrays.uint8) {
        const val = type.BYTES_PER_ELEMENT === 1 || this.cur % type.BYTES_PER_ELEMENT === 0
            ? new type(this.arrayBuffer, this.cur, bytes / type.BYTES_PER_ELEMENT) // probably more efficient but can only be used if multiple of type.BYTES_PER_ELEMENT : `Uncaught RangeError: start offset of Float32Array should be a multiple of 4`
            : new type(this.arrayBuffer.slice(this.cur, this.cur + bytes))
        this.cur += bytes
        return val
    }

    readShort() {
        let val = this.dataView.getInt16(this.cur, true)
        this.cur += 2
        return val
    }

    isEOF() {
        return this.cur === this.dataView.byteLength
    }
}