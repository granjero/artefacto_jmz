let cantidad_de_circulos = 300; // circulos en pantalla
let circulos = []; // array con los circulos
let retrato = []; // array para el retrato
let cara_circulito = null;
let radio_cara_circulito = 0;

let chocando = true;
let buscando_foto = true;
let pegajoso = false;
let mostrando_retrato = false;
let esperando_post_retrato = false;

let timestamp_inicio = 0;
let timestamp_archivo_leido = 0;
let timestamp_reset = 0;
let timestamp_pegajoso = 0;

let intervalo_mostrar_retrato = 1000 * 60 * 7;  // milisegundos * 60 * minutos = minutos
let intervalo_entre_lectura_archivo = 1000 * 60 * 0.25;  // milisegundos * 60 * minutos = minutos 
let intervalo_post_retrato = 1000 * 60 * 1 ; // milisegundos * 60 * minutos = minutos 
let intervalo_pegajoso = 1000 * 60 * 0.5 ; // milisegundos * 60 * minutos = minutos 

function setup() {
  createCanvas(1343, 744, P2D);
  // noSmooth();
  smooth();
  tint(255, 100);
  timestamp_inicio = performance.now();
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
      timestamp_archivo_leido = performance.now();

      lee_imagen('../cara.jpg').then(
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

      lee_imagen('../cara_circulito.png').then(
        (imagen) => {
          if (imagen) {
            cara_circulito = imagen;
            radio_cara_circulito = imagen.width / 2;
            console.log("cara_circulito.png leido OK");
          } else {
            console.log("no hay cara_circulito.png para leer");
          }
        }
      );
    }
  }

  if (mostrando_retrato) {
    if (tiempo_cumplido(timestamp_archivo_leido, intervalo_mostrar_retrato)) {
      mostrando_retrato = false;
      buscando_foto = false;
      pegajoso = true;
      // resetea los circulos
      for (let circulo of circulos) {
        circulo.reset();
      }
      timestamp_reset = performance.now();
    }

  }

  if (pegajoso) {
    pegajosea(quadtree, circulos);
    if (tiempo_cumplido(timestamp_reset, intervalo_pegajoso)) {
      timestamp_pegajoso = performance.now();
      pegajoso = false;
      esperando_post_retrato = true;
    }
  }

  if (esperando_post_retrato) {
    chequea_colisiones(quadtree, circulos);
    if (tiempo_cumplido(timestamp_pegajoso, intervalo_post_retrato)) {
      buscando_foto = true;
      chocando = true;
      esperando_post_retrato = false;
      mostrando_retrato = false;
    }
  }

  if (!mostrando_retrato && cara_circulito) {
    let x = circulos[150].posicion.x - radio_cara_circulito;
    let y = circulos[150].posicion.y - radio_cara_circulito;

    image(cara_circulito, x, y);
  }

}

function tiempo_cumplido(tiempo_inicio, intervalo) {
  return (performance.now() - tiempo_inicio >= intervalo)
}

function lee_imagen(path) {
  return new Promise((resolve) => {
    loadImage(path + "?" + random(), 
      (img) => resolve(img), // success
      (err) => resolve(false) // failure
    );
  });
}

function chequea_colisiones(quadtree, circulos) {
    quadtree.clear();
    // Fill quadtree
    for (let circulo of circulos) {
        quadtree.insert(circulo.obtener_limites());
    }
    
    // Check collisions
    for (let circulo of circulos) {
        let candidatos = quadtree.retrieve(circulo.obtener_limites());
        
        for (let c of candidatos) {
            let otro = c.ref;
            if (otro !== circulo && otro.colisiona_con_otro(circulo)) {
                let distancia = p5.Vector.dist(circulo.posicion, otro.posicion);
                let suma_radios = circulo.radio + otro.radio + 2;
                
                if (distancia < suma_radios) {
                    // 1. Calculate collision normal (direction between centers)
                    let normal = p5.Vector.sub(otro.posicion, circulo.posicion);
                    normal.normalize();
                    
                    // 2. Separate the circles to prevent sticking
                    let solapa = suma_radios - distancia;
                    circulo.posicion.sub(p5.Vector.mult(normal, solapa/2));
                    otro.posicion.add(p5.Vector.mult(normal, solapa/2));
                    
                    // 3. Calculate relative velocity
                    let vel_relativa = p5.Vector.sub(otro.velocidad, circulo.velocidad);
                    let vel_along_normal = p5.Vector.dot(vel_relativa, normal);
                    
                    // Only resolve if objects are moving toward each other
                    if (vel_along_normal > 0) continue;
                    
                    // 4. Calculate impulse (bounce force)
                    let restitution = 0.999999; // Bounciness (0.0-1.0)
                    let j = -(1 + restitution) * vel_along_normal;
                    j /= (1/circulo.masa + 1/otro.masa);
                    
                    // 5. Apply impulse
                    let impulse = p5.Vector.mult(normal, j);
                    circulo.velocidad.sub(p5.Vector.mult(impulse, 1/circulo.masa));
                    otro.velocidad.add(p5.Vector.mult(impulse, 1/otro.masa));
                }
            }
        }
    }
}

function pegajosea(quadtree, circulos) {
    // Only update quadtree every N frames (adjust based on performance)
    if (frameCount % 2 === 0) {  // Update every other frame
        quadtree.clear();
        for (let circulo of circulos) {
            quadtree.insert(circulo.obtener_limites());
        }
    }

    for (let circulo of circulos) {
        let candidatos = quadtree.retrieve(circulo.obtener_limites());
        
        for (let c of candidatos) {
            let otro = c.ref;
            if (otro !== circulo && otro.colisiona_con_otro(circulo)) {
                let distancia = p5.Vector.dist(circulo.posicion, otro.posicion);
                let suma_radios = circulo.radio + otro.radio;
                
                if (distancia < suma_radios) {
                    // Calculate collision normal
                    let normal = p5.Vector.sub(otro.posicion, circulo.posicion);
                    normal.normalize();
                    
                    // Position correction (more subtle)
                    let solapa = suma_radios - distancia;
                    let correction = normal.copy().mult(solapa * 0.8);
                    circulo.posicion.sub(correction);
                    otro.posicion.add(correction);
                    
                    // More natural velocity exchange with momentum conservation
                    let velAlongNormal = p5.Vector.sub(circulo.velocidad, otro.velocidad).dot(normal);
                    
                    // Only resolve if objects are moving toward each other
                    if (velAlongNormal > 0) continue;
                    
                    // Calculate impulse scalar
                    let restitution = 1.05; // "Bounciness" factor
                    let j = -(1 + restitution) * velAlongNormal;
                    j /= 1/circulo.masa + 1/otro.masa;
                    
                    // Apply impulse
                    let impulse = normal.copy().mult(j);
                    circulo.velocidad.add(p5.Vector.mult(impulse, 1/circulo.masa));
                    otro.velocidad.sub(p5.Vector.mult(impulse, 1/otro.masa));
                }
            }
        }
    }
}
