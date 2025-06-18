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
    pegajosea(quadtree, circulos);
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

// function chequea_colisiones(quadtree, circulos) {
//     quadtree.clear();
//     // rellena el quadtree
//     for (let circulo of circulos) { 
//       quadtree.insert(circulo.obtener_limites());
//     }
//     // chequea colisiones
//     for (let circulo of circulos) {
//       let candidatos = quadtree.retrieve(circulo.obtener_limites());
//
//       let cx = circulo.posicion.x;
//       let cy = circulo.posicion.y;
//       let cr = circulo.radio;
//       let cm = circulo.masa || (cr * cr); // default mass
//
//       for (let c of candidatos) {
//         let otro = c.ref;
//         if (otro === circulo) continue;
//
//         let ox = otro.posicion.x;
//         let oy = otro.posicion.y;
//         let or = otro.radio;
//         let om = otro.masa || (or * or); // default mass
//
//         let dx = ox - cx;
//         let dy = oy - cy;
//         let dist2 = dx * dx + dy * dy;
//
//         let suma_radios = cr + or + 2;
//         if (dist2 >= suma_radios * suma_radios) continue;
//
//         // √ Only here, and once
//         let dist = Math.sqrt(dist2) || 0.0001;
//         let nx = dx / dist;
//         let ny = dy / dist;
//
//         // --- POSITION CORRECTION (anti-sticky) ---
//         let solapamiento = suma_radios - dist;
//         let totalMass = cm + om;
//
//         let separacion1 = (om / totalMass) * solapamiento;
//         let separacion2 = (cm / totalMass) * solapamiento;
//
//         circulo.posicion.x -= nx * separacion1;
//         circulo.posicion.y -= ny * separacion1;
//         otro.posicion.x += nx * separacion2;
//         otro.posicion.y += ny * separacion2;
//
//         // --- VELOCITY RESPONSE (Elastic Bounce) ---
//         let rvx = circulo.velocidad.x - otro.velocidad.x;
//         let rvy = circulo.velocidad.y - otro.velocidad.y;
//
//         // project relative velocity onto normal
//         let velAlongNormal = rvx * nx + rvy * ny;
//
//         // Still allow impulse even if velAlongNormal > 0
//         // to "unstick" bodies that are still touching
//         let restitution = 1.0; // 1 = fully elastic
//         let impulse = (-(1 + restitution) * velAlongNormal) / (1/cm + 1/om);
//
//         let impulseX = impulse * nx;
//         let impulseY = impulse * ny;
//
//         circulo.velocidad.x += impulseX / cm;
//         circulo.velocidad.y += impulseY / cm;
//         otro.velocidad.x -= impulseX / om;
//         otro.velocidad.y -= impulseY / om;
//       }
//   }
//
//
//
//
// }

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
                    let correction = normal.copy().mult(solapa * 0.5);
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
