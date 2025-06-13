import cv2
import time
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

cv2.setLogLevel(0)

# inicializa la webcam
webcam = cv2.VideoCapture(0)

if not webcam.isOpened():  # chequeo
    print('error al abrir la webcam')
    exit()

success, webcam_frame = webcam.read()
webcam.release()
cv2.imwrite('webcam_frame.jpg', webcam_frame)

if not success:  # otro chequeo
    print('error al capturar')
    exit()

# obtiene imagen BGR de lo leido de la webcam
bgr_webcam_frame = cv2.cvtColor(webcam_frame, cv2.COLOR_BGR2RGB)
cv2.imwrite('webcam_frame_bgr.jpg', bgr_webcam_frame)
# transforma la imagen a mp format
mp_image_bgr = mp.Image(image_format=mp.ImageFormat.SRGB,
                        data=bgr_webcam_frame)
mp_image = mp.Image(image_format=mp.ImageFormat.SRGB,
                        data=webcam_frame)

# Create an FaceDetector object.
base_options_detector = python.BaseOptions(model_asset_path='detector.tflite')
options_detector = vision.FaceDetectorOptions(base_options=base_options_detector)
detector = vision.FaceDetector.create_from_options(options_detector)

# detecta cara
detection_result = detector.detect(mp_image_bgr)

if detection_result.detections == []:  # exit si no hay caras
    print('no se han detectado caras')
    exit()

print(detection_result.detections)

# Crea opciones para el segmentador de selfie de piel
base_options_multiclass = python.BaseOptions(
    model_asset_path='selfie_multiclass.tflite')

options_selfie_multiclass = vision.ImageSegmenterOptions(
    base_options=base_options_multiclass,
    output_category_mask=True,
    output_confidence_masks=True,
    running_mode=vision.RunningMode.IMAGE)

with vision.ImageSegmenter.create_from_options(
     options_selfie_multiclass) as multiclass:

    segmentation_result = multiclass.segment(mp_image_bgr)
    category_mask = segmentation_result.category_mask
    confidence_masks = segmentation_result.confidence_masks

    image_data = mp_image.numpy_view()
    white_image = np.zeros(image_data.shape, dtype=np.uint8)
    white_image[:] = (255, 255, 255)

    hair_mask = np.stack((confidence_masks[1].numpy_view(),) * 3, axis=-1) > 0.3
    face_skin_mask = np.stack((confidence_masks[3].numpy_view(),) * 3, axis=-1) > 0.3
    combined_masks = np.logical_or(face_skin_mask, hair_mask)

    # encuentro los pixels extremos de la foto 
    pixels = combined_masks[:, :, 0]
    y_coords, x_coords = np.where(pixels)

    padding = 10
    frame_height, frame_width = webcam_frame.shape[:2]
    x1 = max(0, np.min(x_coords) - padding)
    y1 = max(0, np.min(y_coords) - padding)
    x2 = min(frame_width, np.max(x_coords) + padding)
    y2 = min(frame_height, np.max(y_coords) + padding)

    imagen_final = np.where(combined_masks, image_data, white_image)
    cv2.imwrite('cara.jpg', imagen_final)

cara = imagen_final[y1:y2, x1:x2]

gray = cv2.cvtColor(cara, cv2.COLOR_RGB2GRAY)
# calcular el tileGridSize segun el tamaño de cara
clahe = cv2.createCLAHE(clipLimit=10.0, tileGridSize=(10, 12))

enhanced = clahe.apply(gray)

########################################
# codigo de gpt para imagen en canvas
########################################
# Target canvas size
canvas_width, canvas_height = 1366, 768
target_height = int(canvas_height * 0.9)  # 90% of canvas height

# Resize the enhanced image maintaining aspect ratio
h, w = enhanced.shape[:2]
aspect_ratio = w / h
resized_width = int(target_height * aspect_ratio)
resized_enhanced = cv2.resize(enhanced, (resized_width, target_height), interpolation=cv2.INTER_AREA)

# Create a white canvas
canvas = np.ones((canvas_height, canvas_width), dtype=np.uint8) * 255

# Compute top-left corner for centering
x_offset = (canvas_width - resized_width) // 2
y_offset = (canvas_height - target_height) // 2

# Place the resized image in the center of the canvas
canvas[y_offset:y_offset + target_height, x_offset:x_offset + resized_width] = resized_enhanced

# Save the final image
cv2.imwrite('cara.jpg', canvas)

