# volograms-js

[![Node.js CI](https://github.com/remmel/volograms-js/actions/workflows/node.js.yml/badge.svg)](https://github.com/remmel/volograms-js/actions/workflows/node.js.yml)

[Volograms](https://www.volograms.com/) js reader for [three.js](https://threejs.org/).  
Play in a browser volumetric videos produced by Volograms App.

Try it :
- Easier and quicker way : [demo jsm](https://remmel.github.io/volograms-js/index-jsm.html) ([source](https://github.com/remmel/volograms-js/blob/main/dist/index-jsm.html))
- or with npm : [demo npm](https://remmel.github.io/volograms-js) ([source](https://github.com/remmel/volograms-js/blob/main/src/demo.js))

[npm package](https://www.npmjs.com/package/volograms-js)

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
                "three": "https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.module.js"
            }
        }
</script>

<script type="module">
    import * as THREE from 'three'
    import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.148.0/examples/jsm/controls/OrbitControls.js'
    import {Vologram} from 'https://cdn.jsdelivr.net/npm/volograms-js@latest/src/Vologram.js' //replace latest with version eg 0.1.116 for production usage

    // code
</script>
```

## Install from `<script>` umd (no module)
This is not possible as no build is generated. I'm not really of fan of committing compiled code in github.
Need to try https://bundle.run/ or https://wzrd.in/ or https://unpkg.com/

## Options

- `texture` : The video texture is expected to be named `texture_1024_h264.mp4`, otherwise if it is named for example `texture_2048_h264.mp4` do `new Vologram(url, () => {}, {texture: 'texture_2048_h264.mp4'})`
- `autoplay` : By default, this is true, but if you don't want to play when loaded: `new Vologram(url, () => {}, {autoplay: false})` 

## Sound & Play/Pause

This lib uses and exposes the standard [`HTMLVideoElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement);  most common methods are:
- [pause](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/pause): `vologram.elVideo.pause()`
- [play](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play): `vologram.elVideo.play()`
- [unmute](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/muted): `vologram.elVideo.muted = false`. Remember that usually playing and unmuted video, needs an user interaction (to avoid annoying him with unwanted sound / advertising)
- [seek](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/currentTime): `vologram.elVideo.currentTime = 1.5`. In seconds

### Troubleshooting

#### Unsynced texture with geometry
If the volumetric video blink (texture not always synced with geometry) please send me the data files and information about your system (OS + Browser).
Some explanation: as the frame is not encoded in the texture, we have to guess/calculated it.
This is possible as the video have constant framerate (1/30) however I figured out that some started at 0 and other at 0.02322.
And this is possible than for other it could also be different.

#### Multiple Three.js
If `WARNING: Multiple instances of Three.js being imported.` See https://discourse.threejs.org/t/35292

#### Unsynced and low sound
The volograms I recorded have a slight offset between the texture and the sound and a low sound.
The problem is independent of my plugin and comes from the vologram generation.
However, you can easily fix it with the use of `ffmpeg`:
- To delay 0.5s the sound : `ffmpeg -i texture_1024_h264.mp4 -itsoffset 0.5 -i texture_1024_h264.mp4 -map 0:v -map 1:a -c copy texture_1024_h264_delayed.mp4`  
- To increase   the sound : `ffmpeg -i texture_1024_h264.mp4 -filter:a "volume=3" -vcodec copy  texture_1024_h264_louder.mp4` (or use js `createGain()`).  

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
# open https://localhost:9000/index-jsm.html
```

#### Use local checkout package in my project
`npm i volograms-js@../volograms-js/`

### Publish new version on npm
`npm version 0.1.1`
`npm publish`