/* ============================================
   CHRISTMAS CAMERA GESTURE APP - MAIN SCRIPT
   ============================================ */

// DOM Elements
const videoFeed = document.getElementById('videoFeed');
const effectCanvas = document.getElementById('effectCanvas');
const loadingScreen = document.getElementById('loadingScreen');
const permissionScreen = document.getElementById('permissionScreen');
const btnEnableCamera = document.getElementById('btnEnableCamera');
const handStatus = document.getElementById('handStatus');
const snowContainer = document.getElementById('snowContainer');

// Canvas Context
const ctx = effectCanvas.getContext('2d');

// State
let isHandOpen = false;
let handPosition = { x: 0, y: 0 };
let particles = [];
let handDetected = false;
let lastGestureTime = 0;

// ============================================
// SNOW EFFECT
// ============================================
function createSnowflakes() {
    const snowflakes = ['❄', '❅', '❆', '✧', '✦'];
    
    for (let i = 0; i < 50; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = snowflakes[Math.floor(Math.random() * snowflakes.length)];
        snowflake.style.left = Math.random() * 100 + '%';
        snowflake.style.fontSize = (Math.random() * 1.5 + 0.5) + 'rem';
        snowflake.style.animationDuration = (Math.random() * 5 + 5) + 's';
        snowflake.style.animationDelay = (Math.random() * 10) + 's';
        snowflake.style.opacity = Math.random() * 0.6 + 0.4;
        snowContainer.appendChild(snowflake);
    }
}

createSnowflakes();

// ============================================
// PARTICLE SYSTEM - IRON MAN STAR BURST
// ============================================
class Particle {
    constructor(x, y, type = 'star') {
        this.x = x;
        this.y = y;
        this.type = type;
        
        // Random angle for radial explosion
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 8 + 4;
        this.velocityX = Math.cos(this.angle) * this.speed;
        this.velocityY = Math.sin(this.angle) * this.speed;
        
        // Size and life
        this.size = Math.random() * 4 + 2;
        this.life = 1;
        this.decay = Math.random() * 0.02 + 0.01;
        
        // Colors - Christmas theme
        const colors = [
            '#ffd700', // Gold
            '#ff6b6b', // Red
            '#4ecdc4', // Teal
            '#ffe066', // Light gold
            '#ff8c42', // Orange
            '#ffffff', // White
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        // Trail
        this.trail = [];
        this.maxTrailLength = 10;
        
        // Rotation
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }
    
    update() {
        // Save trail position
        this.trail.push({ x: this.x, y: this.y, size: this.size, life: this.life });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Slow down
        this.velocityX *= 0.98;
        this.velocityY *= 0.98;
        
        // Gravity effect (slight)
        this.velocityY += 0.05;
        
        // Update life
        this.life -= this.decay;
        
        // Rotation
        this.rotation += this.rotationSpeed;
    }
    
    draw(ctx) {
        // Draw trail
        this.trail.forEach((point, index) => {
            const alpha = (index / this.trail.length) * this.life * 0.5;
            const size = point.size * (index / this.trail.length);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        // Draw main particle
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.life;
        
        if (this.type === 'star') {
            this.drawStar(ctx, 0, 0, 5, this.size, this.size * 0.5);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.fill();
        
        ctx.restore();
    }
    
    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
    }
    
    isDead() {
        return this.life <= 0;
    }
}

// ============================================
// BURST EFFECT
// ============================================
function createBurst(x, y, count = 50) {
    for (let i = 0; i < count; i++) {
        const type = Math.random() > 0.3 ? 'star' : 'circle';
        particles.push(new Particle(x, y, type));
    }
}

function createContinuousBurst(x, y) {
    // Create smaller bursts continuously while hand is open
    for (let i = 0; i < 5; i++) {
        const offsetX = (Math.random() - 0.5) * 50;
        const offsetY = (Math.random() - 0.5) * 50;
        const type = Math.random() > 0.3 ? 'star' : 'circle';
        particles.push(new Particle(x + offsetX, y + offsetY, type));
    }
}

// ============================================
// ANIMATION LOOP
// ============================================
function animate() {
    // Clear canvas
    ctx.clearRect(0, 0, effectCanvas.width, effectCanvas.height);
    
    // Update and draw particles
    particles = particles.filter(particle => {
        particle.update();
        particle.draw(ctx);
        return !particle.isDead();
    });
    
    // If hand is open, create continuous particles
    if (isHandOpen && handDetected) {
        createContinuousBurst(handPosition.x, handPosition.y);
    }
    
    requestAnimationFrame(animate);
}

// ============================================
// HAND GESTURE DETECTION
// ============================================
function calculateHandOpenness(landmarks) {
    // Finger tip indices: thumb(4), index(8), middle(12), ring(16), pinky(20)
    // Finger base indices: thumb(2), index(5), middle(9), ring(13), pinky(17)
    
    const fingerTips = [4, 8, 12, 16, 20];
    const fingerBases = [2, 5, 9, 13, 17];
    
    let totalDistance = 0;
    
    // Calculate average distance from fingertips to palm center
    const palmCenter = landmarks[0]; // Wrist as reference
    
    for (let i = 0; i < fingerTips.length; i++) {
        const tip = landmarks[fingerTips[i]];
        const base = landmarks[fingerBases[i]];
        
        // Distance from tip to base
        const distance = Math.sqrt(
            Math.pow(tip.x - base.x, 2) + 
            Math.pow(tip.y - base.y, 2)
        );
        totalDistance += distance;
    }
    
    return totalDistance / fingerTips.length;
}

function getHandCenter(landmarks) {
    // Use middle finger MCP (index 9) as hand center
    const center = landmarks[9];
    return {
        x: center.x * effectCanvas.width,
        y: center.y * effectCanvas.height
    };
}

function onResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        handDetected = true;
        
        // Get hand position (mirrored for display)
        const center = getHandCenter(landmarks);
        handPosition.x = effectCanvas.width - center.x; // Mirror X
        handPosition.y = center.y;
        
        // Calculate openness
        const openness = calculateHandOpenness(landmarks);
        const threshold = 0.15; // Adjust this value to tune sensitivity
        
        const wasOpen = isHandOpen;
        isHandOpen = openness > threshold;
        
        // Update UI
        updateHandStatus(isHandOpen);
        
        // Trigger burst on state change (open hand)
        if (isHandOpen && !wasOpen) {
            const now = Date.now();
            if (now - lastGestureTime > 300) { // Debounce
                createBurst(handPosition.x, handPosition.y, 80);
                lastGestureTime = now;
            }
        }
    } else {
        handDetected = false;
        updateHandStatus(null);
    }
}

function updateHandStatus(open) {
    const statusIcon = handStatus.querySelector('.status-icon');
    const statusText = handStatus.querySelector('.status-text');
    
    handStatus.classList.remove('open', 'closed');
    
    if (open === null) {
        statusIcon.textContent = '👋';
        statusText.textContent = 'Đưa tay vào camera';
    } else if (open) {
        statusIcon.textContent = '✋';
        statusText.textContent = '✨ Phép màu đang xảy ra!';
        handStatus.classList.add('open');
    } else {
        statusIcon.textContent = '✊';
        statusText.textContent = 'Khép tay - Nghỉ ngơi';
        handStatus.classList.add('closed');
    }
}

// ============================================
// CAMERA & MEDIAPIPE SETUP
// ============================================
async function initializeCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            }
        });
        
        videoFeed.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
            videoFeed.onloadedmetadata = () => {
                videoFeed.play();
                resolve();
            };
        });
        
        // Set canvas size
        effectCanvas.width = videoFeed.videoWidth;
        effectCanvas.height = videoFeed.videoHeight;
        
        // Initialize MediaPipe Hands
        initializeMediaPipe();
        
    } catch (error) {
        console.error('Camera error:', error);
        loadingScreen.classList.add('hidden');
        permissionScreen.classList.remove('hidden');
    }
}

function initializeMediaPipe() {
    const hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });
    
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
    });
    
    hands.onResults(onResults);
    
    // Create camera
    const camera = new Camera(videoFeed, {
        onFrame: async () => {
            await hands.send({ image: videoFeed });
        },
        width: 1280,
        height: 720
    });
    
    camera.start().then(() => {
        loadingScreen.classList.add('hidden');
        animate(); // Start animation loop
    });
}

// ============================================
// EVENT LISTENERS
// ============================================
btnEnableCamera.addEventListener('click', () => {
    permissionScreen.classList.add('hidden');
    loadingScreen.classList.remove('hidden');
    initializeCamera();
});

// Handle window resize
window.addEventListener('resize', () => {
    if (videoFeed.videoWidth) {
        effectCanvas.width = videoFeed.videoWidth;
        effectCanvas.height = videoFeed.videoHeight;
    }
});

// ============================================
// INITIALIZE
// ============================================
// Check if camera permission is already granted
navigator.permissions.query({ name: 'camera' }).then((result) => {
    if (result.state === 'granted') {
        initializeCamera();
    } else {
        loadingScreen.classList.add('hidden');
        permissionScreen.classList.remove('hidden');
    }
}).catch(() => {
    // Fallback for browsers that don't support permissions API
    loadingScreen.classList.add('hidden');
    permissionScreen.classList.remove('hidden');
});
