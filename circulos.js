class Circulo {

  constructor(x, y, id) {
    this.posicion = createVector(x, y);
    this.velocidad = p5.Vector.random2D();
    this.velocidad.mult(random(0.5, 2));
    this.acceleracion = createVector(0, 0);
    this.radio =  random(5, 40);
    this.masa = this.radio * 2;
    this.id = id;
    this.color = random(colores);
  }

  update() {
    this.velocidad.add(this.acceleracion);
    this.posicion.add(this.velocidad);
    this.acceleracion.mult(0);
  }

  show() {
    // stroke(this.color);
    stroke(0);
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
