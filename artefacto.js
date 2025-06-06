let circulos = [];

let imagenCara = false;

let lastLoadTime = 0;
let loadInterval = 5000;

const colores = [
  [255, 61, 90],  
  [255, 109, 31], 
  [255, 183, 0],  
  [0, 179, 170],  
  [74, 0, 179]    
];

function setup() {
 createCanvas(windowWidth - 20, windowHeight - 20 );
  for (let i = 0; i < 200; i++) {
    let x = random(width);
    let y = random(height);
    circulos.push(new Circulo(x, y, i));
  }

}

function draw() {
  background(245);

  for (let circulo of circulos) {
    circulo.seek();
    circulo.borde();
    circulo.update();
    circulo.show();
  }
  for (let i = 0; i < circulos.length; i++) {
    for (let j = i + 1; j < circulos.length; j++) {
      circulos[i].colisionar(circulos[j]);
    }
  }

  
//   if (millis() - lastLoadTime > loadInterval) {
//     lastLoadTime = millis();
//     console.log("log");
//     console.log(Date.now());
//
//     recargaCara();
//   }
// }
//
// function recargaCara() {
//     loadImage("webcam_frame_cara_gray.jpg?" + Date.now(), (archivo) => {
//       image(archivo, 0, 0);
//     });
  // 
// }
}
