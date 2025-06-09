let circulos = [];
let cantidad_de_circulos = 300;

let quadtree;

function setup() {
  createCanvas(1366, 768, P2D);
  quadtree = new Quadtree({x: 0, y: 0, width: width, height: height });
  for (let i = 0; i < cantidad_de_circulos; i++) {
    let x = floor(random(width));
    let y = floor(random(height));
    circulos.push(new Circulo(x, y, i));
  }

}

function draw() {
  background(240);
  quadtree.clear(); // limpia el quadtree

  for (let circulo of circulos) { // rellena el quadtree
    quadtree.insert(circulo.obtener_limites());
  }
  // chequea colisiones
  for (let circulo of circulos) {
    let candidatos = quadtree.retrieve(circulo.obtener_limites());

    for (let c of candidatos) {
      let otro = c.ref;
      if (otro !== circulo && circulo.colisiona_con_otro(otro)) {

        let distancia = p5.Vector.dist(circulo.posicion, otro.posicion);
        let suma_radios = circulo.radio + otro.radio + 2;

        if( distancia < suma_radios ) {
          let direccion = p5.Vector.sub(otro.posicion, circulo.posicion);
          direccion.normalize();
          let solapa = suma_radios - distancia;
          circulo.posicion.sub(p5.Vector.mult(direccion, solapa/2));
          otro.posicion.add(p5.Vector.mult(direccion, solapa/2));
        }

        let velocidad_temp = circulo.velocidad.copy();
        circulo.velocidad = otro.velocidad.copy();
        otro.velocidad = velocidad_temp;
      }
    }
  }
  // actualiza los circulos y los muestra
  for (let circulo of circulos) {
    circulo.update();
    circulo.show();
  }
}
