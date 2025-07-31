import base64
import io
import re
import timeit
from PIL import Image
from google.cloud import aiplatform
from google.cloud.aiplatform.gapic import PredictResponse

class VirtualTryOnClient:
    """Client for Google Cloud Virtual Try-On API"""
    
    def __init__(self, project_id, location):
        self.project_id = project_id
        self.location = location
        
        # Initialize AI Platform
        aiplatform.init(project=project_id, location=location)
        
        # Setup client
        api_regional_endpoint = f"{location}-aiplatform.googleapis.com"
        client_options = {"api_endpoint": api_regional_endpoint}
        self.client = aiplatform.gapic.PredictionServiceClient(client_options=client_options)
        
        # Model endpoint
        self.model_endpoint = f"projects/{project_id}/locations/{location}/publishers/google/models/virtual-try-on-exp-05-31"
        
        print(f"VTO Client initialized for project {project_id} in {location}")
    
    def image_to_base64(self, image_path):
        """Convert image file to base64 encoded string"""
        with open(image_path, 'rb') as image_file:
            image_bytes = image_file.read()
            return base64.b64encode(image_bytes).decode('utf-8')
    
    def prediction_to_pil_image(self, prediction, size=(640, 640)):
        """Convert prediction response to PIL Image"""
        if "bytesBase64Encoded" in prediction:
            encoded_bytes_string = prediction["bytesBase64Encoded"]
            decoded_image_bytes = base64.b64decode(encoded_bytes_string)
            image_pil = Image.open(io.BytesIO(decoded_image_bytes))
            image_pil.thumbnail(size)
            return image_pil
        return None
    
    def try_on(self, person_image_path, product_image_path, sample_count=1):
        """
        Perform virtual try-on using two image paths
        
        Args:
            person_image_path: Path to person's image
            product_image_path: Path to clothing item image
            sample_count: Number of samples to generate (1-4)
        
        Returns:
            PIL Image object or None if failed
        """
        try:
            # Convert images to base64
            person_image_base64 = self.image_to_base64(person_image_path)
            product_image_base64 = self.image_to_base64(product_image_path)
            
            # Prepare the request
            instance = {
                "personImage": {"image": {"bytesBase64Encoded": person_image_base64}},
                "productImages": [{"image": {"bytesBase64Encoded": product_image_base64}}],
            }
            
            parameters = {
                "sampleCount": sample_count,
                "safetySetting": "block_low_and_above",
                "personGeneration": "allow_adult"
            }
            
            print(f"Starting virtual try-on for {person_image_path} with {product_image_path}")
            start = timeit.default_timer()
            
            # Make the prediction
            response = self.client.predict(
                endpoint=self.model_endpoint, 
                instances=[instance], 
                parameters=parameters
            )
            
            end = timeit.default_timer()
            print(f"Virtual Try-On completed in {end - start:.2f}s")
            
            # Process the response
            if response.predictions:
                prediction = response.predictions[0]
                
                # Check for content filtering
                if "raiFilteredReason" in prediction:
                    print(f"Content filtered: {prediction['raiFilteredReason']}")
                    return None
                
                # Convert to PIL Image
                result_image = self.prediction_to_pil_image(prediction)
                return result_image
            
            print("No predictions returned")
            return None
            
        except Exception as e:
            print(f"Error in virtual try-on: {str(e)}")
            return None
    
    def try_on_batch(self, person_image_path, product_image_paths, sample_count=1):
        """
        Perform multiple virtual try-ons for one person with multiple products
        
        Args:
            person_image_path: Path to person's image
            product_image_paths: List of clothing item image paths
            sample_count: Number of samples per item
        
        Returns:
            List of (product_path, result_image) tuples
        """
        results = []
        
        for product_path in product_image_paths:
            result = self.try_on(person_image_path, product_path, sample_count)
            results.append((product_path, result))
        
        return results
