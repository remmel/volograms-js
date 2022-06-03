# volograms-js

[![Node.js CI](https://github.com/remmel/volograms-js/actions/workflows/node.js.yml/badge.svg)](https://github.com/remmel/volograms-js/actions/workflows/node.js.yml)

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
import * as THREE from 'three'
import {Vologram} from 'volograms-js'

//setup threejs scene
//...

let vologram = new Vologram(url, p => console.log("loading...", p))
scene.add(vologram)

```

## Install from CDN or static hosting - es module

No volograms.module.js is generated. It will directly use the js es6 code. See `demo jsm` html above.
```html
<!-- related with threejs -->
<!-- Import maps polyfill -->
<!-- Remove this when import maps will be widely supported -->
<script async src="https://unpkg.com/es-module-shims@1.3.6/dist/es-module-shims.js"></script>
<script type="importmap">
        {
            "imports": {
                "three": "https://cdn.jsdelivr.net/npm/three@0.136.0/build/three.module.js"
            }
        }
</script>

<script type="module">
    import * as THREE from 'three'
    import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.136.0/examples/jsm/controls/OrbitControls.js'
    import {Vologram} from 'https://cdn.jsdelivr.net/npm/volograms-js@0.1.12/src/Vologram.js'

    // code
</script>
```

## Install from `<script>` umd (no module)
This is not possible as no build is generated. I'm not really of fan of committing compiled code in github.
Need to try https://bundle.run/ or https://wzrd.in/ or https://unpkg.com/


### Troubleshooting

#### Unsynced texture with geometry
If the volumetric video blink (texture not always synced with geometry) please send me the data files and information about your system (OS + Browser).
Some explanation: as the frame is not encoded in the texture, we have to guess/calculated it.
This is possible as the video have constant framerate (1/30) however I figured out that some started at 0 and other at 0.02322.
And this is possible than for other it could also be different.

#### Multiple Three.js
If `WARNING: Multiple instances of Three.js being imported.` See https://discourse.threejs.org/t/35292

### Note to older myself

#### Demo build
That lib doesn't have any build to be imported by external app. We rely on skypack or cdn to access e6 modules.  
That lib could be published without the webpack build, examples folder and demo.js file.  
Thoses files are only here for testing and example purpose.  
I should split the reusable code to be imported with the demo code. And provide the built file which can be imported (using rollup? `Use webpack for apps, and Rollup for libraries`).   

#### Improve that lib
```shell
git clone https://github.com/remmel/volograms-js.git
cd volograms-js
npm install
npm run start
# open https://localhost:9000/
```