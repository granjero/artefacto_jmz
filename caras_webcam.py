import cv2
import time
import numpy as np
import mediapipe as mp
from mediapipe.tasks import pyhton
from mediapipe.tasks.python import vision


class CarasWebcam:

    def __init__(self, nro_camara = 0, debug = false):
        self.webcam = cv2.VideoCapture(nro_camara)

        if not self.webcam.isOpened():
            raise ValueError("error al abrir la webcam")

        # faceDetector
        detector_opciones_base = python.BaseOptions(model_asset_path='detector.tflite')
        detector_opciones = vision.FaceDetectorOptions(base_options=detector_opciones_base)
        self.detector = vision.FaceDetector.create_from_options(detector_opciones)

        # selfieSegmentator
        segmentador_opciones_base = python.BaseOptions(model_asset_path='selfie_multiclass.tflite')
        segmentador_opciones = vision.ImageSegmenterOptions(
            base_options=segmentador_opciones_base,
            output_category_mask=True,
            output_confidence_masks=True,
            running_mode=vision.RunningMode.IMAGE
        )
        self.segmentador = vision.ImageSegmenter.create_from_options(segmentador_opciones)


    def obtiene_cuadro(self):
        exito, cuadro = self.webcam.read()
        self.webcam.relese()

        if not exito:
            raise RuntimeError("error al obtener un cuadro de la webcam")

        self.cuadro = cuadro


    def busca_cara_en_cuadro(self): # true si hay caras false si no
        # convierte la imagen de BGR opencv RGB
        imagen_rgb = cv2.cvtColor(self.cuadro, cv2.COLOR_BGR2RGB)
        # convierte la imagen de RGB a MediaPipe RGB
        self.imagen_rgb_mp = mp.Image(image_format=mp.ImageFormat.SRGB,
                                 data=imagen_rgb)
        resultado = self.detector.detect(self.imagen_rgb_mp)

        if resultado.detections :
            return True
        else:
            return False

    def extrae_cara_de_cuadro(self):

        
