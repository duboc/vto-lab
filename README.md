# Virtual Try-On Lab

A modern web application that allows users to virtually try on clothes using Google Cloud's Virtual Try-On AI technology.

## Features

- **Photo Upload**: Upload your photo or capture from camera
- **Individual Try-On**: Try specific clothing items
- **Try All Clothes**: Process your photo against all available clothing items
- **Real-time Progress**: Track batch processing with live progress updates
- **Results Gallery**: View all try-on results in an organized grid
- **Download Options**: Download individual results or all results at once
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Python 3.8+
- Google Cloud Project with Virtual Try-On API enabled
- Google Cloud authentication configured (using Application Default Credentials)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vto-lab
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up Google Cloud Authentication:
```bash
# Install Google Cloud CLI if not already installed
# Then authenticate:
gcloud auth application-default login

# Or set the environment variable for service account:
export GOOGLE_APPLICATION_CREDENTIALS="path/to/your/service-account-key.json"
```

4. Add your clothing items to the `clothes/` folder (JPG/JPEG format)

## Usage

1. Start the Flask application:
```bash
python app.py
```

2. Open your browser and navigate to `http://localhost:5000`

3. Upload your photo or capture from camera

4. Choose between:
   - **Try Selected Item**: Click on a clothing item and try it on
   - **Try All Clothes**: Process your photo against all available clothes

5. View and download your results

## Project Structure

```
vto-lab/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── clothes/              # Clothing item images
├── uploads/              # Temporary user uploads
├── results/              # Generated try-on results
├── utils/
│   ├── vto_client.py     # Google Cloud Virtual Try-On client
│   └── batch_processor.py # Batch processing handler
├── templates/
│   ├── index.html        # Main page template
│   └── results.html      # Results page template
└── static/
    ├── css/
    │   └── styles.css    # Application styles
    └── js/
        ├── main.js       # Main page JavaScript
        └── results.js    # Results page JavaScript
```

## Configuration

The application uses the following Google Cloud configuration:
- **Project ID**: `conventodapenha`
- **Location**: `us-central1`
- **Model**: `virtual-try-on-exp-05-31`

You can modify these settings in `app.py` if needed.

## API Endpoints

- `GET /` - Main application page
- `POST /upload` - Upload user image
- `POST /try-on` - Try on single clothing item
- `POST /try-all` - Start batch processing for all clothes
- `GET /try-all-status/<session_id>` - Get batch processing status
- `GET /try-all-results/<session_id>` - View batch results
- `GET /result/<filename>` - Serve result images
- `GET /upload/<filename>` - Serve uploaded images
- `GET /clothes/<filename>` - Serve clothing images

## Features in Detail

### Individual Try-On
- Select any clothing item from the gallery
- Click "Try On" or use the "Try Selected Item" button
- Get instant results with before/after comparison

### Batch Processing
- Try all clothes at once with the "Try All Clothes" feature
- Real-time progress tracking
- Concurrent processing for faster results
- Detailed results page with success/failure status

### Results Management
- Grid view of all try-on results
- Full-size modal view with navigation
- Individual and bulk download options
- Error handling for failed try-ons

## Troubleshooting

### Common Issues

1. **Authentication Error**: Make sure Google Cloud credentials are properly configured
2. **API Quota Exceeded**: Check your Google Cloud Virtual Try-On API quotas
3. **Large Image Files**: Images are automatically resized to 1024px max dimension
4. **Browser Camera Access**: Ensure camera permissions are granted

### Error Messages

- "Image files not found": Check that uploaded files exist
- "Virtual try-on failed": API processing failed, check image quality
- "Session not found": Session expired, start over

## Development

To run in development mode:
```bash
export FLASK_ENV=development
python app.py
```

The application will reload automatically when files change.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
