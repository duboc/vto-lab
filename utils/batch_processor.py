import os
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Any

class BatchProcessor:
    """Handles batch processing of virtual try-on operations"""
    
    def __init__(self, vto_client, max_workers=3):
        self.vto_client = vto_client
        self.max_workers = max_workers
        self.sessions = {}  # session_id -> session_data
        self.lock = threading.Lock()
    
    def start_batch(self, session_id: str, person_image_path: str, clothing_items: List[Dict]):
        """
        Start batch processing for a session
        
        Args:
            session_id: Unique session identifier
            person_image_path: Path to person's image
            clothing_items: List of clothing item dictionaries
        """
        with self.lock:
            self.sessions[session_id] = {
                'status': 'processing',
                'total_items': len(clothing_items),
                'completed_items': 0,
                'failed_items': 0,
                'results': [],
                'errors': [],
                'start_time': time.time()
            }
        
        # Start processing in a separate thread
        thread = threading.Thread(
            target=self._process_batch,
            args=(session_id, person_image_path, clothing_items)
        )
        thread.daemon = True
        thread.start()
    
    def _process_batch(self, session_id: str, person_image_path: str, clothing_items: List[Dict]):
        """Process all clothing items for a session"""
        
        def process_single_item(clothing_item):
            """Process a single clothing item"""
            try:
                clothing_path = clothing_item['path']
                clothing_name = clothing_item['name']
                
                # Perform virtual try-on
                result = self.vto_client.try_on(person_image_path, clothing_path)
                
                if result:
                    # Save result
                    result_filename = f"{session_id}_{clothing_name}_result.jpg"
                    result_path = os.path.join('results', result_filename)
                    result.save(result_path, 'JPEG')
                    
                    return {
                        'success': True,
                        'clothing_item': clothing_item,
                        'result_filename': result_filename,
                        'result_path': result_path
                    }
                else:
                    return {
                        'success': False,
                        'clothing_item': clothing_item,
                        'error': 'Virtual try-on failed'
                    }
                    
            except Exception as e:
                return {
                    'success': False,
                    'clothing_item': clothing_item,
                    'error': str(e)
                }
        
        # Process items concurrently
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit all jobs
            future_to_item = {
                executor.submit(process_single_item, item): item 
                for item in clothing_items
            }
            
            # Process completed jobs
            for future in as_completed(future_to_item):
                result = future.result()
                
                with self.lock:
                    session_data = self.sessions[session_id]
                    
                    if result['success']:
                        session_data['results'].append(result)
                        session_data['completed_items'] += 1
                    else:
                        session_data['errors'].append(result)
                        session_data['failed_items'] += 1
                    
                    # Update status
                    total_processed = session_data['completed_items'] + session_data['failed_items']
                    if total_processed >= session_data['total_items']:
                        session_data['status'] = 'completed'
                        session_data['end_time'] = time.time()
                        session_data['duration'] = session_data['end_time'] - session_data['start_time']
    
    def get_status(self, session_id: str) -> Dict[str, Any]:
        """Get current status of a batch processing session"""
        with self.lock:
            if session_id not in self.sessions:
                return {'error': 'Session not found'}
            
            session_data = self.sessions[session_id].copy()
            
            # Calculate progress percentage
            total_processed = session_data['completed_items'] + session_data['failed_items']
            progress_percentage = (total_processed / session_data['total_items']) * 100 if session_data['total_items'] > 0 else 0
            
            session_data['progress_percentage'] = round(progress_percentage, 1)
            session_data['total_processed'] = total_processed
            
            return session_data
    
    def get_results(self, session_id: str) -> Dict[str, Any]:
        """Get final results of a batch processing session"""
        with self.lock:
            if session_id not in self.sessions:
                return {'error': 'Session not found'}
            
            session_data = self.sessions[session_id].copy()
            
            # Only return results if processing is completed
            if session_data['status'] != 'completed':
                return {'error': 'Processing not completed yet'}
            
            return {
                'session_id': session_id,
                'status': session_data['status'],
                'total_items': session_data['total_items'],
                'completed_items': session_data['completed_items'],
                'failed_items': session_data['failed_items'],
                'results': session_data['results'],
                'errors': session_data['errors'],
                'duration': session_data.get('duration', 0)
            }
    
    def cleanup_session(self, session_id: str):
        """Clean up a completed session"""
        with self.lock:
            if session_id in self.sessions:
                del self.sessions[session_id]
    
    def get_active_sessions(self) -> List[str]:
        """Get list of currently active session IDs"""
        with self.lock:
            return [
                session_id for session_id, data in self.sessions.items()
                if data['status'] == 'processing'
            ]
