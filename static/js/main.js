// Global variables
let currentSessionId = null;
let selectedClothingItem = null;
let stream = null;
let progressInterval = null;
let toastTimeout = null;
let isDragging = false;
let retryCount = 0;
let maxRetries = 3;

// Swiper instance
let clothingSwiper = null;

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
    // Enhanced file type validation for iOS compatibility
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const isValidImage = validImageTypes.includes(file.type.toLowerCase()) || 
                        file.type.startsWith('image/') ||
                        /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
    
    if (!isValidImage) {
        showToast('Please select a valid image file (JPG, PNG, GIF, WebP)', 'error');
        // Clear the input to allow re-selection
        imageInput.value = '';
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
    
    // Get video dimensions
    const videoWidth = cameraPreview.videoWidth;
    const videoHeight = cameraPreview.videoHeight;
    
    // Set canvas dimensions to match video, but handle rotation
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    // Save the current context state
    context.save();
    
    // Handle mobile camera rotation - flip horizontally for front camera
    if (window.orientation !== undefined) {
        // Mobile device detected
        context.scale(-1, 1); // Flip horizontally for front camera
        context.translate(-canvas.width, 0);
    }
    
    // Draw the image
    context.drawImage(cameraPreview, 0, 0, canvas.width, canvas.height);
    
    // Restore context
    context.restore();
    
    canvas.toBlob(async (blob) => {
        // Convert blob to File object with proper type
        const file = new File([blob], 'camera_capture.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now()
        });
        
        await handleImageFile(file);
        stopCamera();
    }, 'image/jpeg', 0.9);
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

// Swiper Carousel functionality
function initializeCarousel() {
    // Wait for Swiper to be available
    if (typeof Swiper === 'undefined') {
        setTimeout(initializeCarousel, 100);
        return;
    }
    
    const swiperContainer = document.getElementById('clothingSwiper');
    if (!swiperContainer) return; // No carousel on this page
    
    // Initialize Swiper with improved settings for better visibility and UX
    clothingSwiper = new Swiper('#clothingSwiper', {
        // Show at least 3 items on all devices
        slidesPerView: 3.2,
        spaceBetween: 20,
        centeredSlides: false,
        
        // Smooth scrolling without free mode for better control
        freeMode: false,
        
        // Navigation arrows - highly visible
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        
        // Pagination dots
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
            dynamicBullets: true,
        },
        
        // Touch settings for smooth mobile experience
        touchEventsTarget: 'container',
        simulateTouch: true,
        touchRatio: 1,
        touchAngle: 45,
        grabCursor: true,
        
        // Prevent clicks during swipe
        preventClicks: false,
        preventClicksPropagation: false,
        slideToClickedSlide: false,
        
        // Smooth resistance at boundaries
        resistance: true,
        resistanceRatio: 0.3,
        
        // Smooth transitions
        speed: 400,
        effect: 'slide',
        
        // Enhanced breakpoints ensuring 3+ items visible
        breakpoints: {
            320: {
                slidesPerView: 3,
                spaceBetween: 12,
            },
            480: {
                slidesPerView: 3.2,
                spaceBetween: 16,
            },
            640: {
                slidesPerView: 3.5,
                spaceBetween: 18,
            },
            768: {
                slidesPerView: 4,
                spaceBetween: 20,
            },
            1024: {
                slidesPerView: 4.5,
                spaceBetween: 24,
            },
            1200: {
                slidesPerView: 5,
                spaceBetween: 28,
            }
        },
        
        // Loop for continuous scrolling
        loop: false,
        
        // Allow clicks on slides and their children
        allowTouchMove: true,
        allowSlideNext: true,
        allowSlidePrev: true,
        
        // Smooth scrollbar
        scrollbar: {
            el: '.swiper-scrollbar',
            draggable: true,
            hide: false,
        },
        
        // Events
        on: {
            init: function() {
                console.log('Enhanced Swiper initialized');
                // Ensure navigation buttons are visible
                this.navigation.update();
            },
            slideChange: function() {
                // Update navigation button states
                this.navigation.update();
            }
        }
    });
}

// Legacy functions removed - now handled by Swiper.js

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
    // Simplified network monitoring - no UI indicators
    // Only handle actual offline/online events without showing notifications
    
    window.addEventListener('online', () => {
        // Just log the event, no UI notifications
        console.log('Connection restored');
    });
    
    window.addEventListener('offline', () => {
        // Show only critical offline notifications
        showToast('Connection lost. Please check your internet.', 'error');
    });
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

// Legacy carousel functions removed - Swiper.js handles all navigation and touch events

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
