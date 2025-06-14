import os
import cv2
import time
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision


class CarasWebcam:

    def __init__(self, nro_camara=0, debug=False):
        # inicializa la webcam
        self.webcam = cv2.VideoCapture(nro_camara)

        if not self.webcam.isOpened():
            raise ValueError('error al abrir la webcam')

        # inicializa el faceDetector
        detector_opciones_base = python.BaseOptions(
            model_asset_path='assets/detector.tflite')
        detector_opciones = vision.FaceDetectorOptions(
            base_options=detector_opciones_base)
        self.detector = vision.FaceDetector.create_from_options(
            detector_opciones)

        # selfieSegmentator
        segmentador_opciones_base = python.BaseOptions(
            model_asset_path='assets/selfie_multiclass.tflite')
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
        for i in range(30):  # tiro unas fotos hasta estabilizar la exposicion
            self.webcam.read()
            time.sleep(0.1)

        exito, foto = self.webcam.read()
        self.webcam.release()

        if not exito:
            raise RuntimeError("error al obtener un cuadro de la webcam")

        self.foto = foto  # cuadro de la webcam puro

    def hay_cara_en_la_foto(self, imagen):  # true si hay caras false si no
        # convierte la imagen de BGR de la webcam a opencv RGB
        imagen_rgb = cv2.cvtColor(imagen, cv2.COLOR_BGR2RGB)
        # convierte la imagen de RGB a MediaPipe RGB
        imagen_rgb_mp = mp.Image(
            image_format=mp.ImageFormat.SRGB, data=imagen_rgb)
        resultado = self.detector.detect(imagen_rgb_mp)

        return True if resultado.detections else False

    def recorta_cara(self, imagen):
        # convierte la imagen de BGR de la webcam a opencv RGB
        imagen_rgb = cv2.cvtColor(imagen, cv2.COLOR_BGR2RGB)
        # convierte la imagen de RGB a MediaPipe RGB
        imagen_rgb_mp = mp.Image(
            image_format=mp.ImageFormat.SRGB, data=imagen_rgb)
        resultado_segmentador_selfie = self.segmentador.segment(
            imagen_rgb_mp)
        # mascara_categorias = resultado_segmentador_selfie.category_mask
        mascara_confianza = resultado_segmentador_selfie.confidence_masks

        data_interna_imagen = imagen_rgb_mp.numpy_view()
        imagen_en_blanco = np.zeros(data_interna_imagen.shape, dtype=np.uint8)
        imagen_en_blanco[:] = (255, 255, 255)

        piel_cara = np.stack(
            (mascara_confianza[3].numpy_view(),) * 3, axis=-1) > 0.3
        cabello = np.stack(
            (mascara_confianza[1].numpy_view(),) * 3, axis=-1) > 0.3
        piel_cara_cabello = np.logical_or(piel_cara, cabello)

        # guardo este self para tener para calcular el brillo promedio
        self.pixels_cara = piel_cara_cabello

        # encuentro los pixels extremos de la foto
        pixels = piel_cara_cabello[:, :, 0]
        y, x = np.where(pixels)

        alto, ancho = imagen.shape[:2]
        x1 = max(0, np.min(x))
        y1 = max(0, np.min(y))
        x2 = min(ancho, np.max(x))
        y2 = min(alto, np.max(y))

        # mete la cara en el canvas blanco
        cara = np.where(
            piel_cara_cabello, data_interna_imagen, imagen_en_blanco)
        return cara[y1:y2, x1:x2]

    def proceso_calcula_brillo(self, imagen):
        # calculo brillo de la cara
        mascara = self.pixels_cara[:, :, 0]
        pixeles_cara = imagen[mascara]
        return np.mean(pixeles_cara)


    def proceso_byn(self, imagen):
        return cv2.cvtColor(imagen, cv2.COLOR_BGR2GRAY)

    def proceso_normaliza(self, imagen):
        return cv2.normalize(
            imagen,        # tiene que se una imagen b_y_n
            None,          # No mask
            alpha=0,       # Minimum value (0)
            beta=255,      # Maximum value (255)
            norm_type=cv2.NORM_MINMAX  # Min-max scaling
        )

    def proceso_sharpen(self, imagen):
        blurred = cv2.GaussianBlur(imagen, (0, 0), sigmaX=3.0)
        bordes = cv2.subtract(blurred, imagen)
        return cv2.addWeighted(imagen, 1.5, bordes, 0.7, 0)
        # self.sharpeneada2 = self.normalizada + 1.5 * self.bordes  # Adjust weight (1.5) for stronger effect

    def proceso_clahe(self, imagen):
        clahe = cv2.createCLAHE(clipLimit=8.0, tileGridSize=(8, 8))
        return clahe.apply(imagen)

    def imagen_final(self, imagen):
        ancho_lienzo, alto_lienzo = 1343, 744
        # tamaño de la cara
        nuevo_alto_cara = int(alto_lienzo * 0.9)  # 90% of canvas height
        # Resize manteniendo el aspect ratio
        h, w = imagen.shape[:2]
        aspect_ratio = w / h
        nuevo_ancho = int(nuevo_alto_cara * aspect_ratio)
        nuevo_tamanio = cv2.resize(imagen,
                                   (nuevo_ancho, nuevo_alto_cara),
                                   interpolation=cv2.INTER_AREA)
        # crea un canvas en blanco
        canvas = np.ones((alto_lienzo, ancho_lienzo), dtype=np.uint8) * 255
        # angulo arriba - izquierda para centrar la imagen
        x_offset = (ancho_lienzo - nuevo_ancho) // 2
        y_offset = (alto_lienzo - nuevo_alto_cara) // 2
        # pone la imagen en el centro
        canvas[y_offset:y_offset + nuevo_alto_cara,
               x_offset:x_offset + nuevo_ancho] = nuevo_tamanio
        return canvas

    # def procesos(self):
    #     self.proceso_byn()
    #     self.proceso_normaliza()
    #     self.proceso_sharpen()
    #     pass


webcam = CarasWebcam()
webcam.saca_foto()
if webcam.hay_cara_en_la_foto(webcam.foto):
    cara_recortada = webcam.recorta_cara(webcam.foto)
    b_y_n = webcam.proceso_byn(cara_recortada)

    sharpen = webcam.proceso_sharpen(b_y_n)
    normalizada_desde_byn = webcam.proceso_normaliza(b_y_n)

    normalizada_desde_sharpen = webcam.proceso_normaliza(sharpen)

    clahe = webcam.proceso_clahe(normalizada_desde_sharpen)
    webcam.guarda_imagen(webcam.imagen_final(clahe), "cara.jpg")

    # webcam.guarda_imagen(webcam.imagen_final(b_y_n), "byn.jpg")
    # webcam.guarda_imagen(webcam.imagen_final(sharpen), "sharp.jpg")
    # webcam.guarda_imagen(webcam.imagen_final(normalizada_desde_sharpen), "normS.jpg")
    # webcam.guarda_imagen(webcam.imagen_final(normalizada_desde_byn), "normBYN.jpg")
else:
    file = "cara.jpg"
    try:
        os.remove(file)
        print(f"cara borrada {file}")
    except FileNotFoundError:
        print(f"cara no encontrada {file}")
    except PermissionError:
        print(f"error de permisos: {file}")
    except Exception as e:
        print(f"error indefinido al borrar: {e}")

#
# webcam.procesos()
#
# webcam.guarda_imagen(webcam.foto, "webcam.jpg")
# webcam.guarda_imagen(webcam.cara_recortada, "cara_recortada.jpg")
# webcam.guarda_imagen(webcam.normalizada, "norm.jpg")
# webcam.guarda_imagen(webcam.blurred, "blurred.jpg")
# webcam.guarda_imagen(webcam.bordes, "bordes.jpg")
# webcam.guarda_imagen(webcam.sharpeneada, "sharp.jpg")
# webcam.guarda_imagen(webcam.sharpeneada2, "sharp2.jpg")
# webcam.guarda_imagen(webcam.imagen_final(), "cara.jpg")
# print(webcam.brillo)
