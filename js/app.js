// نظام لطيف لإظهار أي خطأ يحدث على شاشة الهاتف

    return false;
};

const PATTERNS = [
    [1, 0, 0, 1],
    [0, 1, 1, 0],
    [1, 0, 1, 0],
    [0, 1, 0, 1],
    [1, 1, 0, 0],
    [0, 0, 1, 1]
];

function generateShares(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

    const shareWidth = width * 2;
    const shareHeight = height * 2;

    // استخدام طريقة متوافقة مع جميع المتصفحات لإنشاء مساحة للصور
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = shareWidth;
    tempCanvas.height = shareHeight;
    const ctx = tempCanvas.getContext('2d');
    const share1Data = ctx.createImageData(shareWidth, shareHeight);
    const share2Data = ctx.createImageData(shareWidth, shareHeight);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            
            const gray = (r + g + b) / 3;
            const isBlack = gray < 128; 

            const patternIndex = Math.floor(Math.random() * PATTERNS.length);
            const p1 = PATTERNS[patternIndex];
            
            let p2;
            if (isBlack) {
                p2 = p1; 
            } else {
                p2 = p1.map(val => 1 - val); 
            }

            drawBlock(share1Data, x * 2, y * 2, p1);
            drawBlock(share2Data, x * 2, y * 2, p2);
        }
    }
    return { share1Data, share2Data };
}

function drawBlock(imageData, startX, startY, pattern) {
    const width = imageData.width;
    for (let i = 0; i < 4; i++) {
        const dx = i % 2;             
        const dy = Math.floor(i / 2); 
        
        const px = startX + dx;
        const py = startY + dy;
        const idx = (py * width + px) * 4;
        
        const val = pattern[i] === 1 ? 0 : 255; 
        
        imageData.data[idx] = val;     
        imageData.data[idx + 1] = val; 
        imageData.data[idx + 2] = val; 
        imageData.data[idx + 3] = 255; 
    }
}

function combineShares(share1, share2) {
    const width = share1.width;
    const height = share1.height;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext('2d');
    const combinedData = ctx.createImageData(width, height);
    
    for (let i = 0; i < share1.data.length; i += 4) {
        const r = Math.min(share1.data[i], share2.data[i]);
        const g = Math.min(share1.data[i+1], share2.data[i+1]);
        const b = Math.min(share1.data[i+2], share2.data[i+2]);
        
        combinedData.data[i] = r;
        combinedData.data[i+1] = g;
        combinedData.data[i+2] = b;
        combinedData.data[i+3] = 255;
    }
    return combinedData;
}

function processImage(file) {
    const reader = new FileReader();
    
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const ctx = tempCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            
            const { share1Data, share2Data } = generateShares(imageData);
            const combinedData = combineShares(share1Data, share2Data);
            
            drawToCanvas('canvasShare1', share1Data);
            drawToCanvas('canvasShare2', share2Data);
            drawToCanvas('canvasCombined', combinedData);
            
            document.getElementById('resultsSection').style.display = 'block';
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function drawToCanvas(canvasId, imageData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
}

window.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                processImage(e.target.files[0]);
            }
        });
    } else {
        alert("لم يتم العثور على زر رفع الصورة في الصفحة!");
    }
});
