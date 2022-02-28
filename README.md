# volograms-js
[Volograms](https://www.volograms.com/) js reader for [three.js](https://threejs.org/).  
Play in a browser volumetric videos produced by Volograms App.

- [demo npm](https://remmel.github.io/volograms-js) / [demo npm src](https://github.com/remmel/volograms-js/blob/main/src/demo.js)
- [demo jsm](https://remmel.github.io/volograms-js/index-jsm.html) / [demo jsm src](https://github.com/remmel/volograms-js/blob/main/dist/index-jsm.html)
- [npm package](https://www.npmjs.com/package/volograms-js)

## Install from npm

`npm i volograms-js`

### Code snippet
```javascript

//import three.js and volograms-js
import * as THREE from 'three';
import {Vologram} from 'volograms-js'

//setup threejs scene
//...

let vologram = new Vologram(url, p => console.log("loading...", p))
scene.add(vologram)

function animate() {
    ///...
    vologram.update() //to animate the vologram
}
```

## Install from CDN or static hosting - es module

No volograms.module.js is generated we rely on skypack.
```html
<script type="module">
    import * as THREE from 'https://cdn.skypack.dev/three@0.136.0'
    import {Vologram} from 'https://cdn.skypack.dev/volograms-js'
    
    //...
</script>
```

## Install from `<script>` (no module)
This is not possible as no build is generated.
Need to try https://bundle.run/ or https://wzrd.in/ or https://unpkg.com/


### Troubleshooting

If `WARNING: Multiple instances of Three.js being imported.` See https://discourse.threejs.org/t/35292

### Note for myself

#### Demo build
That lib doesn't have any build to be imported by external app (we rely on skypack).  
That lib could be published without the webpack build, examples folder and demo.js file.  
Thoses files are only here for testing and example purpose.  
I should split the reusable code to be imported with the demo code. And provide the built file which can be imported (using rollup? `Use webpack for apps, and Rollup for libraries`).   
