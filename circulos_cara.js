
class CirculosCara {
  constructor(img, maxBrightness = 85, espaciado = 3, maxRadio = 20) {
    this.img = img;
    this.maxBrightness = maxBrightness;
    this.maxRadio = maxRadio;
    this.espaciado = espaciado;
    this.circulos = []; // Stores {x, y, diameter}
  }

  procesaImagen() {
    this.img.loadPixels();
    this.circulos = []; // borra datos previos.

    for (let y = 0; y < this.img.height; y += this.espaciado) {
      for (let x = 0; x < this.img.width; x += this.espaciado) {
        let idx = (x + y * this.img.width) * 4;
        let brightness = this.img.pixels[idx]; // R, G, and B are equal in grayscale

        if (brightness <= this.maxBrightness) {
            const radio = floor(map(brightness, 0, this.maxBrightness, 1, this.maxRadio));
            this.circulos.push({ x: x, y: y, radio });
        }
      }
    }
    return this.circulos;
  }

}

//
// let img;
//
// function preload() {
//   img = loadImage('cara.jpg'); 
// }
//
// function setup() {
//   createCanvas(1366, 768, WEBGL); // P3D -> WEBGL in p5.js
//   // frameRate(1);
//   // noStroke();
//   noLoop();
//   ellipseMode(CENTER);
// }
//
// function draw() {
//   background(245);
//   img.loadPixels();
//   strokeWeight(2.5);
//
//   for (let y = 0; y < img.height; y += 5) {
//     for (let x = 0; x < img.width; x += 5) {
//       let idx = (x + y * img.width) * 4;
//       let brightness = img.pixels[idx]; // R, G, and B are equal in grayscale
//       let maxBrightness = 80
//
//       if (x % 2 === 0 && y % 2 === 0) {
//         if (brightness <= maxBrightness) {
//           circle(
//             map(x, 0, img.width, -width / 2, width / 2),
//             map(y, 0, img.height, -height / 2, height / 2),
//             map(brightness, 0, maxBrightness, 1, 31) 
//           );
//         }
//       }
//     }
//   }
// }
//
