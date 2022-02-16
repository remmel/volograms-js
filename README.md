# volograms-js
[Volograms](https://www.volograms.com/) js reader for [three.js](https://threejs.org/).  
Play in a browser volumetric videos produced by Volograms App.

- [demo](https://remmel.github.io/volograms-js) / [demo src](https://github.com/remmel/volograms-js/blob/main/src/demo.js)  
- [npm package](https://www.npmjs.com/package/volograms-js)

## Install the package
`npm i volograms-js`

## Use the lib
```javascript
import { Vologram } from 'volograms-js'

//setup threejs scene
//...

let vologram = new Vologram(url, p => console.log("loading...", p))
scene.add(vologram)

function animate() {
    ///...
    vologram.update() //to animate the vologram
}
```
