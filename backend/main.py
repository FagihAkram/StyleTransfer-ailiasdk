import sys
import time
import numpy as np
import cv2
import ailia
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from logging import getLogger
from io import BytesIO
from fastapi.middleware.cors import CORSMiddleware

sys.path.append('util/')
from arg_utils import get_base_parser, update_parser, get_savepath
from model_utils import check_and_download_models
from detector_utils import load_image
from webcamera_utils import get_capture, get_writer

logger = getLogger(__name__)

# Initialize FastAPI
app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================
# Parameters
# ======================

WEIGHT_PAPRIKA_PATH = 'generator_Paprika.onnx'
MODEL_PAPRIKA_PATH = 'generator_Paprika.onnx.prototxt'
WEIGHT_HAYAO_PATH = 'generator_Hayao.onnx'
MODEL_HAYAO_PATH = 'generator_Hayao.onnx.prototxt'
WEIGHT_SHINKAI_PATH = 'generator_Shinkai.onnx'
MODEL_SHINKAI_PATH = 'generator_Shinkai.onnx.prototxt'
WEIGHT_CELEBA_PATH = 'celeba_distill.onnx'
MODEL_CELEBA_PATH = 'celeba_distill.onnx.prototxt'
WEIGHT_FACE_PAINT_PATH = 'face_paint_512_v2.onnx'
MODEL_FACE_PAINT_PATH = 'face_paint_512_v2.onnx.prototxt'
REMOTE_PATH = 'https://storage.googleapis.com/ailia-models/animeganv2/'

IMAGE_HEIGHT = 512
IMAGE_WIDTH = 512

MODEL_DICT = {
    'paprika': (WEIGHT_PAPRIKA_PATH, MODEL_PAPRIKA_PATH),
    'hayao': (WEIGHT_HAYAO_PATH, MODEL_HAYAO_PATH),
    'shinkai': (WEIGHT_SHINKAI_PATH, MODEL_SHINKAI_PATH),
    'celeba': (WEIGHT_CELEBA_PATH, MODEL_CELEBA_PATH),
    'face_paint': (WEIGHT_FACE_PAINT_PATH, MODEL_FACE_PAINT_PATH),
}

# ======================
# Utility Functions
# ======================

def preprocess(img, x32=False, keep=False):
    h, w = (IMAGE_HEIGHT, IMAGE_WIDTH)
    im_h, im_w, _ = img.shape

    if x32:
        def to_32s(x):
            return 256 if x < 256 else x - x % 32

        oh, ow = to_32s(im_h), to_32s(im_w)
        img = cv2.resize(img, (ow, oh))
    elif keep:
        r = min(h / im_h, w / im_w)
        oh, ow = int(im_h * r), int(im_w * r)
        resized = cv2.resize(img, (ow, oh))
        img = np.zeros((h, w, 3), dtype=np.uint8)
        ph, pw = (h - oh) // 2, (w - ow) // 2
        img[ph: ph + oh, pw: pw + ow] = resized
    else:
        oh, ow = h, w
        img = cv2.resize(img, (ow, oh))

    img = img / 127.5 - 1
    img = img.transpose(2, 0, 1)  # HWC -> CHW
    img = np.expand_dims(img, axis=0)
    img = img.astype(np.float32)

    return img, (0, 0), (oh, ow)

def post_processing(img, im_hw, pad_hw, resized_hw):
    img = img.transpose(1, 2, 0)
    img = cv2.resize(img, (im_hw[1], im_hw[0]))
    img = np.clip(img, -1, 1)
    img = img * 127.5 + 127.5
    return img.astype(np.uint8)

def predict(net, img, onnx=False):
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    im_h, im_w = img.shape[:2]
    img, pad_hw, resized_hw = preprocess(img)
    output = net.run(None, {'input_image': img}) if onnx else net.predict([img])
    output = output[0]
    img = post_processing(output[0], (im_h, im_w), pad_hw, resized_hw)
    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    return img

def load_model(model_name, onnx=False):
    weight_path, model_path = MODEL_DICT[model_name]
    check_and_download_models(weight_path, model_path, REMOTE_PATH)
    if not onnx:
        memory_mode = ailia.get_memory_mode(
            reduce_constant=True, ignore_input_with_initializer=True,
            reduce_interstage=False, reuse_interstage=True)
        return ailia.Net(model_path, weight_path, memory_mode=memory_mode)
    import onnxruntime
    return onnxruntime.InferenceSession(weight_path)

# ======================
# FastAPI Endpoints
# ======================

@app.post("/predict/")
async def predict_image(file: UploadFile = File(...), model_name: str = Form(...)):
    content = await file.read()
    img_array = np.frombuffer(content, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    net = load_model(model_name)
    out_img = predict(net, img)

    _, buffer = cv2.imencode('.png', out_img)
    io_buf = BytesIO(buffer)

    return StreamingResponse(io_buf, media_type="image/png")
