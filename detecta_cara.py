import cv2
import datetime
import mediapipe as mp
import numpy as np

mp_cara = mp.solutions.face_detection
mp_segmentacion = mp.solutions.selfie_segmentation

#inicializa opencv
cara = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

captura = cv2.VideoCapture(0)

if not captura.isOpened():
    print("error con la camara")
    exit()

# recupera un cuadro de la webcam
ret, cuadro = captura.read()

if not ret:
    print("error en la captura")
    captura.release()
    exit()
# rgb para mediapipe
rgb = cv2.cvtColor(cuadro, cv2.COLOR_BGR2RGB)

with mp_segmentacion.SelfieSegmentation(model_selection=1) as segmentador:
    resultados = segmentador.process(rgb)
    mascara = resultados.segmentation_mask
    condicion = mascara > 0.5
    fondo_blanco = np.ones_like(cuadro, dtype=np.uint8) * 255
    cara = np.where(condicion[..., None], cuadro, fondo_blanco)
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    archivo = f"caras/cara_{timestamp}.jpg"
    cv2.imwrite(archivo, cara)
    #  grises para imagen final
    grises = cv2.cvtColor(cara, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    contraste = clahe.apply(grises)
    limite = 150
    limitada = contraste.copy()
    limitada[limitada > limite] = 255
    archivo = f"caras/cara_limitado{timestamp}.jpg"
    cv2.imwrite(archivo, limitada)
    tonos = 10
    niveles = np.linspace(0, 255, tonos, dtype=np.uint8)
    cuantificado = np.zeros_like(limitada)
    for i in range(tonos) :
        bajo = niveles[i]
        alto = niveles[i+1] if i < tonos - 1 else 255
        mascara = (grises >= bajo) & (grises <= alto)
        cuantificado[mascara] = niveles[i]

    archivo = f"caras/cara_cuantificado_{timestamp}.jpg"
    cv2.imwrite(archivo, cuantificado)


    print(f"Face detected! cuadro saved as: {archivo}")
"""
# pasa a grises (Haar cascades funcionan mejor)
grises = cv2.cvtColor(cuadro, cv2.COLOR_BGR2GRAY)

# detecta caras 
caras = cara.detectMultiScale(grises, scaleFactor=1.1, minNeighbors=5)

# detecta por lo menos una cara
if len(caras) > 0 :
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    archivo = f"caras/cara_{timestamp}.jpg"
    cv2.imwrite(archivo, grises)
    print(f"Face detected! cuadro saved as: {archivo}")
else : 
    print("No face detected.")

for i, (x,y,w,h) in enumerate(caras) :
    recorte = cuadro[y-50:y+h+20, x-20:x+w+20]
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    archivo = f"caras/cara_recortada_{timestamp}_{i}.jpg"
    cv2.imwrite(archivo, recorte)
"""
# Release the webcam
captura.release()
cv2.destroyAllWindows()

