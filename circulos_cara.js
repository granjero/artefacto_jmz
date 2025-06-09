
class CirculosCara {
  constructor(img, maxBrightness = 125, espaciado = 1, maxRadio = 20) {
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
            const radio = floor(map(brightness, 0, this.maxBrightness, 5, this.maxRadio));
            this.circulos.push({ x: x, y: y, radio });
        }
      }
    }
    return this.circulos;
  }

}

