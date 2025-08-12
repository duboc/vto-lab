import os
import uuid
import base64
import io
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor
from flask import Flask, render_template, request, jsonify, send_file, session
from werkzeug.utils import secure_filename
from PIL import Image
import threading
import time
from dotenv import load_dotenv

load_dotenv()

from utils.vto_client import VirtualTryOnClient
from utils.batch_processor import BatchProcessor

app = Flask(__name__)
app.secret_key = 'vto-lab-secret-key'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Configuration
PROJECT_ID = os.getenv("PROJECT_ID")
LOCATION = "us-central1"
CLOTHES_FOLDER = "clothes"
UPLOAD_FOLDER = "uploads"
RESULTS_FOLDER = "results"

# Create necessary folders
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

# Initialize Virtual Try-On client
vto_client = VirtualTryOnClient(PROJECT_ID, LOCATION)
batch_processor = BatchProcessor(vto_client)

def natural_sort_key(filename):
    """Natural sort key for filenames with numbers"""
    import re
    parts = re.split(r'(\d+)', filename)
    return [int(part) if part.isdigit() else part.lower() for part in parts]

def get_clothing_items():
    """Get list of clothing items from the clothes folder"""
    clothing_items = []
    if os.path.exists(CLOTHES_FOLDER):
        # Use natural sorting to handle numbered files correctly (1, 2, 10 instead of 1, 10, 2)
        filenames = [f for f in os.listdir(CLOTHES_FOLDER) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        filenames.sort(key=natural_sort_key)
        
        for filename in filenames:
            clothing_items.append({
                'filename': filename,
                'path': os.path.join(CLOTHES_FOLDER, filename),
                'name': filename.split('.')[0]
            })
    return clothing_items

def allowed_file(filename):
    """Check if uploaded file is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg'}

@app.route('/')
def index():
    """Main page with clothing gallery"""
    clothing_items = get_clothing_items()
    return render_template('index.html', clothing_items=clothing_items)

@app.route('/upload', methods=['POST'])
def upload_image():
    """Handle user image upload"""
    if 'user_image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['user_image']
    
    # Check if file is empty
    if not file:
        return jsonify({'error': 'No file selected'}), 400
    
    # For camera captures, the filename might be empty or 'blob'
    # So we check the content type instead
    if file.filename == '' or file.filename == 'blob':
        # Check content type for camera captures
        if file.content_type and file.content_type.startswith('image/'):
            file.filename = 'camera_capture.jpg'
        else:
            return jsonify({'error': 'Invalid file type for camera capture'}), 400
    
    # Validate file extension
    if file and (allowed_file(file.filename) or file.content_type.startswith('image/')):
        try:
            # Generate unique session ID
            session_id = str(uuid.uuid4())
            session['session_id'] = session_id
            
            # Save uploaded file
            filename = f"{session_id}_user.jpg"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            
            # Process and save image
            image = Image.open(file.stream).convert('RGB')
            image.thumbnail((1024, 1024))
            image.save(filepath, 'JPEG')
            
            return jsonify({
                'success': True,
                'session_id': session_id,
                'filepath': filepath
            })
        except Exception as e:
            return jsonify({'error': f'Failed to process image: {str(e)}'}), 500
    
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/try-on', methods=['POST'])
def try_on_single():
    """Try on a single clothing item"""
    data = request.get_json()
    session_id = data.get('session_id')
    clothing_item = data.get('clothing_item')
    
    if not session_id or not clothing_item:
        return jsonify({'error': 'Missing session_id or clothing_item'}), 400
    
    user_image_path = os.path.join(UPLOAD_FOLDER, f"{session_id}_user.jpg")
    clothing_path = os.path.join(CLOTHES_FOLDER, clothing_item)
    
    if not os.path.exists(user_image_path) or not os.path.exists(clothing_path):
        return jsonify({'error': 'Image files not found'}), 404
    
    try:
        # Perform virtual try-on
        result = vto_client.try_on(user_image_path, clothing_path)
        
        if result:
            # Save result
            result_filename = f"{session_id}_{clothing_item.split('.')[0]}_result.jpg"
            result_path = os.path.join(RESULTS_FOLDER, result_filename)
            result.save(result_path, 'JPEG')
            
            return jsonify({
                'success': True,
                'result_path': result_path,
                'result_filename': result_filename
            })
        else:
            return jsonify({'error': 'Virtual try-on failed'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/try-all', methods=['POST'])
def try_all_clothes():
    """Start batch processing to try all clothes"""
    data = request.get_json()
    session_id = data.get('session_id')
    
    if not session_id:
        return jsonify({'error': 'Missing session_id'}), 400
    
    user_image_path = os.path.join(UPLOAD_FOLDER, f"{session_id}_user.jpg")
    
    if not os.path.exists(user_image_path):
        return jsonify({'error': 'User image not found'}), 404
    
    # Get all clothing items
    clothing_items = get_clothing_items()
    
    # Start batch processing
    batch_processor.start_batch(session_id, user_image_path, clothing_items)
    
    return jsonify({
        'success': True,
        'session_id': session_id,
        'total_items': len(clothing_items)
    })

@app.route('/try-all-status/<session_id>')
def try_all_status(session_id):
    """Get status of batch processing"""
    status = batch_processor.get_status(session_id)
    return jsonify(status)

@app.route('/try-all-results/<session_id>')
def try_all_results(session_id):
    """Get results of batch processing"""
    results = batch_processor.get_results(session_id)
    return render_template('results.html', 
                         session_id=session_id, 
                         results=results,
                         user_image=f"{session_id}_user.jpg")

@app.route('/result/<filename>')
def serve_result(filename):
    """Serve result images"""
    return send_file(os.path.join(RESULTS_FOLDER, filename))

@app.route('/upload/<filename>')
def serve_upload(filename):
    """Serve uploaded images"""
    return send_file(os.path.join(UPLOAD_FOLDER, filename))

@app.route('/clothes/<filename>')
def serve_clothing(filename):
    """Serve clothing images"""
    return send_file(os.path.join(CLOTHES_FOLDER, filename))

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 9090))
    app.run(debug=False, host='0.0.0.0', port=port)
