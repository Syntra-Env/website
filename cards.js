// Holographic Card Effect
// Based on techniques from pokemon-cards-css by simeydotme
// Tracks mouse position and updates CSS variables for realistic light refraction

document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.tarot-card:not(.placeholder)');
    
    cards.forEach(card => {
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            
            // Get mouse position relative to card (0-100)
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            // Clamp values
            const clampedX = Math.max(0, Math.min(100, x));
            const clampedY = Math.max(0, Math.min(100, y));
            
            // Calculate center offset (-50 to 50)
            const centerX = clampedX - 50;
            const centerY = clampedY - 50;
            
            // Calculate distance from center (0-1)
            const distanceFromCenter = Math.min(
                Math.sqrt(centerX * centerX + centerY * centerY) / 50,
                1
            );
            
            // DEBUG: Add visual indicators to understand the coordinate system
            console.log(`Mouse at: (${x.toFixed(1)}, ${y.toFixed(1)}), Center: (${centerX.toFixed(1)}, ${centerY.toFixed(1)})`);

            // Calculate rotation - let's test each corner individually
            let rotateX, rotateY;

            if (centerX < 0 && centerY < 0) {
                // Top-left quadrant
				// 
                rotateX = centerX / 3.5; // Horizontal movement affects X rotation
                rotateY = -centerY / 3.5; // Inverted: top should be positive Y rotation
                console.log('Top-left: rotateX=' + rotateX.toFixed(2) + ', rotateY=' + rotateY.toFixed(2));
            } else if (centerX > 0 && centerY < 0) {
                // Top-right quadrant
                rotateX = centerX / 3.5; // Horizontal movement affects X rotation
                rotateY = -centerY / 3.5; // Inverted: top should be positive Y rotation
                console.log('Top-right: rotateX=' + rotateX.toFixed(2) + ', rotateY=' + rotateY.toFixed(2));
            } else if (centerX < 0 && centerY > 0) {
                // Bottom-left quadrant
                rotateX = centerX / 3.5; // Horizontal movement affects X rotation
                rotateY = -centerY / 3.5; // Inverted: bottom should be negative Y rotation
                console.log('Bottom-left: rotateX=' + rotateX.toFixed(2) + ', rotateY=' + rotateY.toFixed(2));
            } else {
                // Bottom-right quadrant
                rotateX = centerX / 3.5; // Horizontal movement affects X rotation
                rotateY = -centerY / 3.5; // Inverted: bottom should be negative Y rotation
                console.log('Bottom-right: rotateX=' + rotateX.toFixed(2) + ', rotateY=' + rotateY.toFixed(2));
            }

            // Calculate viewing angle for iridescence (how much the surface is tilted)
            const viewingAngle = Math.atan2(Math.abs(centerY), Math.abs(centerX)) * (180 / Math.PI);
            const tiltIntensity = distanceFromCenter;
            
            // Calculate background position for gradient shift (maps to 37-63% range)
            const bgX = 37 + (clampedX / 100) * 26;
            const bgY = 33 + (clampedY / 100) * 34;
            
            // Update CSS variables on the card element
            card.style.setProperty('--pointer-x', `${clampedX}%`);
            card.style.setProperty('--pointer-y', `${clampedY}%`);
            card.style.setProperty('--pointer-from-center', distanceFromCenter.toFixed(3));
            card.style.setProperty('--pointer-from-left', (clampedX / 100).toFixed(3));
            card.style.setProperty('--pointer-from-top', (clampedY / 100).toFixed(3));
            card.style.setProperty('--card-opacity', '1');
            card.style.setProperty('--rotate-x', `${rotateX}deg`);
            card.style.setProperty('--rotate-y', `${rotateY}deg`);
            card.style.setProperty('--background-x', `${bgX}%`);
            card.style.setProperty('--background-y', `${bgY}%`);
            card.style.setProperty('--viewing-angle', `${viewingAngle}deg`);
            card.style.setProperty('--tilt-intensity', tiltIntensity.toFixed(3));
        });
        
        card.addEventListener('mouseleave', () => {
            // Reset all values with transition
            card.style.setProperty('--card-opacity', '0');
            card.style.setProperty('--rotate-x', '0deg');
            card.style.setProperty('--rotate-y', '0deg');
            card.style.setProperty('--pointer-x', '50%');
            card.style.setProperty('--pointer-y', '50%');
            card.style.setProperty('--pointer-from-center', '0');
            card.style.setProperty('--background-x', '50%');
            card.style.setProperty('--background-y', '50%');
            card.style.setProperty('--viewing-angle', '0deg');
            card.style.setProperty('--tilt-intensity', '0');
        });

        // Click animation - card flies to center, spins and zooms
        const cardLink = card.querySelector('.card-rotator');
        cardLink.addEventListener('click', (e) => {
            e.preventDefault();
            const href = cardLink.href;

            // Get card's current position
            const rect = card.getBoundingClientRect();
            const cardCenterX = rect.left + rect.width / 2;
            const cardCenterY = rect.top + rect.height / 2;

            // Calculate translation to viewport center
            const viewportCenterX = window.innerWidth / 2;
            const viewportCenterY = window.innerHeight / 2;
            const translateX = viewportCenterX - cardCenterX;
            const translateY = viewportCenterY - cardCenterY;

            // Create animation timeline
            const tl = gsap.timeline({
                onComplete: () => {
                    window.location.href = href;
                }
            });

            // Disable hover effects during animation
            card.style.pointerEvents = 'none';

            // Animate card to center, lift it forward
            tl.to(card, {
                x: translateX,
                y: translateY,
                scale: 1.2,
                z: 200,
                duration: 0.5,
                ease: "power2.inOut"
            }, 0);

            // Spin and zoom in - one full rotation
            tl.to(cardLink, {
                rotateY: 360,
                scale: 3,
                duration: 1.0,
                ease: "linear"
            }, 0);

            // Fade out everything else
            tl.to('.app-grid', {
                opacity: 0,
                duration: 0.4,
                ease: "power2.out"
            }, 0.5);
        });
    });
});
