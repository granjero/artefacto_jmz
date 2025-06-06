class Cara {

  recargaCara() {
    loadImage("webcam_frame_cara_gray.jpg?" + Date.now(), (archivo) => {
      imagenCara = archivo;
      lastLoadTime = millis();
    });
  }


  cara() {
    image(imagenCara, 0, 0)
  }
}



