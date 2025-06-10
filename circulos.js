class Circulo {

  constructor(x, y, id) {
    // propiedades para el circulo visual
    this.id = id;
    this.color = [0, 0, 0];
    this.colores = [
      [255, 61, 90],
      [255, 109, 31],
      [255, 183, 0],
      [0, 179, 170],
      [74, 0, 179],
      [209, 3, 99],
      [26, 93, 26]
    ];
    this.desordena_array(this.colores);
    this.posicion = createVector(x, y);
    this.masa = this.radio;
    this.velocidad = p5.Vector.random2D();
    this.velocidad.mult(random(0.2, 1));
    this.aceleracion = createVector(0, 0);
    this.circulos_internos = random() > 0.995 ? true : false;
    // this.circulos_internos_colores = this.desordena_array(this.colores);
    this.radio = this.circulos_internos ? floor(random(15, 30)) : floor(random(5,30));

    // cuando hay una cara
    this.posicion_en_cara = createVector(0, 0);
    this.radio_en_cara = null;
    // this.direccion_hacia_posicion_en_cara = createVector(0, 0);
    this.distancia_arribado = 3; // a partir de cuando consideramos arribado.
    this.posicion_final_en_cara = false;
    this.velocidad_maxima = 0.85; // vel maxima cuando hay destino
    this.fuerza_maxima = 1 // fuerza para aplicar en seek
    this.direccion_hacia_posicion_en_cara = createVector(0, 0);
    // this.direccionar = createVector(0, 0);
  }

  update() {
    if (!(this.posicion_en_cara.x === 0 && this.posicion_en_cara.y === 0)) {
      this.direccion_hacia_posicion_en_cara = p5.Vector.sub(this.posicion_en_cara, this.posicion)
      let distancia = this.direccion_hacia_posicion_en_cara.mag();
      if (distancia < this.distancia_arribado) { // llegó a destino
        this.velocidad.mult(0);
        this.aceleracion.mult(0);
        this.posicion_en_cara.set(0, 0);
      } else {
        this.radio = this.cambia_radio(this.radio, this.radio_en_cara)
        this.direccion_hacia_posicion_en_cara.normalize();
        this.direccion_hacia_posicion_en_cara.mult(this.fuerza_maxima);
        this.aceleracion.add(this.direccion_hacia_posicion_en_cara);
        this.velocidad.add(this.aceleracion);
        this.velocidad.limit(this.velocidad_maxima);
        this.posicion.add(this.velocidad);
        this.aceleracion.mult(0);
      }
    } else {
      this.velocidad.add(this.aceleracion);
      this.posicion.add(this.velocidad);
      this.rebota_borde();
    }
    if(random() > 0.9999) this.cambia_color();
  }

  cambia_radio(r, r_d) {
    let paso = 0.05;
    if (r == r_d) return r;
    else if (r < r_d) {
      r += paso;  // Move B toward A
      r = min(r, r_d);  // Clamp to avoid overshooting
    } 
    else if (r > r_d) {
      r -= paso;  // Move B toward A
      r = max(r, r_d);  // Clamp to avoid undershooting
    }
    return r;
  }

  reset() {
    this.posicion_en_cara.set(0, 0);
    this.circulos_internos = random() > 0.995 ? true : false;
    this.radio = this.circulos_internos ? floor(random(15, 30)) : floor(random(5,30));
    this.radio_en_cara = null;
    this.velocidad.set(random(-1.5,1.5), random(-1.5,1.5));
    this.velocidad.mult(random(0.2, 1));
  }

  show() {
    stroke(0);
    strokeWeight(2.5);
    circle(this.posicion.x, this.posicion.y, this.radio * 2);
    if(this.circulos_internos) this.circulos_internos_tres();
  }

  setea_destino_cara(c = {x:0, y:0, radio:0}) {
    this.radio_en_cara = c.radio;
    this.posicion_en_cara.set(c.x, c.y);
    this.posicion_final_en_cara = false;
  }

  rebota_borde() {
    // limites horizontales
    if( this.posicion.x >= width - this.radio
      || this.posicion.x <= 0 + this.radio) {
      this.velocidad.x *= -1;
      this.posicion.x = constrain(this.posicion.x, this.radio, width - this.radio);
    }
    // limites verticales
    if( this.posicion.y >= height - this.radio 
      || this.posicion.y <= 0 + this.radio) {
      this.velocidad.y *=-1;
      this.posicion.y = constrain(this.posicion.y, this.radio, height - this.radio);
    }
  }

  obtener_limites() {
    return {
      x: this.posicion.x - this.radio,
      y: this.posicion.y - this.radio,
      width: this.radio * 2,
      height: this.radio * 2,
      ref: this
    }
  }

  colisiona_con_otro(otro) {
    let deltaX = this.posicion.x - otro.posicion.x;
    let deltaY = this.posicion.y - otro.posicion.y;
    let cuadrados_distancia = deltaX * deltaX + deltaY * deltaY;
    let suma_radios = this.radio + otro.radio + 2;

    return cuadrados_distancia < suma_radios * suma_radios;
  }

  cambia_color() {
    let ids = [99, 199, 299];
    let colores = this.colores.concat([0,0,0]);
    if(ids.includes(this.id)) this.color = random(colores);
  }

  circulos_internos_tres() {
    stroke(this.colores[0]);
    circle(this.posicion.x, this.posicion.y, this.radio * 2);
    stroke(this.colores[1]);
    circle(this.posicion.x, this.posicion.y, this.radio * 1.5);
    stroke(this.colores[2]);
    circle(this.posicion.x, this.posicion.y, this.radio);
    stroke(this.colores[3]);
    circle(this.posicion.x, this.posicion.y, this.radio * 0.5);
    stroke(0);
  }

  desordena_array(array) {
    let currentIndex = array.length;
    // While there remain elements to shuffle...
    while (currentIndex != 0) {

      // Pick a remaining element...
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  }
}



class CaraDeCirculos {
  constructor(img, brillo_maximo = 155, espaciado = 1, radio_maximo = 20) {
    this.img = img;
    this.brillo_maximo = brillo_maximo;
    this.radio_maximo = radio_maximo;
    this.espaciado = espaciado;
    this.circulos = []; // Stores {x, y, diameter}
  }

  procesa_imagen() {
    this.img.loadPixels();
    this.circulos = []; // borra datos previos.

    for (let y = 0; y < this.img.height; y += this.espaciado) {
      for (let x = 0; x < this.img.width; x += this.espaciado) {
        let idx = (x + y * this.img.width) * 4;
        let brillo = this.img.pixels[idx]; 

        if (brillo <= this.brillo_maximo) {
            const radio = floor(map(brillo , 0, this.brillo_maximo, 5, this.radio_maximo));
            this.circulos.push({ x: x, y: y, radio });
        }
      }
    }
    return this.reduce_array(this.circulos, 300);
  }

  reduce_array(array_original, nuevo_largo) {
    if (nuevo_largo >= array_original.length) return array_original; // No downsample needed
    if (nuevo_largo <= 0) return [];

    const paso = (array_original.length - 1) / (nuevo_largo - 1);
    const reducido = [];

    for (let i = 0; i < nuevo_largo; i++) {
      const index = Math.round(i * paso); // Nearest index to sample
      reducido.push(array_original[index]);
    }
    return reducido;
  }


}
