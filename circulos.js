class Circulo {

  constructor(x, y, id) {
    this.destino = null;
    this.radio_destino = null;
    this.posicion = createVector(x, y);
    this.velocidad = p5.Vector.random2D();
    this.velocidad.mult(random(0.5, 2));
    this.acceleracion = createVector(0, 0);
    this.radio =  random(5, 40);
    this.masa = this.radio * 2;
    this.id = id;
    this.color = [0, 0, 0];

    // Add destino properties
    this.arrivalRadius = 10; // How close we need to get to consider arrived
    this.maxSpeed = 3; // Maximum speed when moving to destino
    this.maxForce = 0.5; // Steering force limit
  }

  seteaDestino(x, y, radio = 10) { //setDestino
    this.radio_destino = radio;
    this.destino = createVector(x, y)
  }

  quitaDestino() {
    this.radio =  random(5, 40);
    this.destino = null;
  }

  arrivoDestino() {
    if (!this.destino) return false;
    return p5.Vector.dist(this.posicion, this.destino) < this.arrivalRadius;
  }

  detener() {
    this.velocidad.set(0, 0) 
    this.acceleracion.set(0, 0)
  }
  
  reset() {
    this.destino = null;
    this.velocidad = p5.Vector.random2D();
    this.velocidad.mult(random(0.5, 2));
    this.radio =  random(5, 40);
    this.masa = this.radio * 2;
  }

  buscaDestino() {
    if (!this.destino) return;
    if(this.arrivoDestino()) {
      this.detener();
      return;
    }
    this.velocidad = p5.Vector.sub(this.destino, this.posicion).setMag(this.maxSpeed);
  }

  // Steering behavior to move toward destino
  seek() {
    if (!this.destino) return;
    if(this.arrivoDestino()) {
      this.detener();
      return;
    }
    
    let deseo = p5.Vector.sub(this.destino, this.posicion);
    let d = deseo.mag();
    
    // If we're close enough, arrive gently
    if (d < 100) {
      let m = map(d, 0, 100, 0, this.maxSpeed);
      deseo.setMag(m);
    } else {
      deseo.setMag(this.maxSpeed);
    }
    
    // Steering = deseo minus Velocity
    let steer = p5.Vector.sub(deseo, this.velocidad);
    steer.limit(this.maxForce);
    this.aplicaFuerza(steer);
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

    // chocan?
    let distancia = p5.Vector.dist(this.posicion, otroCirculo.posicion);
    let sumaRadios = this.radio + otroCirculo.radio + 2;
    if (distancia > sumaRadios) return; // No collision

    // vector normal 
    let normal = p5.Vector.sub(otroCirculo.posicion, this.posicion);
    normal.normalize();

    // velocidad relativa
    let velocidadRelativa = p5.Vector.sub(otroCirculo.velocidad, this.velocidad);
    let velocidadAlongNormal = p5.Vector.dot(velocidadRelativa, normal);

    // retorna si se alejan
    if (velocidadAlongNormal > 0) return;

    // --- 5. Impulse calculation (with mass) ---
    let coeficienteDeRestitucion = 1.0; // 1.0 = choque perfecto
    let impulso = -(1 + coeficienteDeRestitucion) * velocidadAlongNormal;
    impulso /= (1 / this.masa) + (1 / otroCirculo.masa); // Mass-weighted

    // --- 6. Apply impulse ---
    let impulsoVector = p5.Vector.mult(normal, impulso);
    this.velocidad.sub(p5.Vector.div(impulsoVector, this.masa));
    otroCirculo.velocidad.add(p5.Vector.div(impulsoVector, otroCirculo.masa));

    // // --- 7. Fix overlap (optional but recommended) ---
    // let overlap = sumaRadios - distancia;
    // let correction = p5.Vector.mult(normal, overlap * 0.5);
    // this.posicion.sub(correction);
    // otroCirculo.posicion.add(correction);
  }
}
