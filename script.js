document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropZone = document.getElementById('dropZone');
    const imageInput = document.getElementById('imageInput');
    const fileNameDisplay = document.getElementById('fileName');
    const widthRange = document.getElementById('widthRange');
    const sizeValue = document.getElementById('sizeValue');
    const beadSizeRange = document.getElementById('beadSizeRange');
    const beadSizeValue = document.getElementById('beadSizeValue');
    const generateBtn = document.getElementById('generateBtn');
    const saveBtn = document.getElementById('saveBtn');
    const resultCanvas = document.getElementById('resultCanvas');
    const previewContainer = document.getElementById('previewContainer');
    const placeholderText = document.querySelector('.placeholder-text');
    const beadStats = document.getElementById('beadStats');
    const beadList = document.getElementById('beadList');
    const pixelTooltip = document.getElementById('pixelTooltip');
    
    // Grid Settings
    const showGridCheck = document.getElementById('showGrid');
    const gridIntervalRange = document.getElementById('gridInterval');
    const gridIntervalVal = document.getElementById('gridIntervalVal');

    // State
    let currentFile = null;
    let originalImage = new Image();
    let pixelMap = []; // Stores {colorId, x, y} for hover
    
    // Constants
    let BEAD_SIZE = 15; // Pixel size for bead drawing (adjustable)
    
    // Standard Bead Palette (Generic 48 Colors)
    const BEAD_PALETTE = [
        {id: 'C01', name: '白色', hex: '#FFFFFF'}, {id: 'C02', name: '黑色', hex: '#000000'},
        {id: 'C03', name: '灰色', hex: '#808080'}, {id: 'C04', name: '深灰', hex: '#404040'},
        {id: 'C05', name: '浅灰', hex: '#C0C0C0'}, {id: 'C06', name: '红色', hex: '#FF0000'},
        {id: 'C07', name: '深红', hex: '#8B0000'}, {id: 'C08', name: '粉红', hex: '#FFC0CB'},
        {id: 'C09', name: '桃红', hex: '#FF69B4'}, {id: 'C10', name: '橙色', hex: '#FFA500'},
        {id: 'C11', name: '深橙', hex: '#FF8C00'}, {id: 'C12', name: '黄色', hex: '#FFFF00'},
        {id: 'C13', name: '柠檬黄', hex: '#FFFACD'}, {id: 'C14', name: '金黄', hex: '#FFD700'},
        {id: 'C15', name: '绿色', hex: '#008000'}, {id: 'C16', name: '深绿', hex: '#006400'},
        {id: 'C17', name: '草绿', hex: '#7CFC00'}, {id: 'C18', name: '青色', hex: '#00FFFF'},
        {id: 'C19', name: '天蓝', hex: '#87CEEB'}, {id: 'C20', name: '蓝色', hex: '#0000FF'},
        {id: 'C21', name: '深蓝', hex: '#00008B'}, {id: 'C22', name: '紫色', hex: '#800080'},
        {id: 'C23', name: '浅紫', hex: '#E6E6FA'}, {id: 'C24', name: '深紫', hex: '#4B0082'},
        {id: 'C25', name: '棕色', hex: '#A52A2A'}, {id: 'C26', name: '巧克力', hex: '#D2691E'},
        {id: 'C27', name: '浅棕', hex: '#DEB887'}, {id: 'C28', name: '米色', hex: '#F5F5DC'},
        {id: 'C29', name: '肉色', hex: '#FFE4C4'}, {id: 'C30', name: '洋红', hex: '#FF00FF'},
        {id: 'C31', name: '青绿', hex: '#00FF7F'}, {id: 'C32', name: '橄榄', hex: '#808000'},
        {id: 'C33', name: '藏青', hex: '#000080'}, {id: 'C34', name: '蓝绿', hex: '#008080'},
        {id: 'C35', name: '栗色', hex: '#800000'}, {id: 'C36', name: '紫罗兰', hex: '#EE82EE'},
        {id: 'C37', name: '番茄红', hex: '#FF6347'}, {id: 'C38', name: '珊瑚色', hex: '#FF7F50'},
        {id: 'C39', name: '卡其色', hex: '#F0E68C'}, {id: 'C40', name: '薰衣草', hex: '#E6E6FA'},
        {id: 'C41', name: '薄荷绿', hex: '#98FB98'}, {id: 'C42', name: '深青', hex: '#008B8B'},
        {id: 'C43', name: '浅粉', hex: '#FFB6C1'}, {id: 'C44', name: '靛蓝', hex: '#4B0082'},
        {id: 'C45', name: '象牙白', hex: '#FFFFF0'}, {id: 'C46', name: '荧光绿', hex: '#00FF00'},
        {id: 'C47', name: '荧光粉', hex: '#FF1493'}, {id: 'C48', name: '荧光橙', hex: '#FF4500'}
    ];

    // Helper: Hex to RGB
    function hexToRgb(hex) {
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        return {r, g, b};
    }

    // Pre-calculate RGB for palette
    BEAD_PALETTE.forEach(color => {
        color.rgb = hexToRgb(color.hex);
    });

    // Helper: Color Distance (Euclidean)
    function getColorDistance(rgb1, rgb2) {
        return Math.sqrt(
            Math.pow(rgb1.r - rgb2.r, 2) + 
            Math.pow(rgb1.g - rgb2.g, 2) + 
            Math.pow(rgb1.b - rgb2.b, 2)
        );
    }

    // Helper: Find Nearest Color
    function findNearestColor(r, g, b) {
        let minDist = Infinity;
        let nearest = BEAD_PALETTE[0];
        
        for (const color of BEAD_PALETTE) {
            const dist = getColorDistance({r, g, b}, color.rgb);
            if (dist < minDist) {
                minDist = dist;
                nearest = color;
            }
        }
        return nearest;
    }

    // Event Listeners
    // Drag & Drop
    dropZone.addEventListener('click', () => imageInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    imageInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    // Settings
    widthRange.addEventListener('input', (e) => {
        sizeValue.textContent = e.target.value;
    });

    beadSizeRange.addEventListener('input', (e) => {
        BEAD_SIZE = parseInt(e.target.value);
        beadSizeValue.textContent = BEAD_SIZE;
        if (!generateBtn.disabled) generateResult();
    });

    // Grid Settings
    showGridCheck.addEventListener('change', () => {
        if (!generateBtn.disabled) generateResult();
    });

    gridIntervalRange.addEventListener('input', (e) => {
        gridIntervalVal.textContent = e.target.value;
        if (!generateBtn.disabled) generateResult();
    });

    // Generate & Save
    generateBtn.addEventListener('click', generateResult);
    saveBtn.addEventListener('click', saveResult);

    // Canvas Hover Interaction
    resultCanvas.addEventListener('mousemove', (e) => {
        const rect = resultCanvas.getBoundingClientRect();
        const scaleX = resultCanvas.width / rect.width;
        const scaleY = resultCanvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // Calculate grid position
        const gridX = Math.floor(x / BEAD_SIZE);
        const gridY = Math.floor(y / BEAD_SIZE);

        if (gridX >= 0 && gridY >= 0 && pixelMap[gridY] && pixelMap[gridY][gridX]) {
            const colorInfo = pixelMap[gridY][gridX];
            
            // Show Tooltip
            pixelTooltip.style.display = 'block';
            pixelTooltip.style.left = `${e.clientX + 15}px`;
            pixelTooltip.style.top = `${e.clientY + 15}px`;
            pixelTooltip.innerHTML = `
                <span class="tooltip-swatch" style="background-color: ${colorInfo.hex}"></span>
                ${colorInfo.id} ${colorInfo.name}
            `;
        } else {
            pixelTooltip.style.display = 'none';
        }
    });

    resultCanvas.addEventListener('mouseleave', () => {
        pixelTooltip.style.display = 'none';
    });

    // Functions
    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('请上传图片文件');
            return;
        }
        currentFile = file;
        fileNameDisplay.textContent = file.name;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            originalImage.onload = () => {
                generateBtn.disabled = false;
                // Auto generate preview on load
                generateResult();
            };
            originalImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function generateResult() {
        if (!originalImage.src) return;

        placeholderText.style.display = 'none';
        saveBtn.disabled = false;
        
        const width = parseInt(widthRange.value);
        const aspectRatio = originalImage.height / originalImage.width;
        const height = Math.floor(width * aspectRatio);

        // Create offscreen canvas for resizing
        const offCanvas = document.createElement('canvas');
        offCanvas.width = width;
        offCanvas.height = height;
        const ctx = offCanvas.getContext('2d');
        ctx.drawImage(originalImage, 0, 0, width, height);
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        renderBead(data, width, height);
    }

    function renderBead(data, width, height) {
        // Show canvas
        resultCanvas.style.display = 'block';
        beadStats.style.display = 'block';

        // Reset Pixel Map
        pixelMap = Array(height).fill().map(() => Array(width).fill(null));
        const colorCounts = {};

        // Set main canvas size
        resultCanvas.width = width * BEAD_SIZE;
        resultCanvas.height = height * BEAD_SIZE;
        const ctx = resultCanvas.getContext('2d');

        // Draw background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);

        // Draw Beads
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];

                if (a < 128) continue; // Skip transparent

                // Find Nearest Color
                const nearest = findNearestColor(r, g, b);
                
                // Store in Map
                pixelMap[y][x] = nearest;

                // Count
                if (!colorCounts[nearest.id]) {
                    colorCounts[nearest.id] = { ...nearest, count: 0 };
                }
                colorCounts[nearest.id].count++;

                // Draw with mapped color
                ctx.fillStyle = nearest.hex;
                
                // Draw circle (Bead)
                ctx.beginPath();
                const centerX = x * BEAD_SIZE + BEAD_SIZE / 2;
                const centerY = y * BEAD_SIZE + BEAD_SIZE / 2;
                const radius = (BEAD_SIZE / 2) - 1; // Little gap
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fill();

                // Shine effect
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.beginPath();
                ctx.arc(centerX - radius/3, centerY - radius/3, radius/3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw Grid
        if (showGridCheck.checked) {
            drawGrid(ctx, width, height);
        }

        renderStats(colorCounts);
    }

    function drawGrid(ctx, width, height) {
        const interval = parseInt(gridIntervalRange.value);
        
        // Draw normal grid lines
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        // Vertical lines
        for (let x = 0; x <= width; x++) {
            // Skip major lines for now
            if (interval > 0 && x % interval === 0) continue;
            
            const px = x * BEAD_SIZE;
            ctx.moveTo(px, 0);
            ctx.lineTo(px, height * BEAD_SIZE);
        }
        
        // Horizontal lines
        for (let y = 0; y <= height; y++) {
            if (interval > 0 && y % interval === 0) continue;
            
            const py = y * BEAD_SIZE;
            ctx.moveTo(0, py);
            ctx.lineTo(width * BEAD_SIZE, py);
        }
        ctx.stroke();

        // Draw Major Grid Lines
        if (interval > 0) {
            ctx.strokeStyle = '#888888';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            for (let x = 0; x <= width; x += interval) {
                const px = x * BEAD_SIZE;
                ctx.moveTo(px, 0);
                ctx.lineTo(px, height * BEAD_SIZE);
            }
            
            for (let y = 0; y <= height; y += interval) {
                const py = y * BEAD_SIZE;
                ctx.moveTo(0, py);
                ctx.lineTo(width * BEAD_SIZE, py);
            }
            ctx.stroke();
        }
    }

    function renderStats(counts) {
        beadList.innerHTML = '';
        const sortedColors = Object.values(counts).sort((a, b) => b.count - a.count);

        if (sortedColors.length === 0) {
            beadList.innerHTML = '<p style="color:#888;">无颜色数据</p>';
            return;
        }

        sortedColors.forEach(color => {
            const div = document.createElement('div');
            div.className = 'bead-item';
            div.innerHTML = `
                <div class="bead-swatch" style="background-color: ${color.hex}"></div>
                <div class="bead-info">
                    <span class="bead-code">${color.id} ${color.name}</span>
                    <span class="bead-count">× ${color.count} 粒</span>
                </div>
            `;
            beadList.appendChild(div);
        });
    }

    function saveResult() {
        const link = document.createElement('a');
        link.download = 'pixel-bead-art.png';
        link.href = resultCanvas.toDataURL();
        link.click();
    }
});
