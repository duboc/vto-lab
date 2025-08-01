// Mobile-specific enhancements
(function() {
    'use strict';
    
    // Check if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (!isMobile && !hasTouch) return;
    
    // Mobile camera enhancements
    function enhanceMobileCamera() {
        const cameraPreview = document.getElementById('cameraPreview');
        const cameraSection = document.getElementById('cameraSection');
        
        if (!cameraPreview || !cameraSection) return;
        
        // Add fullscreen toggle for camera
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'btn-fullscreen-camera';
        fullscreenBtn.innerHTML = '⛶';
        fullscreenBtn.style.cssText = `
            position: absolute;
            top: 16px;
            right: 16px;
            background: rgba(255, 255, 255, 0.9);
            border: none;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            font-size: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            z-index: 100;
            cursor: pointer;
        `;
        
        fullscreenBtn.addEventListener('click', toggleCameraFullscreen);
        cameraSection.appendChild(fullscreenBtn);
        
        // Camera switcher for front/back
        const cameraSwitchBtn = document.createElement('button');
        cameraSwitchBtn.className = 'btn-switch-camera';
        cameraSwitchBtn.innerHTML = '🔄';
        cameraSwitchBtn.style.cssText = `
            position: absolute;
            top: 16px;
            left: 16px;
            background: rgba(255, 255, 255, 0.9);
            border: none;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            font-size: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            z-index: 100;
            cursor: pointer;
        `;
        
        cameraSwitchBtn.addEventListener('click', switchCamera);
        cameraSection.appendChild(cameraSwitchBtn);
    }
    
    let currentFacingMode = 'environment';
    
    async function switchCamera() {
        currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
        
        // Stop current stream
        if (window.stream) {
            window.stream.getTracks().forEach(track => track.stop());
        }
        
        // Start with new facing mode
        try {
            const constraints = {
                video: {
                    facingMode: currentFacingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };
            
            window.stream = await navigator.mediaDevices.getUserMedia(constraints);
            document.getElementById('cameraPreview').srcObject = window.stream;
            
            showToast(`Switched to ${currentFacingMode === 'user' ? 'front' : 'back'} camera`, 'info');
        } catch (error) {
            showToast('Failed to switch camera', 'error');
        }
    }
    
    function toggleCameraFullscreen() {
        const cameraSection = document.getElementById('cameraSection');
        
        if (!document.fullscreenElement) {
            cameraSection.requestFullscreen().catch(err => {
                showToast('Failed to enter fullscreen', 'error');
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    // Enhanced clothing selection for mobile
    function enhanceClothingSelection() {
        const clothingItems = document.querySelectorAll('.clothing-item');
        
        clothingItems.forEach(item => {
            // Add long press to preview - only if NOT in carousel track
            let pressTimer;
            let isLongPress = false;
            
            item.addEventListener('touchstart', (e) => {
                // Don't add long press if item is in carousel (conflicts with swipe)
                if (item.closest('.carousel-track')) {
                    return;
                }
                
                isLongPress = false;
                pressTimer = setTimeout(() => {
                    isLongPress = true;
                    // Haptic feedback
                    if ('vibrate' in navigator) {
                        navigator.vibrate(50);
                    }
                    
                    // Show preview
                    showClothingPreview(item);
                }, 800); // Increased delay to avoid conflicts
            });
            
            item.addEventListener('touchend', () => {
                clearTimeout(pressTimer);
                // Prevent click if it was a long press
                if (isLongPress) {
                    setTimeout(() => { isLongPress = false; }, 100);
                }
            });
            
            item.addEventListener('touchmove', () => {
                clearTimeout(pressTimer);
                isLongPress = false;
            });
            
            // Override click handler to check for long press
            item.addEventListener('click', (e) => {
                if (isLongPress) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        });
    }
    
    function showClothingPreview(item) {
        const img = item.querySelector('img');
        const itemName = item.querySelector('h4').textContent;
        
        const preview = document.createElement('div');
        preview.className = 'mobile-preview';
        preview.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.2s ease-out;
            padding: 20px;
        `;
        
        preview.innerHTML = `
            <img src="${img.src}" style="
                max-width: 90%;
                max-height: 70%;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            ">
            <h3 style="
                color: white;
                margin-top: 20px;
                font-size: 1.5rem;
            ">${itemName}</h3>
            <p style="
                color: rgba(255, 255, 255, 0.8);
                margin-top: 10px;
            ">Long press preview</p>
        `;
        
        preview.addEventListener('click', () => {
            preview.style.animation = 'fadeOut 0.2s ease-in';
            setTimeout(() => preview.remove(), 200);
        });
        
        document.body.appendChild(preview);
    }
    
    // Pull to refresh functionality
    function addPullToRefresh() {
        let touchStartY = 0;
        let touchEndY = 0;
        let isPulling = false;
        
        const pullIndicator = document.createElement('div');
        pullIndicator.className = 'pull-to-refresh';
        pullIndicator.style.cssText = `
            position: fixed;
            top: -60px;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 40px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: top 0.3s ease;
            z-index: 1000;
        `;
        pullIndicator.innerHTML = '↻';
        document.body.appendChild(pullIndicator);
        
        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                touchStartY = e.touches[0].clientY;
                isPulling = true;
            }
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!isPulling) return;
            
            touchEndY = e.touches[0].clientY;
            const pullDistance = touchEndY - touchStartY;
            
            if (pullDistance > 0 && pullDistance < 150) {
                pullIndicator.style.top = `${Math.min(pullDistance - 60, 20)}px`;
                pullIndicator.style.transform = `translateX(-50%) rotate(${pullDistance * 2}deg)`;
            }
        });
        
        document.addEventListener('touchend', () => {
            if (!isPulling) return;
            
            const pullDistance = touchEndY - touchStartY;
            
            if (pullDistance > 100) {
                pullIndicator.style.top = '20px';
                pullIndicator.style.transform = 'translateX(-50%) rotate(360deg)';
                
                // Refresh action
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                pullIndicator.style.top = '-60px';
                pullIndicator.style.transform = 'translateX(-50%) rotate(0deg)';
            }
            
            isPulling = false;
            touchStartY = 0;
            touchEndY = 0;
        });
    }
    
    // Swipe gestures for navigation
    function addSwipeGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            touchEndY = e.changedTouches[0].clientY;
            
            handleSwipe();
        });
        
        function handleSwipe() {
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;
            const threshold = 100;
            
            // Horizontal swipe
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
                if (diffX > 0) {
                    // Swipe left - could be used for navigation
                    console.log('Swipe left');
                } else {
                    // Swipe right - could be used for navigation
                    console.log('Swipe right');
                }
            }
        }
    }
    
    // Mobile-optimized image upload
    function enhanceImageUpload() {
        const imageInput = document.getElementById('imageInput');
        if (!imageInput) return;
        
        // Add capture attribute for direct camera access
        imageInput.setAttribute('capture', 'camera');
        
        // Handle image orientation
        imageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Check orientation and fix if needed
            const orientation = await getImageOrientation(file);
            if (orientation > 1) {
                const correctedFile = await correctImageOrientation(file, orientation);
                // Replace the file in the input
                const dt = new DataTransfer();
                dt.items.add(correctedFile);
                imageInput.files = dt.files;
            }
        });
    }
    
    // Helper functions for image orientation
    async function getImageOrientation(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const view = new DataView(e.target.result);
                if (view.getUint16(0, false) !== 0xFFD8) {
                    resolve(-2);
                    return;
                }
                
                const length = view.byteLength;
                let offset = 2;
                
                while (offset < length) {
                    const marker = view.getUint16(offset, false);
                    offset += 2;
                    
                    if (marker === 0xFFE1) {
                        if (view.getUint32(offset += 2, false) !== 0x45786966) {
                            resolve(-1);
                            return;
                        }
                        
                        const little = view.getUint16(offset += 6, false) === 0x4949;
                        offset += view.getUint32(offset + 4, little);
                        const tags = view.getUint16(offset, little);
                        offset += 2;
                        
                        for (let i = 0; i < tags; i++) {
                            if (view.getUint16(offset + (i * 12), little) === 0x0112) {
                                resolve(view.getUint16(offset + (i * 12) + 8, little));
                                return;
                            }
                        }
                    } else if ((marker & 0xFF00) !== 0xFF00) {
                        break;
                    } else {
                        offset += view.getUint16(offset, false);
                    }
                }
                resolve(-1);
            };
            reader.readAsArrayBuffer(file.slice(0, 64 * 1024));
        });
    }
    
    async function correctImageOrientation(file, orientation) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Set proper canvas dimensions
                if (orientation > 4) {
                    canvas.width = img.height;
                    canvas.height = img.width;
                } else {
                    canvas.width = img.width;
                    canvas.height = img.height;
                }
                
                // Transform context based on orientation
                switch (orientation) {
                    case 2: ctx.transform(-1, 0, 0, 1, canvas.width, 0); break;
                    case 3: ctx.transform(-1, 0, 0, -1, canvas.width, canvas.height); break;
                    case 4: ctx.transform(1, 0, 0, -1, 0, canvas.height); break;
                    case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
                    case 6: ctx.transform(0, 1, -1, 0, canvas.height, 0); break;
                    case 7: ctx.transform(0, -1, -1, 0, canvas.height, canvas.width); break;
                    case 8: ctx.transform(0, -1, 1, 0, 0, canvas.width); break;
                }
                
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob((blob) => {
                    const correctedFile = new File([blob], file.name, {
                        type: file.type,
                        lastModified: Date.now()
                    });
                    resolve(correctedFile);
                }, file.type, 0.95);
            };
            img.src = URL.createObjectURL(file);
        });
    }
    
    // Initialize all mobile enhancements
    document.addEventListener('DOMContentLoaded', () => {
        if (isMobile || hasTouch) {
            enhanceMobileCamera();
            enhanceClothingSelection();
            enhanceImageUpload();
            addPullToRefresh();
            addSwipeGestures();
            
            // Add mobile class to body
            document.body.classList.add('is-mobile');
            
            // Prevent double-tap zoom
            let lastTouchEnd = 0;
            document.addEventListener('touchend', (e) => {
                const now = Date.now();
                if (now - lastTouchEnd <= 300) {
                    e.preventDefault();
                }
                lastTouchEnd = now;
            }, false);
        }
    });
})();
