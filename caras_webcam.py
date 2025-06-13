import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision


class CarasWebcam:

    def __init__(self, nro_camara=0, debug=False):
        self.webcam = cv2.VideoCapture(nro_camara)

        if not self.webcam.isOpened():
            raise ValueError("error al abrir la webcam")

        # faceDetector
        detector_opciones_base = python.BaseOptions(
            model_asset_path='detector.tflite')
        detector_opciones = vision.FaceDetectorOptions(
            base_options=detector_opciones_base)
        self.detector = vision.FaceDetector.create_from_options(
            detector_opciones)

        # selfieSegmentator
        segmentador_opciones_base = python.BaseOptions(
            model_asset_path='selfie_multiclass.tflite')
        segmentador_opciones = vision.ImageSegmenterOptions(
            base_options=segmentador_opciones_base,
            output_category_mask=True,
            output_confidence_masks=True,
            running_mode=vision.RunningMode.IMAGE
        )
        self.segmentador = vision.ImageSegmenter.create_from_options(
            segmentador_opciones)

    def guarda_imagen(self, imagen, nombre_archivo="sin_nombre.jpg"):
        cv2.imwrite(nombre_archivo, imagen)

    def saca_foto(self):
        exito, foto = self.webcam.read()
        self.webcam.release()

        if not exito:
            raise RuntimeError("error al obtener un cuadro de la webcam")

        self.foto = foto  # cuadro de la webcam puro

    def hay_cara_en_la_foto(self):  # true si hay caras false si no
        # convierte la imagen de BGR opencv RGB
        imagen_rgb = cv2.cvtColor(self.foto, cv2.COLOR_BGR2RGB)
        # convierte la imagen de RGB a MediaPipe RGB
        self.imagen_rgb_mp = mp.Image(
            image_format=mp.ImageFormat.SRGB, data=imagen_rgb)
        resultado = self.detector.detect(self.imagen_rgb_mp)

        if resultado.detections:
            return True
        else:
            return False

    def recorta_cara(self):
        resultado_segmentador_selfie = self.segmentador.segment(
            self.imagen_rgb_mp)
        # mascara_categorias = resultado_segmentador_selfie.category_mask
        mascara_confianza = resultado_segmentador_selfie.confidence_masks

        data_interna_imagen = self.imagen_rgb_mp.numpy_view()
        imagen_en_blanco = np.zeros(data_interna_imagen.shape, dtype=np.uint8)
        imagen_en_blanco[:] = (255, 255, 255)

        piel_cara = np.stack(
            (mascara_confianza[3].numpy_view(),) * 3, axis=-1) > 0.3
        cabello = np.stack(
            (mascara_confianza[1].numpy_view(),) * 3, axis=-1) > 0.3
        piel_cara_cabello = np.logical_or(piel_cara, cabello)

        # encuentro los pixels extremos de la foto
        pixels = piel_cara_cabello[:, :, 0]
        y, x = np.where(pixels)

        alto, ancho = self.foto.shape[:2]
        x1 = max(0, np.min(x))
        y1 = max(0, np.min(y))
        x2 = min(ancho, np.max(x))
        y2 = min(alto, np.max(y))

        cara = np.where(
            piel_cara_cabello, data_interna_imagen, imagen_en_blanco)
        self.cara_recortada = cara[y1:y2, x1:x2]

    def proceso_byn(self):
        self.blanco_y_negro = cv2.cvtColor(
            self.cara_recortada, cv2.COLOR_BGR2GRAY)

    def proceso_normaliza(self):
        self.normalizada = cv2.normalize(
            self.blanco_y_negro,
            None,          # No mask
            alpha=100,       # Minimum value (0)
            beta=255,      # Maximum value (255)
            norm_type=cv2.NORM_MINMAX  # Min-max scaling
        )

    def proceso_sharpen(self):
        self.blurred = cv2.GaussianBlur(self.normalizada, (0, 0), sigmaX=3.0)
        self.bordes = cv2.subtract(self.blurred, self.normalizada)
        self.sharpeneada = cv2.addWeighted(
            self.normalizada, 1.5, self.bordes, 0.7, 0)
        self.sharpeneada2 = self.normalizada + 1.5 * self.bordes  # Adjust weight (1.5) for stronger effect
        pass

    def procesos(self):
        self.proceso_byn()
        self.proceso_normaliza()
        self.proceso_sharpen()
        pass


webcam = CarasWebcam()
webcam.saca_foto()
if webcam.hay_cara_en_la_foto():
    webcam.recorta_cara()

webcam.procesos()

webcam.guarda_imagen(webcam.foto, "webcam.jpg")
webcam.guarda_imagen(webcam.cara_recortada, "cara_recortada.jpg")
webcam.guarda_imagen(webcam.normalizada, "norm.jpg")
webcam.guarda_imagen(webcam.blurred, "blurred.jpg")
webcam.guarda_imagen(webcam.bordes, "bordes.jpg")
webcam.guarda_imagen(webcam.sharpeneada, "sharp.jpg")
webcam.guarda_imagen(webcam.sharpeneada2, "sharp2.jpg")
