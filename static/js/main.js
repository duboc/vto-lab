// Global variables
let currentSessionId = null;
let selectedClothingItem = null;
let stream = null;
let progressInterval = null;
let toastTimeout = null;
let isDragging = false;
let retryCount = 0;
let maxRetries = 3;

// Carousel variables
let currentSlideIndex = 0;
let totalSlides = 0;
let slidesPerView = 1;
let slideWidth = 0;
let carouselTrack = null;
let carouselPrev = null;
let carouselNext = null;
let carouselIndicators = null;
let touchStartX = 0;
let touchEndX = 0;
let isCarouselDragging = false;

// DOM Elements
const uploadComponent = document.getElementById('uploadComponent');
const uploadTabBtn = document.getElementById('uploadTabBtn');
const cameraTabBtn = document.getElementById('cameraTabBtn');
const uploadContent = document.getElementById('uploadContent');
const cameraContent = document.getElementById('cameraContent');
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const cameraSection = document.getElementById('cameraSection');
const cameraPreview = document.getElementById('cameraPreview');
const captureBtn = document.getElementById('captureBtn');
const closeCameraBtn = document.getElementById('closeCameraBtn');
const userImagePreview = document.getElementById('userImagePreview');
const userImage = document.getElementById('userImage');
const changeImageBtn = document.getElementById('changeImageBtn');
const clothingGallery = document.getElementById('clothingGallery');
const actionButtons = document.getElementById('actionButtons');
const tryAllBtn = document.getElementById('tryAllBtn');
const trySelectedBtn = document.getElementById('trySelectedBtn');
const progressSection = document.getElementById('progressSection');
const progressTitle = document.getElementById('progressTitle');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const cancelBtn = document.getElementById('cancelBtn');
const resultSection = document.getElementById('resultSection');
const originalImage = document.getElementById('originalImage');
const resultImage = document.getElementById('resultImage');
const downloadBtn = document.getElementById('downloadBtn');
const tryAnotherBtn = document.getElementById('tryAnotherBtn');
const startOverBtn = document.getElementById('startOverBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeCarousel();
    createToastContainer();
    addPageTransitions();
    addEnhancedInteractions();
    addAccessibilityFeatures();
    initializeNetworkMonitoring();
});

function initializeEventListeners() {
    // Tab events
    uploadTabBtn.addEventListener('click', () => switchTab('upload'));
    cameraTabBtn.addEventListener('click', () => switchTab('camera'));

    // Upload area events
    uploadArea.addEventListener('click', () => imageInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Image input change
    imageInput.addEventListener('change', handleImageSelect);
    
    // Camera events
    captureBtn.addEventListener('click', capturePhoto);
    closeCameraBtn.addEventListener('click', stopCamera);
    
    // User image events
    changeImageBtn.addEventListener('click', changeImage);
    
    // Action buttons
    tryAllBtn.addEventListener('click', startTryAllClothes);
    trySelectedBtn.addEventListener('click', startTrySelectedClothing);
    
    // Progress controls
    cancelBtn.addEventListener('click', cancelProcessing);
    
    // Result actions
    downloadBtn.addEventListener('click', downloadResult);
    tryAnotherBtn.addEventListener('click', tryAnotherItem);
    startOverBtn.addEventListener('click', startOver);
    
    // Clothing item selection
    setupClothingItemSelection();
    
    // Image preview
    setupImagePreview();
}

// Toast notification system
function createToastContainer() {
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: calc(100vw - 40px);
    `;
    document.body.appendChild(toastContainer);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const colors = {
        success: 'var(--success)',
        error: 'var(--danger)',
        info: 'var(--info)',
        warning: 'var(--warning)'
    };
    
    const icons = {
        success: '✓',
        error: '✗',
        info: 'ℹ',
        warning: '⚠'
    };
    
    toast.style.cssText = `
        background: white;
        padding: 16px 24px;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 280px;
        max-width: 500px;
        width: 100%;
        border-left: 4px solid ${colors[type]};
        animation: slideInRight 0.3s ease-out;
        position: relative;
    `;
    
    toast.innerHTML = `
        <span style="color: ${colors[type]}; font-size: 1.25rem; font-weight: bold;">${icons[type]}</span>
        <span style="color: var(--gray-700); font-size: 0.95rem; flex: 1;">${message}</span>
        <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            color: var(--gray-400);
            cursor: pointer;
            padding: 0;
            font-size: 1.25rem;
            margin-left: 12px;
        ">&times;</button>
    `;
    
    document.getElementById('toastContainer').appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Add page transitions
function addPageTransitions() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .fade-in {
            animation: fadeIn 0.3s ease-out;
        }
        
        .fade-out {
            animation: fadeOut 0.3s ease-in;
        }
    `;
    document.head.appendChild(style);
}

// Drag and drop functionality
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleImageFile(files[0]);
    }
}

// Image selection and upload
function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleImageFile(file);
    }
}

async function handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error');
        return;
    }
    
    if (file.size > 16 * 1024 * 1024) {
        showToast('Image size must be less than 16MB', 'error');
        return;
    }
    
    showLoading('Uploading your photo...');
    
    const formData = new FormData();
    formData.append('user_image', file);
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentSessionId = result.session_id;
            showUserImage(URL.createObjectURL(file));
            hideLoading();
            showToast('Photo uploaded successfully!', 'success');
        } else {
            throw new Error(result.error || 'Upload failed');
        }
    } catch (error) {
        hideLoading();
        showToast('Failed to upload image: ' + error.message, 'error');
    }
}

// Tab functionality
function switchTab(tabName) {
    if (tabName === 'upload') {
        uploadTabBtn.classList.add('active');
        cameraTabBtn.classList.remove('active');
        uploadContent.classList.add('active');
        cameraContent.classList.remove('active');
        stopCamera(true); // Silently stop camera without switching tab back
    } else if (tabName === 'camera') {
        cameraTabBtn.classList.add('active');
        uploadTabBtn.classList.remove('active');
        cameraContent.classList.add('active');
        uploadContent.classList.remove('active');
        startCamera();
    }
}

// Camera functionality
async function startCamera() {
    if (stream) return; // Camera is already active
    try {
        const constraints = {
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };
        
        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
            constraints.video.facingMode = 'user';
            stream = await navigator.mediaDevices.getUserMedia(constraints);
        }
        
        cameraPreview.srcObject = stream;
    } catch (error) {
        showToast('Could not access camera: ' + error.message, 'error');
        switchTab('upload'); // Switch back to upload tab on error
    }
}

function capturePhoto() {
    // Add capture animation
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: white;
        pointer-events: none;
        opacity: 0;
        animation: flash 0.3s ease-out;
    `;
    cameraSection.appendChild(flash);
    
    setTimeout(() => flash.remove(), 300);
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = cameraPreview.videoWidth;
    canvas.height = cameraPreview.videoHeight;
    
    context.drawImage(cameraPreview, 0, 0);
    
    canvas.toBlob(async (blob) => {
        // Convert blob to File object with proper type
        const file = new File([blob], 'camera_capture.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now()
        });
        
        await handleImageFile(file);
        stopCamera();
    }, 'image/jpeg', 0.8);
}

function stopCamera(silent = false) {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    if (!silent) {
        switchTab('upload');
    }
}

// User image display
function showUserImage(imageUrl) {
    userImage.src = imageUrl;
    uploadComponent.style.display = 'none';
    userImagePreview.style.display = 'block';
    userImagePreview.classList.add('fade-in');
    actionButtons.style.display = 'flex';
    actionButtons.classList.add('fade-in');
}

function changeImage() {
    userImagePreview.style.display = 'none';
    uploadComponent.style.display = 'block';
    uploadComponent.classList.add('fade-in');
    actionButtons.style.display = 'none';
    resultSection.style.display = 'none';
    clearClothingSelection();
    currentSessionId = null;
    imageInput.value = '';
}

// Carousel functionality
function initializeCarousel() {
    carouselTrack = document.getElementById('carouselTrack');
    carouselPrev = document.getElementById('carouselPrev');
    carouselNext = document.getElementById('carouselNext');
    carouselIndicators = document.getElementById('carouselIndicators');
    
    if (!carouselTrack) return; // No carousel on this page
    
    const slides = carouselTrack.querySelectorAll('.carousel-slide');
    totalSlides = slides.length;
    
    if (totalSlides === 0) return;
    
    // Calculate slides per view based on screen size
    updateSlidesPerView();
    
    // Generate indicators
    generateCarouselIndicators();
    
    // Add event listeners
    setupCarouselEventListeners();
    
    // Initialize carousel position
    updateCarousel();
    
    // Handle resize
    window.addEventListener('resize', throttle(() => {
        updateSlidesPerView();
        updateCarousel();
    }, 250));
}

function updateSlidesPerView() {
    const containerWidth = carouselTrack.parentElement.offsetWidth;
    const slideWidth = carouselTrack.querySelector('.carousel-slide')?.offsetWidth || 280;
    const gap = 16; // Gap between slides
    
    slidesPerView = Math.floor((containerWidth + gap) / (slideWidth + gap));
    slidesPerView = Math.max(1, Math.min(slidesPerView, totalSlides));
}

function generateCarouselIndicators() {
    if (!carouselIndicators) return;
    
    carouselIndicators.innerHTML = '';
    const totalIndicators = Math.max(1, totalSlides - slidesPerView + 1);
    
    for (let i = 0; i < totalIndicators; i++) {
        const indicator = document.createElement('button');
        indicator.className = 'carousel-indicator';
        indicator.setAttribute('aria-label', `Go to slide ${i + 1}`);
        indicator.addEventListener('click', () => goToSlide(i));
        carouselIndicators.appendChild(indicator);
    }
}

function setupCarouselEventListeners() {
    // Navigation buttons
    if (carouselPrev) {
        carouselPrev.addEventListener('click', () => goToPrevSlide());
    }
    
    if (carouselNext) {
        carouselNext.addEventListener('click', () => goToNextSlide());
    }
    
    // Touch events for mobile swiping
    if (carouselTrack) {
        carouselTrack.addEventListener('touchstart', handleTouchStart, { passive: true });
        carouselTrack.addEventListener('touchmove', handleTouchMove, { passive: true });
        carouselTrack.addEventListener('touchend', handleTouchEnd);
        
        // Mouse events for desktop dragging
        carouselTrack.addEventListener('mousedown', handleMouseDown);
        carouselTrack.addEventListener('mousemove', handleMouseMove);
        carouselTrack.addEventListener('mouseup', handleMouseUp);
        carouselTrack.addEventListener('mouseleave', handleMouseUp);
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.target.closest('.clothing-carousel')) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                goToPrevSlide();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                goToNextSlide();
            }
        }
    });
}

// Image preview functionality
function setupImagePreview() {
    userImage.style.cursor = 'zoom-in';
    userImage.addEventListener('click', () => {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            cursor: zoom-out;
            animation: fadeIn 0.3s ease-out;
        `;
        
        const img = document.createElement('img');
        img.src = userImage.src;
        img.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-2xl);
        `;
        
        modal.appendChild(img);
        modal.addEventListener('click', () => {
            modal.style.animation = 'fadeOut 0.3s ease-in';
            setTimeout(() => modal.remove(), 300);
        });
        
        document.body.appendChild(modal);
    });
}

// Clothing item selection
function setupClothingItemSelection() {
    const clothingItems = document.querySelectorAll('.clothing-item');
    
    clothingItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove previous selection with animation
            clothingItems.forEach(i => {
                if (i.classList.contains('selected')) {
                    i.classList.remove('selected');
                }
            });
            
            // Add selection to clicked item
            item.classList.add('selected');
            selectedClothingItem = item.dataset.filename;
            
            // Show try selected button with animation
            if (currentSessionId) {
                trySelectedBtn.style.display = 'inline-flex';
                trySelectedBtn.classList.add('fade-in');
            }
        });
        
        // Individual try-on button
        const tryOnBtn = item.querySelector('.btn-try-on');
        tryOnBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (!currentSessionId) {
                showToast('Please upload your photo first', 'warning');
                // Highlight upload area
                uploadArea.style.animation = 'pulse 1s ease-out 3';
                setTimeout(() => uploadArea.style.animation = '', 3000);
                return;
            }
            
            selectedClothingItem = item.dataset.filename;
            startTrySelectedClothing();
        });
    });
}

function clearClothingSelection() {
    const clothingItems = document.querySelectorAll('.clothing-item');
    clothingItems.forEach(item => item.classList.remove('selected'));
    selectedClothingItem = null;
    trySelectedBtn.style.display = 'none';
}

// Try-on functionality
async function startTrySelectedClothing() {
    if (!currentSessionId || !selectedClothingItem) {
        showToast('Please select a clothing item to try on', 'warning');
        return;
    }
    
    showLoading('Creating your virtual try-on...');
    
    try {
        const response = await fetch('/try-on', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: currentSessionId,
                clothing_item: selectedClothingItem
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSingleResult(result.result_filename);
            showToast('Try-on completed successfully!', 'success');
        } else {
            throw new Error(result.error || 'Try-on failed');
        }
    } catch (error) {
        showToast('Try-on failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function startTryAllClothes() {
    if (!currentSessionId) {
        showToast('Please upload your photo first', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/try-all', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: currentSessionId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showProgressSection(result.total_items);
            startProgressTracking();
            showToast(`Starting batch processing for ${result.total_items} items`, 'info');
        } else {
            throw new Error(result.error || 'Failed to start batch processing');
        }
    } catch (error) {
        showToast('Failed to start try-all: ' + error.message, 'error');
    }
}

// Progress tracking
function showProgressSection(totalItems) {
    progressSection.style.display = 'block';
    progressSection.classList.add('fade-in');
    progressTitle.textContent = `Trying on all ${totalItems} clothes...`;
    progressFill.style.width = '0%';
    progressText.textContent = 'Starting...';
    
    // Hide other sections with animation
    clothingGallery.style.animation = 'fadeOut 0.3s ease-in';
    actionButtons.style.animation = 'fadeOut 0.3s ease-in';
    
    setTimeout(() => {
        clothingGallery.style.display = 'none';
        actionButtons.style.display = 'none';
        resultSection.style.display = 'none';
    }, 300);
}

function startProgressTracking() {
    let lastProgress = 0;
    
    progressInterval = setInterval(async () => {
        try {
            const response = await fetch(`/try-all-status/${currentSessionId}`);
            const status = await response.json();
            
            if (status.error) {
                throw new Error(status.error);
            }
            
            updateProgress(status);
            
            // Show toast for milestones
            const currentProgress = status.progress_percentage || 0;
            if (currentProgress >= 25 && lastProgress < 25) {
                showToast('25% complete!', 'info');
            } else if (currentProgress >= 50 && lastProgress < 50) {
                showToast('Halfway there!', 'info');
            } else if (currentProgress >= 75 && lastProgress < 75) {
                showToast('Almost done!', 'info');
            }
            lastProgress = currentProgress;
            
            if (status.status === 'completed') {
                clearInterval(progressInterval);
                showToast('All items processed! Redirecting to results...', 'success');
                setTimeout(redirectToResults, 1500);
            }
        } catch (error) {
            clearInterval(progressInterval);
            showToast('Error tracking progress: ' + error.message, 'error');
        }
    }, 2000); // Check every 2 seconds
}

function updateProgress(status) {
    const percentage = status.progress_percentage || 0;
    progressFill.style.width = `${percentage}%`;
    
    const processed = status.total_processed || 0;
    const total = status.total_items || 0;
    const completed = status.completed_items || 0;
    const failed = status.failed_items || 0;
    
    progressText.textContent = `Processing ${processed}/${total} items (${completed} successful, ${failed} failed)`;
}

function cancelProcessing() {
    if (progressInterval) {
        clearInterval(progressInterval);
    }
    
    progressSection.style.animation = 'fadeOut 0.3s ease-in';
    
    setTimeout(() => {
        progressSection.style.display = 'none';
        clothingGallery.style.display = 'block';
        clothingGallery.classList.add('fade-in');
        actionButtons.style.display = 'flex';
        actionButtons.classList.add('fade-in');
    }, 300);
    
    showToast('Processing cancelled', 'info');
}

function redirectToResults() {
    window.location.href = `/try-all-results/${currentSessionId}`;
}

// Result display
function showSingleResult(resultFilename) {
    resultSection.style.display = 'block';
    resultSection.classList.add('fade-in');
    
    // Set images
    originalImage.src = `/upload/${currentSessionId}_user.jpg`;
    resultImage.src = `/result/${resultFilename}`;
    
    // Store result filename for download
    downloadBtn.dataset.filename = resultFilename;
    
    // Hide other sections
    clothingGallery.style.display = 'none';
    actionButtons.style.display = 'none';
    progressSection.style.display = 'none';
}

// Action handlers
function downloadResult() {
    const filename = downloadBtn.dataset.filename;
    if (filename) {
        const link = document.createElement('a');
        link.href = `/result/${filename}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Download started!', 'success');
    }
}

function tryAnotherItem() {
    resultSection.style.animation = 'fadeOut 0.3s ease-in';
    
    setTimeout(() => {
        resultSection.style.display = 'none';
        clothingGallery.style.display = 'block';
        clothingGallery.classList.add('fade-in');
        actionButtons.style.display = 'flex';
        actionButtons.classList.add('fade-in');
        clearClothingSelection();
    }, 300);
}

function startOver() {
    changeImage();
    showToast('Starting fresh! Upload a new photo to begin.', 'info');
}

// Utility functions
function showLoading(message = 'Loading...') {
    loadingOverlay.style.display = 'flex';
    loadingOverlay.querySelector('p').textContent = message;
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

function showError(message) {
    showToast(message, 'error');
    hideLoading();
}

// Add flash animation
const flashStyle = document.createElement('style');
flashStyle.textContent = `
    @keyframes flash {
        0% { opacity: 0; }
        50% { opacity: 0.8; }
        100% { opacity: 0; }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
`;
document.head.appendChild(flashStyle);

// Enhanced interactions and accessibility
function addEnhancedInteractions() {
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // ESC to cancel current operations
        if (e.key === 'Escape') {
            if (progressInterval) {
                cancelProcessing();
            }
            // Close any open modals
            const modals = document.querySelectorAll('[style*="position: fixed"]');
            modals.forEach(modal => modal.remove());
        }
        
        // Space bar to trigger main actions
        if (e.code === 'Space' && !e.target.matches('input, textarea, button')) {
            e.preventDefault();
            if (currentSessionId && actionButtons.style.display !== 'none') {
                startTryAllClothes();
            } else if (!currentSessionId) {
                imageInput.click();
            }
        }
        
        // Enter to confirm selections
        if (e.key === 'Enter' && selectedClothingItem && currentSessionId) {
            startTrySelectedClothing();
        }
    });
    
    // Add haptic feedback for mobile devices
    if ('vibrate' in navigator) {
        const addHapticFeedback = (element, pattern = [50]) => {
            element.addEventListener('click', () => {
                navigator.vibrate(pattern);
            });
        };
        
        // Add haptic feedback to important buttons
        [tryAllBtn, trySelectedBtn, captureBtn, downloadBtn].forEach(btn => {
            if (btn) addHapticFeedback(btn);
        });
    }
    
    // Add progressive image loading with placeholders
    enhanceImageLoading();
    
    // Add connection quality indicators
    addConnectionIndicators();
}

function addAccessibilityFeatures() {
    // Add ARIA labels for screen readers
    const elements = [
        { el: uploadArea, label: 'Click or drag to upload your photo' },
        { el: cameraPreview, label: 'Camera preview for photo capture' },
        { el: userImage, label: 'Your uploaded photo - click to zoom' },
        { el: progressFill, label: 'Processing progress indicator' }
    ];
    
    elements.forEach(({ el, label }) => {
        if (el) {
            el.setAttribute('aria-label', label);
            el.setAttribute('role', el.tagName === 'IMG' ? 'img' : 'button');
        }
    });
    
    // Add keyboard navigation for clothing items
    const clothingItems = document.querySelectorAll('.clothing-item');
    clothingItems.forEach((item, index) => {
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-label', `Clothing item ${index + 1}`);
        
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                item.click();
            }
        });
    });
    
    // Add live region for status updates
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
    `;
    document.body.appendChild(liveRegion);
    
    // Update live region with important status changes
    const originalShowToast = showToast;
    window.showToast = (message, type) => {
        originalShowToast(message, type);
        if (type === 'success' || type === 'error') {
            liveRegion.textContent = message;
        }
    };
}

function initializeNetworkMonitoring() {
    // Monitor connection status
    let isOnline = navigator.onLine;
    let connectionQuality = 'good';
    
    // Create connection indicator
    const connectionIndicator = document.createElement('div');
    connectionIndicator.id = 'connectionIndicator';
    connectionIndicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: var(--success);
        color: white;
        padding: 8px 16px;
        border-radius: var(--radius-full);
        font-size: 0.875rem;
        font-weight: 600;
        z-index: 1000;
        display: none;
        align-items: center;
        gap: 8px;
        transition: all var(--transition-base);
    `;
    document.body.appendChild(connectionIndicator);
    
    function updateConnectionStatus(online, quality = 'good') {
        isOnline = online;
        connectionQuality = quality;
        
        if (!online) {
            connectionIndicator.style.background = 'var(--danger)';
            connectionIndicator.innerHTML = '🔴 Offline - Check your connection';
            connectionIndicator.style.display = 'flex';
        } else if (quality === 'poor') {
            connectionIndicator.style.background = 'var(--warning)';
            connectionIndicator.innerHTML = '🟡 Slow connection detected';
            connectionIndicator.style.display = 'flex';
        } else {
            connectionIndicator.style.display = 'none';
        }
    }
    
    // Listen for connection changes
    window.addEventListener('online', () => {
        updateConnectionStatus(true);
        showToast('Connection restored!', 'success');
    });
    
    window.addEventListener('offline', () => {
        updateConnectionStatus(false);
        showToast('Connection lost. Please check your internet.', 'error');
    });
    
    // Monitor connection quality using fetch timing
    let lastFetchTime = Date.now();
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const startTime = Date.now();
        try {
            const response = await originalFetch(...args);
            const duration = Date.now() - startTime;
            
            // Update connection quality based on response time
            if (duration > 5000) {
                updateConnectionStatus(true, 'poor');
            } else if (connectionQuality === 'poor' && duration < 2000) {
                updateConnectionStatus(true, 'good');
            }
            
            return response;
        } catch (error) {
            if (!isOnline) {
                updateConnectionStatus(false);
            }
            throw error;
        }
    };
}

function enhanceImageLoading() {
    // Add lazy loading and progressive enhancement for images
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        // Add loading placeholder
        const placeholder = document.createElement('div');
        placeholder.style.cssText = `
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: var(--radius-lg);
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
        `;
        
        // Wrap image in container if not already wrapped
        if (!img.parentElement.classList.contains('image-container')) {
            const container = document.createElement('div');
            container.className = 'image-container';
            container.style.position = 'relative';
            img.parentElement.insertBefore(container, img);
            container.appendChild(img);
        }
        
        const container = img.parentElement;
        
        img.addEventListener('loadstart', () => {
            container.appendChild(placeholder);
        });
        
        img.addEventListener('load', () => {
            placeholder.remove();
            img.style.animation = 'fadeIn 0.3s ease-out';
        });
        
        img.addEventListener('error', () => {
            placeholder.remove();
            placeholder.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: var(--gray-500);
                    flex-direction: column;
                    gap: 8px;
                ">
                    <span style="font-size: 2rem;">📷</span>
                    <span style="font-size: 0.875rem;">Failed to load</span>
                </div>
            `;
            container.appendChild(placeholder);
        });
    });
}

function addConnectionIndicators() {
    // Add retry mechanisms for failed requests
    const retryRequest = async (url, options, attempt = 1) => {
        try {
            const response = await fetch(url, options);
            if (!response.ok && attempt < maxRetries) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response;
        } catch (error) {
            if (attempt < maxRetries) {
                showToast(`Request failed, retrying... (${attempt}/${maxRetries})`, 'warning');
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                return retryRequest(url, options, attempt + 1);
            }
            throw error;
        }
    };
    
    // Override specific fetch calls that need retry logic
    const enhancedFetch = async (url, options = {}) => {
        if (url.includes('/try-on') || url.includes('/try-all') || url.includes('/upload')) {
            return retryRequest(url, options);
        }
        return fetch(url, options);
    };
    
    // Replace global fetch for critical operations
    window.enhancedFetch = enhancedFetch;
}

// Image compression utility
async function compressImage(file, maxWidth = 1920, maxHeight = 1920, quality = 0.8) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // Calculate new dimensions
            let { width, height } = img;
            
            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(resolve, 'image/jpeg', quality);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

// Enhanced error handling with user-friendly messages
function getErrorMessage(error) {
    const errorMap = {
        'NetworkError': 'Connection issue. Please check your internet and try again.',
        'TypeError': 'Something went wrong. Please try again.',
        'AbortError': 'Request was cancelled. You can try again.',
        'TimeoutError': 'Request timed out. Please try again.',
        'QuotaExceededError': 'Storage limit reached. Please clear some space.',
        'SecurityError': 'Permission denied. Please check your browser settings.',
        'NotSupportedError': 'This feature is not supported by your browser.',
        'InvalidStateError': 'Please refresh the page and try again.'
    };
    
    const errorType = error.constructor.name;
    return errorMap[errorType] || error.message || 'An unexpected error occurred';
}

// Performance monitoring
function initializePerformanceMonitoring() {
    if ('performance' in window) {
        // Monitor key user interactions
        const measurePerformance = (name, fn) => {
            return async (...args) => {
                const start = performance.now();
                try {
                    const result = await fn(...args);
                    const duration = performance.now() - start;
                    
                    if (duration > 2000) { // Slow operation warning
                        console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
                    }
                    
                    return result;
                } catch (error) {
                    const duration = performance.now() - start;
                    console.error(`Operation failed: ${name} after ${duration.toFixed(2)}ms`, error);
                    throw error;
                }
            };
        };
        
        // Wrap critical functions with performance monitoring
        const originalHandleImageFile = handleImageFile;
        window.handleImageFile = measurePerformance('Image Upload', originalHandleImageFile);
    }
}

// Initialize performance monitoring
initializePerformanceMonitoring();

// Carousel navigation functions
function goToSlide(index) {
    const maxIndex = Math.max(0, totalSlides - slidesPerView);
    currentSlideIndex = Math.max(0, Math.min(index, maxIndex));
    updateCarousel();
}

function goToNextSlide() {
    const maxIndex = Math.max(0, totalSlides - slidesPerView);
    if (currentSlideIndex < maxIndex) {
        currentSlideIndex++;
        updateCarousel();
    }
}

function goToPrevSlide() {
    if (currentSlideIndex > 0) {
        currentSlideIndex--;
        updateCarousel();
    }
}

function updateCarousel() {
    if (!carouselTrack) return;
    
    const slideWidth = carouselTrack.querySelector('.carousel-slide')?.offsetWidth || 280;
    const gap = 16;
    const translateX = -currentSlideIndex * (slideWidth + gap);
    
    carouselTrack.style.transform = `translateX(${translateX}px)`;
    
    // Update navigation buttons
    updateNavigationButtons();
    
    // Update indicators
    updateIndicators();
}

function updateNavigationButtons() {
    if (!carouselPrev || !carouselNext) return;
    
    const maxIndex = Math.max(0, totalSlides - slidesPerView);
    
    carouselPrev.disabled = currentSlideIndex === 0;
    carouselNext.disabled = currentSlideIndex >= maxIndex;
    
    // Add visual feedback
    carouselPrev.style.opacity = currentSlideIndex === 0 ? '0.4' : '1';
    carouselNext.style.opacity = currentSlideIndex >= maxIndex ? '0.4' : '1';
}

function updateIndicators() {
    if (!carouselIndicators) return;
    
    const indicators = carouselIndicators.querySelectorAll('.carousel-indicator');
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentSlideIndex);
    });
}

// Touch and mouse event handlers
function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    isCarouselDragging = true;
    carouselTrack.style.transition = 'none';
}

function handleTouchMove(e) {
    if (!isCarouselDragging) return;
    
    touchEndX = e.touches[0].clientX;
    const diff = touchStartX - touchEndX;
    
    // Add resistance at boundaries
    const maxIndex = Math.max(0, totalSlides - slidesPerView);
    const slideWidth = carouselTrack.querySelector('.carousel-slide')?.offsetWidth || 280;
    const gap = 16;
    
    let resistance = 1;
    if ((currentSlideIndex === 0 && diff < 0) || 
        (currentSlideIndex >= maxIndex && diff > 0)) {
        resistance = 0.3; // Reduce movement at boundaries
    }
    
    const baseTranslateX = -currentSlideIndex * (slideWidth + gap);
    const translateX = baseTranslateX - (diff * resistance);
    
    carouselTrack.style.transform = `translateX(${translateX}px)`;
}

function handleTouchEnd(e) {
    if (!isCarouselDragging) return;
    
    isCarouselDragging = false;
    carouselTrack.style.transition = '';
    
    const diff = touchStartX - touchEndX;
    const threshold = 50; // Minimum swipe distance
    
    if (Math.abs(diff) > threshold) {
        if (diff > 0) {
            goToNextSlide();
        } else {
            goToPrevSlide();
        }
    } else {
        // Snap back to current position
        updateCarousel();
    }
    
    touchStartX = 0;
    touchEndX = 0;
}

// Mouse event handlers (for desktop dragging)
function handleMouseDown(e) {
    e.preventDefault();
    touchStartX = e.clientX;
    isCarouselDragging = true;
    carouselTrack.style.transition = 'none';
    carouselTrack.style.cursor = 'grabbing';
}

function handleMouseMove(e) {
    if (!isCarouselDragging) return;
    
    e.preventDefault();
    touchEndX = e.clientX;
    const diff = touchStartX - touchEndX;
    
    // Add resistance at boundaries
    const maxIndex = Math.max(0, totalSlides - slidesPerView);
    const slideWidth = carouselTrack.querySelector('.carousel-slide')?.offsetWidth || 280;
    const gap = 16;
    
    let resistance = 1;
    if ((currentSlideIndex === 0 && diff < 0) || 
        (currentSlideIndex >= maxIndex && diff > 0)) {
        resistance = 0.3;
    }
    
    const baseTranslateX = -currentSlideIndex * (slideWidth + gap);
    const translateX = baseTranslateX - (diff * resistance);
    
    carouselTrack.style.transform = `translateX(${translateX}px)`;
}

function handleMouseUp(e) {
    if (!isCarouselDragging) return;
    
    isCarouselDragging = false;
    carouselTrack.style.transition = '';
    carouselTrack.style.cursor = '';
    
    const diff = touchStartX - touchEndX;
    const threshold = 50;
    
    if (Math.abs(diff) > threshold) {
        if (diff > 0) {
            goToNextSlide();
        } else {
            goToPrevSlide();
        }
    } else {
        updateCarousel();
    }
    
    touchStartX = 0;
    touchEndX = 0;
}

// Utility function for throttling
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Auto-scroll functionality (optional)
function startAutoScroll(interval = 5000) {
    return setInterval(() => {
        const maxIndex = Math.max(0, totalSlides - slidesPerView);
        if (currentSlideIndex >= maxIndex) {
            goToSlide(0); // Loop back to start
        } else {
            goToNextSlide();
        }
    }, interval);
}

function stopAutoScroll(intervalId) {
    if (intervalId) {
        clearInterval(intervalId);
    }
}

// Enhanced carousel with auto-scroll (commented out by default)
// Uncomment to enable auto-scrolling
/*
let autoScrollInterval = null;

function enableAutoScroll() {
    autoScrollInterval = startAutoScroll(4000);
    
    // Pause on hover/touch
    carouselTrack?.addEventListener('mouseenter', () => stopAutoScroll(autoScrollInterval));
    carouselTrack?.addEventListener('mouseleave', () => {
        autoScrollInterval = startAutoScroll(4000);
    });
    
    carouselTrack?.addEventListener('touchstart', () => stopAutoScroll(autoScrollInterval));
    carouselTrack?.addEventListener('touchend', () => {
        setTimeout(() => {
            autoScrollInterval = startAutoScroll(4000);
        }, 3000); // Resume after 3 seconds
    });
}
*/

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    
    if (progressInterval) {
        clearInterval(progressInterval);
    }
});
