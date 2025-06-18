let cantidad_de_circulos = 300; // circulos en pantalla
let circulos = []; // array con los circulos
let retrato = []; // array para el retrato

let chocando = true;
let mostrando_retrato = false;
let esperando_post_retrato = false;
let buscando_foto = true;
// let leer_cara = false;
// let reset = false;
let timestamp_archivo_leido = 0;
let timestamp_reset = 0;
let intervalo_mostrar_retrato = 1000 * 60 * 1;
let intervalo_entre_lectura_archivo = 1000 * 15;  // milisegundos * segundos = segundos
// let intervalo_reset = 1000 * 60 * 1; // milisegundos * 60 segundos * minutos = minutos
let intervalo_post_retrato = 1000 * 60 * 1; // milisegundos * 60 segundos * minutos = minutos

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

  if (chocando && buscando_foto) {
     chequea_colisiones(quadtree, circulos);

    if (tiempo_cumplido(timestamp_archivo_leido, intervalo_entre_lectura_archivo)) {
      timestamp_archivo_leido = millis();

      lee_imagen().then(
        (imagen) => {
          if (imagen) {
            console.log("cara.jpg leido OK");
            chocando = false;
            buscando_foto = false;
            mostrando_retrato = true;

            // hace un objeto retrato con los datos de la imagen
            retrato = new CaraDeCirculos(imagen, 80);
            retrato = retrato.procesa_imagen();
            // setea los destinos
            for (let circulo of circulos) {
              circulo.setea_destino_cara(retrato[circulo.id]);
            }
          } else {
            console.log("no hay cara.jpg para leer");
          }
        }
      );
    }
  }

  if (mostrando_retrato) {
    if (tiempo_cumplido(timestamp_archivo_leido, intervalo_mostrar_retrato)) {
      mostrando_retrato = false;
      buscando_foto = false;
      chocando = true;
      esperando_post_retrato = true;

      for (let circulo of circulos) {
        circulo.reset();
      }
      timestamp_reset = millis();
    }

  }

  if (chocando && esperando_post_retrato) {
    chequea_colisiones(quadtree, circulos);
    if (tiempo_cumplido(timestamp_reset, intervalo_post_retrato)) {
      buscando_foto = true;
      esperando_post_retrato = false;
      mostrando_retrato = false;
    }
  }
}

function tiempo_cumplido(tiempo_inicio, intervalo) {
  return (millis() - tiempo_inicio >= intervalo)
}

function lee_imagen() {
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
