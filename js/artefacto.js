let cantidad_de_circulos = 300;
let circulos = [];
let cara_de_circulos = [];

let leer_cara = true;
let leer_cara_start_time = 0;
let cara_duracion = 1 * 60 * 1000; // 1 minutos
let tiempo_buscar_nueva_cara = 15 * 1000; // 15 segundos 
let chequear_colisiones = true;
let reset = false;
let esperando_reset = false;
let quadtree;

function setup() {
  createCanvas(1343, 744, P2D);
  quadtree = new Quadtree({x: 0, y: 0, width: width, height: height });
  for (let i = 0; i < cantidad_de_circulos; i++) {
    let x = floor(random(width));
    let y = floor(random(height));
    circulos.push(new Circulo(x, y, i));
  }
}

function draw() {
  background(240);


  if(chequear_colisiones) {
    quadtree.clear(); // limpia el quadtree

    for (let circulo of circulos) { // rellena el quadtree
      quadtree.insert(circulo.obtener_limites());
    }
    // chequea colisiones
    for (let circulo of circulos) {
      let candidatos = quadtree.retrieve(circulo.obtener_limites());
      // saca un circulo de candidatos.
      for (let c of candidatos) {
        let otro = c.ref;
        if (otro !== circulo && otro.colisiona_con_otro(circulo)) {

          let distancia = p5.Vector.dist(circulo.posicion, otro.posicion);
          // TODO aura de repulsion a los que tienen circulos internos
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
  }

  if(leer_cara) {
    leer_cara = false;
    leer_cara_start_time = millis();
    loadImage('../cara.jpg?' + random(), 
      (imagen_cara) => {
        img = imagen_cara;
        cara_de_circulos = new CaraDeCirculos(img, 80);
        cara_de_circulos = cara_de_circulos.procesa_imagen();

        for (let circulo of circulos) {
          circulo.setea_destino_cara(cara_de_circulos[circulo.id]);
        }
      chequear_colisiones = false;
      esperando_reset = true;
      tiempo_buscar_nueva_cara = 1 * 60 * 1000;
      },
      (errorEvent) => {
        console.log(errorEvent);
        leer_cara = false;
        tiempo_buscar_nueva_cara = 15 * 1000;
      }
    );
  }

  // resetea los circulos luego de una cara exitosa
  if (reset) {
    reset = false;
    chequear_colisiones = true;
    for (let circulo of circulos) {
      circulo.reset();
    }
  }
  // actualiza los circulos y los muestra
  for (let circulo of circulos) {
    circulo.update();
    circulo.show();
  }

  if (esperando_reset && millis() - leer_cara_start_time >= tiempo_buscar_nueva_cara) {
    reset = true; 
    esperando_reset = false;
  }
  if (millis() - leer_cara_start_time >= tiempo_buscar_nueva_cara) {
    leer_cara = true; 
  }
}
