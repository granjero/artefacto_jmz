class Circulo {

  constructor(x, y, id) {
    // propiedades para el circulo vidual
    this.id = id;
    this.posicion = createVector(x, y);
    this.radio =  floor(random(5, 30));
    this.masa = this.radio;
    this.velocidad = p5.Vector.random2D();
    this.velocidad.mult(random(0.2, 1));
    this.aceleracion = createVector(0, 0);

    this.radio_en_cara = null;
    this.color = [0, 0, 0];
    this.colores = [
      [0, 0, 0],
      [255, 61, 90],
      [255, 109, 31],
      [255, 183, 0],
      [0, 179, 170],
      [74, 0, 179]
    ];

    // cuando hay una cara
    this.posicion_en_cara = createVector(0, 0);
    // this.direccion_hacia_posicion_en_cara = createVector(0, 0);
    this.distancia_arribado = 3; // a partir de cuando consideramos arribado.
    this.velocidad_maxima = 0.5; // vel maxima cuando hay destino
    this.fuerza_maxima = 1 // fuerza para aplicar en seek
    this.direccion_hacia_posicion_en_cara = createVector(0, 0);
    // this.direccionar = createVector(0, 0);
  }

  update() {
    this.velocidad.add(this.aceleracion);
    this.posicion.add(this.velocidad);
    this.aceleracion.mult(0);
    this.rebota_borde();
    this.cambia_color();
  }

  show() {
    stroke(this.color);
    strokeWeight(2.5);
    circle(this.posicion.x, this.posicion.y, this.radio * 2);
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
    if(ids.includes(this.id) && random() > 0.9999 ) {
      this.color = random(this.colores);
    }
  }
}
