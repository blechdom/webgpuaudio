# WebGPUSound.com 
Experiments creating audio in WebGPU

Lots of sort-of working / sort-of glitchy demonstrations of how to get audio in and out of the webGPU API in the browser.

Advice welcome! 

Please contribute, fork, steal, improve, ruin, share!

## Local Dev

* Clone the repo -> [https://github.com/blechdom/webgpuaudio](https://github.com/blechdom/webgpuaudio)
* node version >= 18
* install yarn
* `$ yarn`
* `$ yarn start`
* goto browser: `localhost:3000`

## Hosting

* `SharedArrayBuffer` requires HTTPS and additional headers

# Troubleshooting

* Check your browser flags for WebGPU are enabled.
* Check your GPU on the [home page](https://www.webgpusound.com/)
* The `Play Sound` button should be at the bottom of the control panel. Refresh the page if this is not the case.
* Hard refresh is your friend, if the interface is out of order or the sound is more glitchy than usual.
* If you do not see the `Play Sound` button scroll down inside of the control panel.
