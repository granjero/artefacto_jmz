let circulos = [];
let circulosCara = [];

let imagenCara = false;

let lastLoadTime = 0;
let loadInterval = 5000;

let leerCara = false;

function setup() {
 createCanvas(1366, 768);
  for (let i = 0; i < 310; i++) {
    let x = round(random(width));
    let y = round(random(height));
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




  if (leerCara) {
    leerCara = false; // prevent loading repeatedly
    loadImage('cara.jpg', (imagenCara) => {
      img = imagenCara;
      circulosCara = new CirculosCara(img);
      circulosCara = circulosCara.procesaImagen();


      if(circulos.length < circulosCara.length) {
        circulosCara = downsampleArray(circulosCara, circulos.length)
      // let faltantes = circulosCara.length - circulos.length;
      // console.log("resta: " + faltantes);
      //   for(let i = 300; i < 300 + faltantes; i++) {
      //     let x = round(random(width));
      //     let y = round(random(height));
      //     circulos.push(new Circulo(x, y, i));
      //   }
      }
      
    for (let circulo of circulos) {
      circulo.seteaDestino(circulosCara[circulo.id]);
    }

      
    });
  }
}

function downsampleArray(originalArray, targetLength) {
  if (targetLength >= originalArray.length) return originalArray; // No downsample needed
  if (targetLength <= 0) return [];

  const step = (originalArray.length - 1) / (targetLength - 1);
  const downsampled = [];

  for (let i = 0; i < targetLength; i++) {
    const index = Math.round(i * step); // Nearest index to sample
    downsampled.push(originalArray[index]);
  }

  return downsampled;
}
