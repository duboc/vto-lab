// Global variables
let currentResultFilename = null;
let currentItemName = null;
let isZoomed = false;

// Initialize the results page
document.addEventListener('DOMContentLoaded', function() {
    initializeResultsPage();
    createToastContainer();
    addPageAnimations();
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
        '.original-section',
        '.results-grid-section',
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

// Toast notification system (matching main.js)
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
    
    if (resultCards.length === 0) {
        showToast('No results to download', 'warning');
        return;
    }
    
    showLoading('Preparing downloads...');
    
    let downloadCount = 0;
    const totalCount = resultCards.length;
    
    // Create progress toast
    showToast(`Downloading ${totalCount} results...`, 'info');
    
    resultCards.forEach((card, index) => {
        const img = card.querySelector('.result-image');
        const itemName = card.querySelector('.result-info h4').textContent.replace('Item ', '');
        const src = img.src;
        const filename = src.split('/').pop();
        
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = src;
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
    const originalImage = document.querySelector('.original-image');
    if (originalImage) {
        originalImage.classList.add('zoom-cursor');
        originalImage.addEventListener('click', () => toggleImageZoom(originalImage));
    }
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
            case 'v':
            case 'V':
                // View key - already in modal
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

// Touch/swipe gestures for mobile
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', function(e) {
    const modal = document.getElementById('fullSizeModal');
    if (modal.style.display === 'flex') {
        touchStartX = e.changedTouches[0].screenX;
    }
}, { passive: true });

document.addEventListener('touchend', function(e) {
    const modal = document.getElementById('fullSizeModal');
    if (modal.style.display === 'flex') {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }
}, { passive: true });

function handleSwipe() {
    const swipeThreshold = 50;
    const swipeDistance = touchEndX - touchStartX;
    
    if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0) {
            navigateModal('prev');
        } else {
            navigateModal('next');
        }
    }
}

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
