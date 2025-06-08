class Circulo {

  constructor(x, y, id) {
    this.destino = null;
    this.radio_destino = null;
    this.posicion = createVector(x, y);
    this.velocidad = p5.Vector.random2D();
    this.velocidad.mult(random(0.3, 1));
    this.acceleracion = createVector(0, 0);
    this.radio =  floor(random(5, 30));
    this.masa = this.radio;
    this.id = id;
    this.color = [0, 0, 0];
    this.colores = [
      [0, 0, 0],
      [255, 61, 90],
      [255, 109, 31],
      [255, 183, 0],
      [0, 179, 170],
      [74, 0, 179]
    ];

    // Add destino properties
    this.radio_de_arribo = 3; // a partir de cuando consideramos arribado.
    this.maxVel = 1; // vel maxima cuando hay destino
    this.maxFuerza = 10; // fuerza para aplicar en seek
  }

  // seteaDestino(x, y, radio = 10) { //setDestino
  seteaDestino(circulo = { x: 0, y: 0, radio: 0 }) { //setDestino
    this.radio_destino = circulo.radio;
    this.destino = createVector(circulo.x, circulo.y)
  }

  arrivoDestino() {
    if (!this.destino) return false;
    return p5.Vector.dist(this.posicion, this.destino) < this.radio_de_arribo;
  }

  detener() {
    this.velocidad.set(0, 0) 
     this.acceleracion.set(0, 0)
  }
  
  reset() {
    this.destino = null;
    this.radio_destino = null;
    this.velocidad = p5.Vector.random2D();
    this.velocidad.mult(random(0.3, 1));
    // this.radio =  floor(random(5, 40));
    // this.masa = this.radio * 2;
  }

  colorea() {
    if(random() < 0.9999) return;
    this.color = random(this.colores);
    // this.radio =  random(5, 40);
  }

  buscaDestino() {
    if (!this.destino) return;
    if(this.arrivoDestino()) {
      this.detener();
      return;
    }
    this.velocidad = p5.Vector.sub(this.destino, this.posicion).setMag(this.maxVel);
  }

  // Steering behavior to move toward destino
  seek() {
    if (!this.destino) return;
    if(this.arrivoDestino()) {
      this.detener();
      return;
    }

   this.radio = this.corrigeRadio(this.radio, this.radio_destino); 
    
    let deseo = p5.Vector.sub(this.destino, this.posicion);
    let d = deseo.mag();
    
    // If we're close enough, arrive gently
    if (d < 100) {
      let m = map(d, 0, 100, 0, this.maxVel);
      deseo.setMag(m);
    } else {
      deseo.setMag(this.maxVel);
    }
    
    // Steering = deseo minus Velocity
    let steer = p5.Vector.sub(deseo, this.velocidad);
    steer.limit(this.maxFuerza);
    this.aplicaFuerza(steer);
  }

  corrigeRadio(r, r_d) {
    let paso = 0.05;
    if (r < r_d) {
      r += paso;  // Move B toward A
      r = min(r, r_d);  // Clamp to avoid overshooting
    } 
    else if (r > r_d) {
      r -= paso;  // Move B toward A
      r = max(r, r_d);  // Clamp to avoid undershooting
    }
    return r;
  }
  

  aplicaFuerza(fuerza) {
    let f = p5.Vector.div(fuerza, this.masa);
    this.acceleracion.add(f);
  }


  update() {
    this.velocidad.add(this.acceleracion);
    this.posicion.add(this.velocidad);
    this.acceleracion.mult(0);
  }

  show() {
    stroke(this.color);
    //stroke(0);
    strokeWeight(2.5);
    circle(this.posicion.x, this.posicion.y, this.radio * 2);
  }

  borde() {
    if (this.posicion.x > width - this.radio) {
      this.posicion.x = width - this.radio;
      this.velocidad.x *= -1;
    } else if (this.posicion.x < this.radio) {
      this.posicion.x = this.radio;
      this.velocidad.x *= -1;
    }

    if (this.posicion.y > height - this.radio) {
      this.posicion.y = height - this.radio;
      this.velocidad.y *= -1;
    } else if (this.posicion.y < this.radio) {
      this.posicion.y = this.radio;
      this.velocidad.y *= -1;
    }
  }

  colisionar(otroCirculo) {
    if (this.destino || otroCirculo.destino) return;
    // Check if circles are colliding
    let distancia = p5.Vector.dist(this.posicion, otroCirculo.posicion);
    let sumaRadios = this.radio + otroCirculo.radio + 2;
    
    if (distancia > sumaRadios) return; // No collision

    // Simplified collision response - just swap velocities
    let tempVel = this.velocidad.copy();
    this.velocidad = otroCirculo.velocidad.copy();
    otroCirculo.velocidad = tempVel;

    // Optional: Add slight separation to prevent sticking
    let direccion = p5.Vector.sub(otroCirculo.posicion, this.posicion);
    direccion.normalize();
    let overlap = sumaRadios - distancia;
    this.posicion.sub(p5.Vector.mult(direccion, overlap/2));
    otroCirculo.posicion.add(p5.Vector.mult(direccion, overlap/2));
  }

}
