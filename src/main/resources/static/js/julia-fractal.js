const app = new PIXI.Application({
    width: 800,
    height: 800,
    antialias: true,
    resolution: 1,
    transparent: false
});

document.body.appendChild(app.view);
const c0x = -0.7;
const c0y = 0.27015;
// let c0x = 0.274;
// let c0y = 0.006;
const zoomCoeff = 120 //percent
const zoomStep = 2 //percent
const zoomTarget = 150; // Target zoom level for zooming in
const MAX_ITERATIONS = 100;
const colorScale = 255 / MAX_ITERATIONS;


let fractalSprite;
let zoom = 30; //percent
let isStarted = false;
let offsetX = 0
let offsetY = 0
let count = 0

function calculateJulia(zx, zy, c0x, c0y) {
    let i;
    let val;
    for (i = 0; i < MAX_ITERATIONS; i++) {
        const tempZx = zx * zx - zy * zy + c0x;
        zy = 2 * zx * zy + c0y;
        zx = tempZx;
        val = zx * zx + zy * zy
        if (val > 4.0)
            break;
    }
    return i;
}

function updateFractal(zoom) {

    performance.mark("generateFractalImage-start")
    const texture = generateFractalImage(zoom);
    performance.mark("generateFractalImage-end")
    fractalSprite = new PIXI.Sprite(texture);
    app.stage.removeChildren();
    app.stage.addChild(fractalSprite);
    performance.mark("updateFractal-total")
    console.log(performance.measure("generate image of fractal", "generateFractalImage-start", "generateFractalImage-end"))
    console.log(performance.measure("just data", "generateData-1", "generateData-2"))
    console.log(performance.measure("render", "generateData-2", "render"))
    console.log(performance.measure("from data to render", "generateData-1", "render"))
    console.log(performance.measure("total", "generateFractalImage-start", "updateFractal-total"))

}

function generateFractalImage(zoom) {
    performance.mark("generateData-1")
    const buffer = new Uint8Array(app.view.width * app.view.height * 4);
    for (let y = 0; y < app.view.height; y++) {
        for (let x = 0; x < app.view.width; x++) {
            const zx = ((x + offsetX) - app.view.width / 2) / (zoom * app.view.width);
            const zy = ((y + offsetY) - app.view.height / 2) / (zoom * app.view.height);
            const iter = calculateJulia(zx, zy, c0x, c0y);
            const offset = (y * app.view.width + x) * 4;
            const color = iter * colorScale;
            buffer[offset] = color;
            buffer[offset + 1] = (color + 50) % 256;
            buffer[offset + 2] = (color + 100) % 256;
            buffer[offset + 3] = 255;
        }
    }
    performance.mark("generateData-2")
    const baseTexture = new PIXI.BaseTexture(new PIXI.BufferResource(buffer, {
        width: app.view.width,
        height: app.view.height,
    }));
    performance.mark("render")
    return new PIXI.Texture(baseTexture);
}

window.addEventListener('keydown', (e) => {
    switch (e.key) {
        case ' ':
            console.log("Mouse x:" + e.clientX + ", Mouse y:" + e.clientY)
            startPause()
    }
});
window.addEventListener('click', (e) => {
    console.log("Mouse x:" + e.clientX + ", Mouse y:" + e.clientY)

    startPause()
});

function startPause() {
    isStarted = !isStarted
    startSmoothZoomIn()

}

async function smoothZoomIn(duration) {
    while (isStarted && zoom < zoomTarget) {
        zoom = zoom + zoom * zoomStep / 100.0
        updateFractal(zoom / 100.0);
        await new Promise((resolve) => requestAnimationFrame(resolve));
    }
}

updateFractal(zoom / 100);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function startSmoothZoomIn() {
    await smoothZoomIn();
}