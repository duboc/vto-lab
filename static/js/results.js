// Global variables
let currentResultFilename = null;
let currentItemName = null;
let isZoomed = false;
let currentSlideIndex = 0;
let isCarouselTransitioning = false;
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let isDragging = false;
let startDragX = 0;
let currentTranslateX = 0;
let dragOffset = 0;

// Initialize the results page
document.addEventListener('DOMContentLoaded', function() {
    initializeResultsPage();
    createToastContainer();
    addPageAnimations();
    initializeCarousel();
});

function initializeResultsPage() {
    // Add entrance animations to elements
    animatePageElements();
    
    // Setup result cards
    const resultCards = document.querySelectorAll('.result-card');
    resultCards.forEach((card, index) => {
        // Add staggered animation
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-in');
        
        if (!card.classList.contains('error-card')) {
            setupResultCardEvents(card);
        }
    });
    
    // Setup keyboard navigation
    document.addEventListener('keydown', handleKeyboardEvents);
    
    // Add image zoom functionality
    setupImageZoom();
    
    // Add tooltips
    setupTooltips();
}

// Initialize carousel functionality
function initializeCarousel() {
    const track = document.getElementById('resultsCarouselTrack');
    const slides = track.querySelectorAll('.carousel-result-slide');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    
    // Create indicators
    createCarouselIndicators(slides.length);
    
    // Set initial slide
    updateCarousel();
    
    // Navigation buttons
    prevBtn.addEventListener('click', () => navigateCarousel('prev'));
    nextBtn.addEventListener('click', () => navigateCarousel('next'));
    
    // Touch/swipe support
    setupTouchSupport(track);
    
    // Mouse drag support for desktop
    setupMouseDragSupport(track);
    
    // Keyboard support when carousel is visible
    document.addEventListener('keydown', (e) => {
        const carouselSection = document.querySelector('.results-carousel-section');
        if (carouselSection && carouselSection.style.display !== 'none') {
            if (e.key === 'ArrowLeft') {
                navigateCarousel('prev');
            } else if (e.key === 'ArrowRight') {
                navigateCarousel('next');
            }
        }
    });
}

// Create carousel indicators
function createCarouselIndicators(count) {
    const indicatorsContainer = document.getElementById('carouselIndicators');
    indicatorsContainer.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const indicator = document.createElement('button');
        indicator.className = 'carousel-indicator';
        indicator.setAttribute('aria-label', `Go to slide ${i + 1}`);
        indicator.addEventListener('click', () => goToSlide(i));
        
        if (i === 0) {
            indicator.classList.add('active');
        }
        
        indicatorsContainer.appendChild(indicator);
    }
}

// Navigate carousel
function navigateCarousel(direction) {
    if (isCarouselTransitioning) return;
    
    const track = document.getElementById('resultsCarouselTrack');
    const slides = track.querySelectorAll('.carousel-result-slide');
    const totalSlides = slides.length;
    
    if (direction === 'next') {
        currentSlideIndex = (currentSlideIndex + 1) % totalSlides;
    } else {
        currentSlideIndex = (currentSlideIndex - 1 + totalSlides) % totalSlides;
    }
    
    updateCarousel();
}

// Go to specific slide
function goToSlide(index) {
    if (isCarouselTransitioning || index === currentSlideIndex) return;
    
    currentSlideIndex = index;
    updateCarousel();
}

// Update carousel position
function updateCarousel() {
    const track = document.getElementById('resultsCarouselTrack');
    const slides = track.querySelectorAll('.carousel-result-slide');
    const indicators = document.querySelectorAll('.carousel-indicator');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    
    // Start transition
    isCarouselTransitioning = true;
    track.classList.add('transitioning');
    
    // Calculate translation
    const slideWidth = slides[0].offsetWidth;
    const gap = 32; // Gap between slides in pixels
    const translateX = -(currentSlideIndex * (slideWidth + gap));
    
    // Apply transform
    track.style.transform = `translateX(${translateX}px)`;
    
    // Update indicators
    indicators.forEach((indicator, index) => {
        indicator.classList.remove('active', 'transitioning');
        if (index === currentSlideIndex) {
            indicator.classList.add('active', 'transitioning');
        }
    });
    
    // Update navigation buttons state
    prevBtn.disabled = currentSlideIndex === 0;
    nextBtn.disabled = currentSlideIndex === slides.length - 1;
    
    // End transition
    setTimeout(() => {
        isCarouselTransitioning = false;
        track.classList.remove('transitioning');
    }, 500);
}

// Touch support for mobile
function setupTouchSupport(track) {
    track.addEventListener('touchstart', handleTouchStart, { passive: true });
    track.addEventListener('touchmove', handleTouchMove, { passive: true });
    track.addEventListener('touchend', handleTouchEnd, { passive: true });
}

function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isDragging = true;
    
    const track = document.getElementById('resultsCarouselTrack');
    track.classList.add('dragging');
}

function handleTouchMove(e) {
    if (!isDragging) return;
    
    touchEndX = e.touches[0].clientX;
    touchEndY = e.touches[0].clientY;
    
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    // Only handle horizontal swipes
    if (Math.abs(diffX) > Math.abs(diffY)) {
        e.preventDefault();
        
        const track = document.getElementById('resultsCarouselTrack');
        const slides = track.querySelectorAll('.carousel-result-slide');
        const slideWidth = slides[0].offsetWidth;
        const gap = 32;
        const currentTranslate = -(currentSlideIndex * (slideWidth + gap));
        
        // Apply real-time drag effect with resistance at edges
        let dragDistance = diffX * 0.5; // Reduce sensitivity
        
        // Add resistance at edges
        if ((currentSlideIndex === 0 && diffX > 0) || 
            (currentSlideIndex === slides.length - 1 && diffX < 0)) {
            dragDistance *= 0.3;
        }
        
        track.style.transform = `translateX(${currentTranslate + dragDistance}px)`;
    }
}

function handleTouchEnd(e) {
    if (!isDragging) return;
    
    isDragging = false;
    const track = document.getElementById('resultsCarouselTrack');
    track.classList.remove('dragging');
    
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    // Determine if it was a swipe
    const threshold = 50;
    
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
        if (diffX > 0) {
            navigateCarousel('prev');
        } else {
            navigateCarousel('next');
        }
    } else {
        // Snap back to current slide
        updateCarousel();
    }
}

// Mouse drag support for desktop
function setupMouseDragSupport(track) {
    let isMouseDown = false;
    
    track.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        startDragX = e.clientX;
        track.classList.add('dragging');
        track.style.cursor = 'grabbing';
        e.preventDefault();
    });
    
    track.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        
        const diffX = e.clientX - startDragX;
        const track = document.getElementById('resultsCarouselTrack');
        const slides = track.querySelectorAll('.carousel-result-slide');
        const slideWidth = slides[0].offsetWidth;
        const gap = 32;
        const currentTranslate = -(currentSlideIndex * (slideWidth + gap));
        
        // Apply drag with resistance
        let dragDistance = diffX * 0.5;
        
        if ((currentSlideIndex === 0 && diffX > 0) || 
            (currentSlideIndex === slides.length - 1 && diffX < 0)) {
            dragDistance *= 0.3;
        }
        
        track.style.transform = `translateX(${currentTranslate + dragDistance}px)`;
    });
    
    const handleMouseUp = (e) => {
        if (!isMouseDown) return;
        
        isMouseDown = false;
        track.classList.remove('dragging');
        track.style.cursor = '';
        
        const diffX = e.clientX - startDragX;
        const threshold = 50;
        
        if (Math.abs(diffX) > threshold) {
            if (diffX > 0) {
                navigateCarousel('prev');
            } else {
                navigateCarousel('next');
            }
        } else {
            updateCarousel();
        }
    };
    
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseUp);
}

// View mode toggle
function setViewMode(mode) {
    const carouselSection = document.querySelector('.results-carousel-section');
    const gridSection = document.querySelector('.results-grid-section');
    const toggleButtons = document.querySelectorAll('.btn-view-toggle');
    
    toggleButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-view') === mode) {
            btn.classList.add('active');
        }
    });
    
    if (mode === 'carousel') {
        carouselSection.style.display = 'block';
        gridSection.style.display = 'none';
        updateCarousel(); // Ensure carousel is properly positioned
    } else {
        carouselSection.style.display = 'none';
        gridSection.style.display = 'block';
    }
}

// Page animations
function addPageAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes animateIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
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
        
        @keyframes zoomIn {
            from {
                transform: scale(0.8);
                opacity: 0;
            }
            to {
                transform: scale(1);
                opacity: 1;
            }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        .animate-in {
            animation: animateIn 0.5s ease-out forwards;
            opacity: 0;
        }
        
        .zoom-cursor {
            cursor: zoom-in !important;
        }
        
        .zoomed {
            cursor: zoom-out !important;
        }
        
        .tooltip {
            position: absolute;
            background: var(--gray-800);
            color: white;
            padding: 6px 12px;
            border-radius: var(--radius-md);
            font-size: 0.875rem;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
            z-index: 1000;
            white-space: nowrap;
        }
        
        .tooltip.show {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
}

function animatePageElements() {
    // Animate sections in sequence
    const sections = [
        '.results-summary',
        '.results-carousel-section',
        '.results-actions'
    ];
    
    sections.forEach((selector, index) => {
        const element = document.querySelector(selector);
        if (element) {
            element.style.animationDelay = `${index * 0.15}s`;
            element.classList.add('animate-in');
        }
    });
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
    `;
    document.body.appendChild(toastContainer);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
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
        border-radius: 12px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        max-width: 500px;
        border-left: 4px solid ${colors[type]};
        animation: slideInRight 0.3s ease-out;
        position: relative;
    `;
    
    toast.innerHTML = `
        <span style="color: ${colors[type]}; font-size: 1.25rem; font-weight: bold;">${icons[type]}</span>
        <span style="color: #374151; font-size: 0.95rem; flex: 1;">${message}</span>
        <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            color: #9ca3af;
            cursor: pointer;
            padding: 0;
            font-size: 1.25rem;
            margin-left: 12px;
            transition: color 0.2s;
        " onmouseover="this.style.color='#374151'" onmouseout="this.style.color='#9ca3af'">&times;</button>
    `;
    
    document.getElementById('toastContainer').appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Enhanced result card events
function setupResultCardEvents(card) {
    // Add hover effects
    card.addEventListener('mouseenter', () => {
        const overlay = card.querySelector('.result-overlay');
        if (overlay) {
            overlay.style.animation = 'fadeIn 0.2s ease-out';
        }
    });
    
    // Make entire card clickable
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn')) {
            const img = card.querySelector('.result-image');
            const itemName = card.querySelector('.result-info h4').textContent.replace('Item ', '');
            const filename = img.src.split('/').pop();
            viewFullResult(filename, itemName);
        }
    });
}

// Modal functionality
function viewFullResult(resultFilename, itemName) {
    currentResultFilename = resultFilename;
    currentItemName = itemName;
    
    const modal = document.getElementById('fullSizeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalResultImage = document.getElementById('modalResultImage');
    const modalDownloadBtn = document.getElementById('modalDownloadBtn');
    
    // Set modal content
    modalTitle.textContent = `Try-On Result - Item ${itemName}`;
    modalResultImage.src = `/result/${resultFilename}`;
    
    // Update download button
    modalDownloadBtn.onclick = () => downloadResult(resultFilename, itemName);
    
    // Show modal with animation
    modal.style.display = 'flex';
    modal.style.animation = 'fadeIn 0.3s ease-out';
    
    // Add navigation indicators
    addModalNavigationIndicators();
    
    // Focus on modal for accessibility
    modal.focus();
}

function closeModal() {
    const modal = document.getElementById('fullSizeModal');
    modal.style.animation = 'fadeOut 0.3s ease-in';
    
    setTimeout(() => {
        modal.style.display = 'none';
        modal.style.animation = '';
        currentResultFilename = null;
        currentItemName = null;
    }, 300);
}

// Add navigation indicators to modal
function addModalNavigationIndicators() {
    const modalBody = document.querySelector('.modal-body');
    const resultCards = document.querySelectorAll('.result-card:not(.error-card)');
    
    if (resultCards.length <= 1) return;
    
    // Remove existing indicators
    const existingNav = modalBody.querySelector('.modal-navigation');
    if (existingNav) existingNav.remove();
    
    // Create navigation hint
    const navHint = document.createElement('div');
    navHint.className = 'modal-navigation';
    navHint.style.cssText = `
        text-align: center;
        margin-top: 20px;
        color: #6b7280;
        font-size: 0.875rem;
    `;
    navHint.innerHTML = `
        <span style="display: inline-flex; align-items: center; gap: 20px;">
            <span>← Previous</span>
            <span style="color: #374151; font-weight: 600;">Use arrow keys to navigate</span>
            <span>Next →</span>
        </span>
    `;
    
    modalBody.appendChild(navHint);
}

// Download functionality
function downloadResult(resultFilename, itemName) {
    const link = document.createElement('a');
    link.href = `/result/${resultFilename}`;
    link.download = `virtual_tryon_item_${itemName}.jpg`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show feedback
    showToast(`Downloading Item ${itemName}`, 'success');
}

function downloadAllResults() {
    const resultCards = document.querySelectorAll('.result-card:not(.error-card)');
    const carouselSlides = document.querySelectorAll('.carousel-result-slide:not(.original-slide):not(.error-slide)');
    
    // Use carousel slides if in carousel view, otherwise use grid cards
    const items = carouselSlides.length > 0 ? carouselSlides : resultCards;
    
    if (items.length === 0) {
        showToast('No results to download', 'warning');
        return;
    }
    
    showLoading('Preparing downloads...');
    
    let downloadCount = 0;
    const totalCount = items.length;
    
    // Create progress toast
    showToast(`Downloading ${totalCount} results...`, 'info');
    
    items.forEach((item, index) => {
        let img, itemName, filename;
        
        if (item.classList.contains('carousel-result-slide')) {
            img = item.querySelector('.result-image');
            itemName = img.getAttribute('data-item-name');
            filename = img.getAttribute('data-filename');
        } else {
            img = item.querySelector('.result-image');
            itemName = item.querySelector('.result-info h4').textContent.replace('Item ', '');
            filename = img.src.split('/').pop();
        }
        
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = `/result/${filename}`;
            link.download = `virtual_tryon_item_${itemName}.jpg`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            downloadCount++;
            
            if (downloadCount === totalCount) {
                hideLoading();
                showToast(`All ${downloadCount} results downloaded successfully!`, 'success');
            }
        }, index * 300); // Stagger downloads
    });
}

// Image zoom functionality
function setupImageZoom() {
    const originalImages = document.querySelectorAll('.original-image');
    originalImages.forEach(img => {
        img.classList.add('zoom-cursor');
        img.addEventListener('click', () => toggleImageZoom(img));
    });
}

function toggleImageZoom(img) {
    if (isZoomed) {
        // Remove zoom
        const zoomOverlay = document.querySelector('.zoom-overlay');
        if (zoomOverlay) {
            zoomOverlay.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => zoomOverlay.remove(), 300);
        }
        isZoomed = false;
    } else {
        // Create zoom overlay
        const zoomOverlay = document.createElement('div');
        zoomOverlay.className = 'zoom-overlay';
        zoomOverlay.style.cssText = `
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
        
        const zoomedImg = document.createElement('img');
        zoomedImg.src = img.src;
        zoomedImg.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            border-radius: 12px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            animation: zoomIn 0.3s ease-out;
        `;
        
        zoomOverlay.appendChild(zoomedImg);
        zoomOverlay.addEventListener('click', () => toggleImageZoom());
        document.body.appendChild(zoomOverlay);
        
        isZoomed = true;
    }
}

// Tooltips
function setupTooltips() {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    document.body.appendChild(tooltip);
    
    // Add tooltips to buttons
    const tooltipTargets = [
        { selector: '.btn-view', text: 'View full size (V)' },
        { selector: '.btn-download', text: 'Download image (D)' },
        { selector: '.btn-fullscreen', text: 'View fullscreen' },
        { selector: '.btn-slide-action.btn-download', text: 'Download this result' },
        { selector: '.original-image', text: 'Click to zoom' }
    ];
    
    tooltipTargets.forEach(target => {
        const elements = document.querySelectorAll(target.selector);
        elements.forEach(el => {
            el.addEventListener('mouseenter', (e) => showTooltip(e, target.text));
            el.addEventListener('mouseleave', hideTooltip);
        });
    });
}

function showTooltip(e, text) {
    const tooltip = document.querySelector('.tooltip');
    tooltip.textContent = text;
    tooltip.classList.add('show');
    
    const rect = e.target.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - 35}px`;
    tooltip.style.transform = 'translateX(-50%)';
}

function hideTooltip() {
    const tooltip = document.querySelector('.tooltip');
    tooltip.classList.remove('show');
}

// Keyboard event handling
function handleKeyboardEvents(e) {
    const modal = document.getElementById('fullSizeModal');
    
    if (modal.style.display === 'flex') {
        switch (e.key) {
            case 'Escape':
                closeModal();
                break;
            case 'ArrowLeft':
                navigateModal('prev');
                break;
            case 'ArrowRight':
                navigateModal('next');
                break;
            case 'd':
            case 'D':
                if (currentResultFilename && currentItemName) {
                    downloadResult(currentResultFilename, currentItemName);
                }
                break;
        }
    } else {
        // Global shortcuts when modal is closed
        if ((e.key === 'd' || e.key === 'D') && e.ctrlKey) {
            e.preventDefault();
            downloadAllResults();
        }
    }
}

// Modal navigation
function navigateModal(direction) {
    const resultCards = Array.from(document.querySelectorAll('.result-card:not(.error-card)'));
    
    if (resultCards.length <= 1) return;
    
    // Find current result index
    let currentIndex = -1;
    resultCards.forEach((card, index) => {
        const img = card.querySelector('.result-image');
        const filename = img.src.split('/').pop();
        if (filename === currentResultFilename) {
            currentIndex = index;
        }
    });
    
    if (currentIndex === -1) return;
    
    // Calculate next index
    let nextIndex;
    if (direction === 'next') {
        nextIndex = (currentIndex + 1) % resultCards.length;
    } else {
        nextIndex = (currentIndex - 1 + resultCards.length) % resultCards.length;
    }
    
    // Get next result info
    const nextCard = resultCards[nextIndex];
    const nextImg = nextCard.querySelector('.result-image');
    const nextItemName = nextCard.querySelector('.result-info h4').textContent.replace('Item ', '');
    const nextFilename = nextImg.src.split('/').pop();
    
    // Animate transition
    const modalImage = document.getElementById('modalResultImage');
    modalImage.style.animation = 'fadeOut 0.2s ease-in';
    
    setTimeout(() => {
        viewFullResult(nextFilename, nextItemName);
        modalImage.style.animation = 'fadeIn 0.2s ease-out';
    }, 200);
}

// Utility functions
function showLoading(message = 'Loading...') {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
        loadingOverlay.querySelector('p').textContent = message;
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// Click outside modal to close
document.addEventListener('click', function(e) {
    const modal = document.getElementById('fullSizeModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Add fadeIn/fadeOut animations if not already defined
const animationStyle = document.createElement('style');
animationStyle.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(animationStyle);

// Handle window resize for carousel
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const carouselSection = document.querySelector('.results-carousel-section');
        if (carouselSection && carouselSection.style.display !== 'none') {
            updateCarousel();
        }
    }, 250);
});
