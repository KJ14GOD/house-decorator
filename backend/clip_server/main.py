from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import io
from PIL import Image, ImageDraw, ImageFont
import torch
import clip
import numpy as np
from typing import List, Dict, Any
import uvicorn
import json
from datetime import datetime
import cv2
import colorsys
from ultralytics import YOLO
import os
from dotenv import load_dotenv
import requests
import time
import base64

load_dotenv()

app = FastAPI()

# Add CORS middleware to allow requests from your Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# will move this to cuda later 
device = "cpu"
model, preprocess = None, None

MESHY_API_KEY = os.getenv("MESHY_API_KEY")

def load_clip_model():
    """Load CLIP model once at startup"""
    global model, preprocess
    if model is None:
        print(f"Loading CLIP model on {device}...")
        model, preprocess = clip.load("ViT-B/32", device=device)
        print("CLIP model loaded successfully!")

@app.on_event("startup")
async def startup_event():
    """Load CLIP model when the server starts"""
    load_clip_model()

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}

def generate_3d_model_with_meshy(image: Image.Image) -> dict:
    """
    Generate 3D model data based on the room image using Meshy.ai API.
    """
    try:
        # Convert image to base64
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()

        headers = {
            "Authorization": f"Bearer {MESHY_API_KEY}"
        }
        payload = {
            "image_url": f"data:image/png;base64,{img_str}",
            "enable_original_uv": True,
        }
        response = requests.post("https://api.meshy.ai/v1/image-to-3d", headers=headers, json=payload)
        response.raise_for_status()
        task_id = response.json()["result"]

        # Poll for task completion
        while True:
            response = requests.get(f"https://api.meshy.ai/v1/image-to-3d/{task_id}", headers=headers)
            response.raise_for_status()
            data = response.json()
            if data["status"] == "SUCCEEDED":
                return {"model_url": data["model_url"]}
            elif data["status"] == "FAILED":
                raise Exception("Meshy.ai task failed")
            time.sleep(5)
            
    except Exception as e:
        print(f"Error generating 3D model with Meshy.ai: {str(e)}")
        return {"error": str(e)}

# Helper functions for color normalization
import colorsys

def normalize_color_brightness(rgb_tuple, min_lightness=0.85, min_saturation=0.75):
    """
    Takes an (R, G, B) tuple (0-255), converts to HLS, boosts lightness and saturation if needed, and returns hex string.
    """
    r, g, b = [x / 255.0 for x in rgb_tuple]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    # Boost lightness and saturation if too low
    l = max(l, min_lightness)
    s = max(s, min_saturation)
    r2, g2, b2 = colorsys.hls_to_rgb(h, l, s)
    return f"#{int(r2*255):02x}{int(g2*255):02x}{int(b2*255):02x}"

def extract_wall_color(img_array: np.ndarray) -> str:
    """Extract median color from the center region (main wall)"""
    height, width = img_array.shape[:2]
    h_start = int(height * 0.3)
    h_end = int(height * 0.7)
    w_start = int(width * 0.3)
    w_end = int(width * 0.7)
    center_pixels = img_array[h_start:h_end, w_start:w_end].reshape(-1, 3)
    median_color = np.median(center_pixels, axis=0).astype(int)
    return normalize_color_brightness(median_color)

def extract_floor_color(img_array: np.ndarray) -> str:
    """Extract median color from the bottom region (floor)"""
    height, width = img_array.shape[:2]
    h_start = int(height * 0.8)
    h_end = height
    w_start = int(width * 0.2)
    w_end = int(width * 0.8)
    floor_pixels = img_array[h_start:h_end, w_start:w_end].reshape(-1, 3)
    median_color = np.median(floor_pixels, axis=0).astype(int)
    return normalize_color_brightness(median_color)

def extract_ceiling_color(img_array: np.ndarray) -> str:
    """Extract median color from the top region (ceiling)"""
    height, width = img_array.shape[:2]
    h_start = 0
    h_end = int(height * 0.15)
    w_start = int(width * 0.2)
    w_end = int(width * 0.8)
    ceiling_pixels = img_array[h_start:h_end, w_start:w_end].reshape(-1, 3)
    median_color = np.median(ceiling_pixels, axis=0).astype(int)
    return normalize_color_brightness(median_color)

def extract_front_wall_color(img_array: np.ndarray) -> str:
    """Extract median color from the center region (front wall)"""
    height, width = img_array.shape[:2]
    h_start = int(height * 0.3)
    h_end = int(height * 0.7)
    w_start = int(width * 0.3)
    w_end = int(width * 0.7)
    center_pixels = img_array[h_start:h_end, w_start:w_end].reshape(-1, 3)
    median_color = np.median(center_pixels, axis=0).astype(int)
    return normalize_color_brightness(median_color)

def extract_left_wall_color(img_array: np.ndarray) -> str:
    """Extract median color from the left region (left wall)"""
    height, width = img_array.shape[:2]
    h_start = int(height * 0.2)
    h_end = int(height * 0.8)
    w_start = 0
    w_end = int(width * 0.2)
    left_pixels = img_array[h_start:h_end, w_start:w_end].reshape(-1, 3)
    median_color = np.median(left_pixels, axis=0).astype(int)
    return normalize_color_brightness(median_color)

def extract_right_wall_color(img_array: np.ndarray) -> str:
    """Extract median color from the right region (right wall)"""
    height, width = img_array.shape[:2]
    h_start = int(height * 0.2)
    h_end = int(height * 0.8)
    w_start = int(width * 0.8)
    w_end = width
    right_pixels = img_array[h_start:h_end, w_start:w_end].reshape(-1, 3)
    median_color = np.median(right_pixels, axis=0).astype(int)
    return normalize_color_brightness(median_color)

def estimate_room_aspect_ratio(img_array: np.ndarray, photo_perspective: str = 'inside') -> dict:
    """
    Smart estimation of room's width:length:height aspect ratio from the image.
    Uses perspective-aware heuristics to generate realistic room dimensions.
    """
    height, width = img_array.shape[:2]
    img_aspect = width / height
    
    # Base dimensions for realistic rooms (in feet)
    base_width = 15.0
    base_length = 15.0
    base_height = 8.0
    
    try:
        # Convert to grayscale for analysis
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        
        # Edge detection for room boundaries
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Analyze perspective and room type
        if photo_perspective == 'inside':
            # Inside view - estimate depth based on perspective
            if img_aspect > 1.3:  # Wide panorama
                # Likely a wide room (living room, dining room)
                room_width = base_width * 1.2  # 18ft
                room_length = base_length * 1.1  # 16.5ft
                room_height = base_height
            elif img_aspect < 0.8:  # Tall/narrow
                # Likely a narrow room (hallway, bathroom)
                room_width = base_width * 0.7  # 10.5ft
                room_length = base_length * 1.3  # 19.5ft
                room_height = base_height * 1.1  # 8.8ft
            else:  # Square-ish
                # Standard room (bedroom, office)
                room_width = base_width
                room_length = base_length
                room_height = base_height
                
        elif photo_perspective == 'topdown':
            # Top-down view - use image aspect for floor plan
            room_width = base_width * img_aspect
            room_length = base_length
            room_height = base_height
            
        elif photo_perspective == 'front':
            # Front view - estimate depth
            room_width = base_width
            room_length = base_length * 0.8  # Slightly shorter
            room_height = base_height
            
        else:
            # Default to standard room
            room_width = base_width
            room_length = base_length
            room_height = base_height
        
        # Apply some randomness for realism (within reasonable bounds)
        import random
        width_variation = random.uniform(0.9, 1.1)
        length_variation = random.uniform(0.9, 1.1)
        height_variation = random.uniform(0.95, 1.05)
        
        aspect = {
            "width": round(room_width * width_variation, 1),
            "length": round(room_length * length_variation, 1),
            "height": round(room_height * height_variation, 1)
        }
        
        print(f"[DEBUG] Smart dimension estimation: {aspect}")
        return aspect
        
    except Exception as e:
        print(f"Error estimating aspect ratio: {e}")
        # Fallback to reasonable defaults
        return {
            "width": base_width,
            "length": base_length,
            "height": base_height
        }

def analyze_room_image(image: Image.Image, photo_perspective: str = 'inside') -> dict:
    img_array = np.array(image)
    front_wall_color = extract_front_wall_color(img_array)
    left_wall_color = extract_left_wall_color(img_array)
    right_wall_color = extract_right_wall_color(img_array)
    floor_color = extract_floor_color(img_array)
    ceiling_color = extract_ceiling_color(img_array)
    aspect = estimate_room_aspect_ratio(img_array, photo_perspective)
    
    return {
        "front_wall_color": front_wall_color,
        "left_wall_color": left_wall_color,
        "right_wall_color": right_wall_color,
        "floor_color": floor_color,
        "ceiling_color": ceiling_color,
        "aspect": aspect
    }

def create_procedural_room(analysis: dict, photo_perspective: str = 'inside') -> dict:
    front_wall_color = analysis["front_wall_color"]
    left_wall_color = analysis["left_wall_color"]
    right_wall_color = analysis["right_wall_color"]
    floor_color = analysis["floor_color"]
    ceiling_color = analysis["ceiling_color"]
    aspect = analysis.get("aspect", {"width": 15.0, "length": 15.0, "height": 8.0})
    width = aspect["width"]
    length = aspect["length"]
    height = aspect["height"]
    
    grey = "#e3e3e3"
    message = ""
    wall_colors = {"front": grey, "back": grey, "left": grey, "right": grey}
    floor = grey
    ceiling = grey
    
    # Assign colors based on photo perspective
    if photo_perspective == 'inside':
        wall_colors = {"front": front_wall_color, "back": grey, "left": left_wall_color, "right": right_wall_color}
        floor = floor_color
        ceiling = ceiling_color
        message = f"Front wall: {front_wall_color}, Left wall: {left_wall_color}, Right wall: {right_wall_color}, Floor: {floor_color}, Ceiling: {ceiling_color}. Estimated dimensions: width={width}ft, length={length}ft, height={height}ft."
    elif photo_perspective == 'front':
        wall_colors = {"front": front_wall_color, "back": grey, "left": grey, "right": grey}
        floor = floor_color
        ceiling = ceiling_color
        message = f"Only the front wall color was visible in the photo; other walls are shown as grey. Estimated dimensions: width={width}ft, length={length}ft, height={height}ft."
    elif photo_perspective == 'back':
        wall_colors = {"front": grey, "back": front_wall_color, "left": grey, "right": grey}
        floor = floor_color
        ceiling = ceiling_color
        message = f"Only the back wall color was visible in the photo; other walls are shown as grey. Estimated dimensions: width={width}ft, length={length}ft, height={height}ft."
    else:
        wall_colors = {"front": grey, "back": grey, "left": grey, "right": grey}
        floor = floor_color
        ceiling = ceiling_color
        message = f"Custom perspective: wall colors may not be accurate. Estimated dimensions: width={width}ft, length={length}ft, height={height}ft."
    
    model_data = {
        "width": width,
        "length": length,
        "height": height,
        "floorColor": floor,
        "ceilingColor": ceiling,
        "wallFrontColor": wall_colors["front"],
        "wallBackColor": wall_colors["back"],
        "wallLeftColor": wall_colors["left"],
        "wallRightColor": wall_colors["right"],
        "blocks": [],
        "chatMessages": [
            { "role": "assistant", "content": f"Generated 3D model. {message}" }
        ]
    }
    return model_data

def create_wall_colors(colors: List[str]) -> dict:
    """Assign the same color to all walls (for single dominant color rooms)"""
    base_color = colors[0] if colors else "#f5f5f5"
    return {
        "front": base_color,
        "back": base_color,
        "left": base_color,
        "right": base_color
    }

def create_fallback_model() -> dict:
    """Create fallback model data if 3D generation fails"""
    return {
        "width": 12,
        "length": 15,
        "height": 8,
        "floorColor": "#e3e3e3",
        "ceilingColor": "#ffffff",
        "wallFrontColor": "#f5f5f5",
        "wallBackColor": "#f5f5f5",
        "wallLeftColor": "#f5f5f5",
        "wallRightColor": "#f5f5f5",
        "blocks": [],
        "chatMessages": [
            { "role": "assistant", "content": "Generated fallback 3D model." }
        ]
    }

def classify_room_with_clip(image: Image.Image) -> dict:
    """
    Use CLIP to classify if an image is a room.
    Returns classification result with confidence scores.
    """
    # Define text prompts for room classification
    room_prompts = [
        "a living room",
        "a living room with furniture",
        "a living room with a tv",
        "a living room with a sofa",
        "a living room with a table",
        "a living room with a chair",
        "a living room with a rug",
        "a living room with a wall",
        "a living room with a window",
        "a living room with a door",
        "a living room with a ceiling",
        "a living room with a floor",
        "a living room with a ceiling",
        "a bedroom",
        "a bedroom with a bed",
        "a bedroom with a dresser",
        "a bedroom with a nightstand",
        "a bedroom with a chair",
        "a bedroom with a rug",
        "a bedroom with a wall",
        "a kitchen",
        "a dining room",
        "a bathroom",
        "an office room",
        "an interior room",
        "a room with furniture",
        "an indoor space",
        "a residential room"
    ]

    non_room_prompts = [
        "an outdoor scene",
        "a landscape",
        "a person",
        "an animal",
        "a car",
        "a building exterior",
        "a street",
        "a garden",
        "a tree",
        "a sky"
    ]

    # Preprocess the image
    image_input = preprocess(image).unsqueeze(0).to(device)

    # Prepare text inputs
    text_inputs = clip.tokenize(room_prompts + non_room_prompts).to(device)

    # Get image and text features
    with torch.no_grad():
        image_features = model.encode_image(image_input)
        text_features = model.encode_text(text_inputs)

        # convert features to unit vector simpler for embedding calculations like cosine similarity or l2 distance
        image_features /= image_features.norm(dim=-1, keepdim=True)
        text_features /= text_features.norm(dim=-1, keepdim=True)

        # Calculate similarity scores
        similarity = (100.0 * image_features @ text_features.T).softmax(dim=-1)

        # Get scores for room vs non-room categories
        room_scores = similarity[0, :len(room_prompts)]
        non_room_scores = similarity[0, len(room_prompts):]

        # Calculate overall room confidence
        room_confidence = room_scores.mean().item()
        non_room_confidence = non_room_scores.mean().item()

        # whichever is higher is the result 
        is_room = room_confidence > non_room_confidence

        # confidence level of whether it is a room or not
        confidence = max(room_confidence, non_room_confidence)

        # Get top matching prompts
        top_room_idx = room_scores.argmax().item()
        top_non_room_idx = non_room_scores.argmax().item()

        top_room_prompt = room_prompts[top_room_idx]
        top_non_room_prompt = non_room_prompts[top_non_room_idx]

        return {
            "is_room": is_room,
            "confidence": confidence,
            "room_confidence": room_confidence,
            "non_room_confidence": non_room_confidence,
            "top_room_match": top_room_prompt,
            "top_non_room_match": top_non_room_prompt,
            "message": f"Detected as {top_room_prompt if is_room else top_non_room_prompt} (confidence: {confidence:.2f})"
        }



def detect_objects_in_room(image: Image.Image, confidence_threshold=0.5) -> tuple[list, Image.Image]:
    """
    Detects objects in a room image using a pre-trained YOLOv8 model.
    Returns a list of detected objects and the image with bounding boxes drawn on it.
    """
    # 1. Load a pre-trained YOLOv8 model (it will be downloaded automatically on first use)
    model = YOLO("yolov8x.pt")

    # 2. Run inference with a specified confidence threshold and class-agnostic NMS
    # This ensures that only objects meeting the threshold are returned and that
    # overlapping boxes for the same object are suppressed.
    results = model(image, conf=confidence_threshold, agnostic_nms=True)

    # 3. The `plot()` method returns a BGR numpy array with boxes and labels drawn
    annotated_image_bgr = results[0].plot()
    
    # Convert the annotated image from BGR (OpenCV default) to RGB for PIL
    annotated_image_rgb = cv2.cvtColor(annotated_image_bgr, cv2.COLOR_BGR2RGB)
    final_image = Image.fromarray(annotated_image_rgb)

    # 4. Extract object information into a list of dictionaries
    objects = []
    for result in results:
        boxes = result.boxes
        for box in boxes:
            x1, y1, x2, y2 = box.xyxy[0]
            confidence = box.conf[0].item()
            cls_id = int(box.cls[0])
            label = model.names[cls_id]
            
            objects.append({
                "label": label,
                "confidence": confidence,
                "bbox": [int(x1), int(y1), int(x2 - x1), int(y2 - y1)] # x, y, w, h
            })
            print("objects: ", objects)

    return objects, final_image

@app.post("/check-room-and-objects")
async def check_room_and_objects(file: UploadFile = File(...)):
    """
    Check if the uploaded image is a room using CLIP model and detect objects.
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        confidence_threshold = 0.5

        detected_objects, annotated_image = detect_objects_in_room(image, confidence_threshold=confidence_threshold)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = f"annotated_{timestamp}.jpg"
        annotated_image.save(output_path)

        result = classify_room_with_clip(image)
        result['annotated_image_path'] = output_path
        result['detected_objects'] = detected_objects
        
        return result

    except Exception as e:
        print(f"Error processing image for room and object detection: {str(e)}")
        return {
            "is_room": False,
            "confidence": 0.0,
            "error": str(e),
            "message": f"Error processing image for room and object detection: {str(e)}"
        }

@app.post("/generate-room-model")
async def generate_room_model(file: UploadFile = File(...), photo_perspective: str = Form('inside')):
    """
    Generates a 3D room model based on the uploaded image and photo perspective.
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        if image.mode != 'RGB':
            image = image.convert('RGB')

        analysis = analyze_room_image(image, photo_perspective)
        model_data = create_procedural_room(analysis, photo_perspective)
        
        meshy_result = generate_3d_model_with_meshy(image)
        if "model_url" in meshy_result:
            model_data["meshy_model_url"] = meshy_result["model_url"]
        else:
            model_data["meshy_error"] = meshy_result.get("error", "Unknown Meshy.ai error")

        return {
            "model_data": model_data,
            "message": "3D model generated successfully."
        }

    except Exception as e:
        print(f"Error generating 3D model: {str(e)}")
        return {
            "model_data": create_fallback_model(),
            "error": str(e),
            "message": f"Error generating 3D model: {str(e)}"
        }
 