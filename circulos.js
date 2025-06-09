class Circulo {

  constructor(x, y, id) {
    this.id = id; // borrarlo?
    this.posicion = createVector(x, y);
    this.velocidad = p5.Vector.random2D();
    this.velocidad.mult(random(0.1, 0.5));
    this.acceleracion = createVector(0, 0);
    this.radio =  floor(random(5, 30));
    this.masa = this.radio;
    // this.posicion_destino = null;
    this.posicion_destino = createVector(0, 0);
    this.direccion_posicion_destino = createVector(0, 0);
    this.radio_destino = null;
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
    this.maxVel = 0.5; // vel maxima cuando hay destino
    this.maxFuerza = 1 // fuerza para aplicar en seek
    this.direccionar = createVector(0, 0);
  }

  // seteaDestino(x, y, radio = 10) { //setDestino
  seteaDestino(circulo = { x: 0, y: 0, radio: 0 }) { //setDestino
    this.radio_destino = circulo.radio;
    this.posicion_destino.set(circulo.x, circulo.y)
  }

  arrivoDestino() {
    if (this.posicion_destino.x === 0 && this.posicion_destino.y === 0) return false;

    return p5.Vector.dist(this.posicion, this.posicion_destino) < this.radio_de_arribo;
  }

  detener() {
    this.velocidad.set(0, 0) 
    this.acceleracion.set(0, 0)
  }
  
  reset() {
    this.posicion_destino.set(0, 0);
    this.radio_destino = null;
    this.velocidad.set(random(-1,1), random(-1,1));
    this.velocidad.mult(random(0.1, 0.5));
    // this.radio =  floor(random(5, 40));
    // this.masa = this.radio * 2;
  }

  colorea() {
    if (random() < 0.9999) return;
    this.color = random(this.colores);
    // this.radio =  random(5, 40);
  }

  buscaDestino() {
    if (this.posicion_destino.x === 0 && this.posicion_destino.y === 0) return;
    if (this.arrivoDestino()) {
      this.detener();
      return;
    }
    this.velocidad = p5.Vector.sub(this.posicion_destino, this.posicion).setMag(this.maxVel);
  }

  // Steering behavior to move toward destino
  /*
  seek() {
    if ( this.posicion_destino.x === 0 
      && this.posicion_destino.y === 0 ) return;

    if ( this.arrivoDestino() ) return this.detener(); 

    this.radio = this.corrigeRadio(this.radio, this.radio_destino); 
    
    this.direccion_posicion_destino.set( this.posicion_destino.x - this.posicion.x, 
                                         this.posicion_destino.y - this.posicion.y);
    let d = this.direccion_posicion_destino.mag();
    
    // If we're close enough, arrive gently
    if (d < 200) {
      let m = map(d, 0, 10, 0, this.maxVel);
      this.direccion_posicion_destino.setMag(m);
    } else {
      this.direccion_posicion_destino.setMag(this.maxVel);
    }
    
    // Steering = direccion_posicion_destino minus Velocity
    this.direccionar.set(this.direccion_posicion_destino.x - this.velocidad.x,
                         this.direccion_posicion_destino.y - this.velocidad.y);
    this.direccionar.limit(this.maxFuerza);
    this.aplicaFuerza(this.direccionar);
  }
  */

  seek() {
  if (this.posicion_destino.x === 0 && this.posicion_destino.y === 0) return;
  
  // Calculate direction vector
  let dx = this.posicion_destino.x - this.posicion.x;
  let dy = this.posicion_destino.y - this.posicion.y;
  
  // Use squared distance to avoid square root
  let distSq = dx * dx + dy * dy;
  let arriboSq = this.radio_de_arribo * this.radio_de_arribo;
  
  if (distSq < arriboSq) {
    this.detener();
    return;
  }
  
  this.radio = this.corrigeRadio(this.radio, this.radio_destino);
  
  // Only calculate actual distance when needed
  let d = Math.sqrt(distSq); // Single square root calculation
  
  // Direct velocity calculation without multiple setMag() calls
  let targetSpeed = (d < 200) ? map(d, 0, 200, 0, this.maxVel) : this.maxVel;
  
  // Normalize and scale in one step
  if (d > 0) {
    let scale = targetSpeed / d;
    let desiredVelX = dx * scale;
    let desiredVelY = dy * scale;
    
    // Apply steering force directly
    let steerX = desiredVelX - this.velocidad.x;
    let steerY = desiredVelY - this.velocidad.y;
    
    // Limit steering force magnitude
    let steerMagSq = steerX * steerX + steerY * steerY;
    let maxForceSq = this.maxFuerza * this.maxFuerza;
    
    if (steerMagSq > maxForceSq) {
      let steerMag = Math.sqrt(steerMagSq);
      let scale = this.maxFuerza / steerMag;
      steerX *= scale;
      steerY *= scale;
    }
    
    // Apply force
    this.aplicaFuerza(createVector(steerX, steerY));
  }
}

  corrigeRadio(r, r_d) {
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
    if ( (this.posicion_destino.x !== 0 || this.posicion_destino.y !== 0 ) 
      || (otroCirculo.posicion_destino.x !== 0 || otroCirculo.posicion_destino.y !== 0) ) return;
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
