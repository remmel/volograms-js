// const { IOBuffer } = require('iobuffer') //npm i iobuffer
//let iobuffer = new IOBuffer(arrayBuffer)

export class BinaryReader {
    /** */
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


    //        // let blob = await(response.blob())
    //         // let version = new Uint16Array(arrayBuffer, 4, 1)// let dataView = new DataView(arrayBuffer)
    readInt32() {
        let val =  this.dataView.getInt32(this.cur,true)
        this.cur += 4 //move pointer 4 bytes further
        // let val = 0
        // for(let i=0; i<4; i++, this.cur++) {
        //     val +=this.array[this.cur]<<i // * Math.pow(2,i*8) //TODO check the pow or use << instead
        // }
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

    // // https://stackoverflow.com/questions/42699162/javascript-convert-array-of-4-bytes-into-a-float-value-from-modbustcp-read
    // static readSingle(data) {
    //
    //     //(new DataView(arrayBuffer)).getFloat32(75, true)

    //     var data4 =  [this.array[this.cur++], this.array[this.cur++], this.array[this.cur++], this.array[this.cur++]]
    //
    //     var buf = new ArrayBuffer(4);
    //     var view = new DataView(buf);
    //
    //     data4.forEach((b, i) => {
    //         view.setUint8(i, b)
    //     })
    //
    //     // Read the bits as a float; note that by doing this, we're implicitly
    //     // converting it from a 32-bit float into JavaScript's native 64-bit double
    //     return view.getFloat32(0, true);
    // }

    readSingle(){
        let val =  this.dataView.getFloat32(this.cur, true) //see IOBuffer.ts readFloat32
        this.cur += 4
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