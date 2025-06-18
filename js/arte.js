let cantidad_de_circulos = 300; // circulos en pantalla
let circulos = []; // array con los circulos
let retrato = []; // array para el retrato

let chocando = true;
let mostrando_retrato_o_post_retrato = false;
let leer_cara = false;
let reset = false;
let cara_leida_timestamp = 0;
let reset_timestamp = 0;
let intervalo_entre_lectura_caras = 1000 * 15;  // milisegundos * segundos = segundos
let intervalo_reset = 1000 * 60 * 1; // milisegundos * segundos * minutos = minutos
let intervalo_post_reset = 1000 * 60 * 2; // milisegundos * segundos * minutos = minutos

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
  background(210);

  for (let circulo of circulos) {  // actualiza los circulos y los muestra
    circulo.update();
    circulo.show();
  }

  if (chocando) {
    chequea_colisiones(quadtree, circulos);
  } else {
    if (reset) {
      reset_timestamp = millis();
      console.log("reset");
      reset = false;
      for (let circulo of circulos) {
        circulo.reset();
      }
      chocando = true;
    }
  }


  if (leer_cara) {
    leer_cara = false;
    cara_leida_timestamp = millis();

    encuentra_cara().then(
      (imagen) => {
        if (imagen) {
          console.log("cara.jpg leido OK");
          chocando = false;
          mostrando_retrato_o_post_retrato = true;

          retrato = new CaraDeCirculos(imagen, 80);
          retrato = retrato.procesa_imagen();

          for (let circulo of circulos) {
            circulo.setea_destino_cara(retrato[circulo.id]);
          }
        } else {
          console.log("no hay cara.jpg para leer");
        }
      }
    );
  }

  // si pasa el tiempo despues de reset
  if (mostrando_retrato_o_post_retrato 
    && (millis() - reset_timestamp >= intervalo_post_reset)) {
    mostrando_retrato_o_post_retrato = false;
    console.log("pasó el tiempo POST reset");
  }

  // si pasa el tiempo para mostrar el retrato
  if (!chocando 
    && (millis() - cara_leida_timestamp >= intervalo_reset)) {
    reset = true;
    console.log("pasó el tiempo para reset");
  }

  // si pasa el tiempo para leer caras
  if (!mostrando_retrato_o_post_retrato 
    && (millis() - cara_leida_timestamp >= intervalo_entre_lectura_caras)) {
    leer_cara = true; 
    console.log("paso el tiempo para volver a leer cara");
  }
}

function encuentra_cara() {
  return new Promise((resolve) => {
    loadImage('../cara.jpg?' + random(), 
      (img) => resolve(img), // success
      (err) => resolve(false) // failure
    );
  });
}

function chequea_colisiones(quadtree, circulos) {
    quadtree.clear();
    // rellena el quadtree
    for (let circulo of circulos) { 
      quadtree.insert(circulo.obtener_limites());
    }
    // chequea colisiones
    for (let circulo of circulos) {
      let candidatos = quadtree.retrieve(circulo.obtener_limites());
      // saca un circulo de candidatos.
      for (let c of candidatos) {
        let otro = c.ref; // otro es un circulo
        if (otro !== circulo && otro.colisiona_con_otro(circulo)) {

          let distancia = p5.Vector.dist(circulo.posicion, otro.posicion);
          // TODO aura de repulsion a los que tienen circulos internos
          let suma_radios = circulo.radio + otro.radio + 2;
          // chequea solapamiento de circulos
          if( distancia < suma_radios ) {
            let direccion = p5.Vector.sub(otro.posicion, circulo.posicion);
            direccion.normalize();
            let solapa = suma_radios - distancia;
            circulo.posicion.sub(p5.Vector.mult(direccion, solapa/2));
            otro.posicion.add(p5.Vector.mult(direccion, solapa/2));
          }
          // invierte las velocidades
          let velocidad_temp = circulo.velocidad.copy();
          circulo.velocidad = otro.velocidad.copy();
          otro.velocidad = velocidad_temp;
        }
      }
    }
}
