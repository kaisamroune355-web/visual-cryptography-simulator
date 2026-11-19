// ==========================================
// محاكي التشفير البصري (Visual Cryptography)
// خوارزمية Naor-Shamir (2 out of 2)
// ==========================================

// 1. الأنماط الأساسية لمربع 2x2 بكسل (1 تعني أسود، 0 تعني أبيض)
const PATTERNS = [
    [1, 0, 0, 1], // قطر
    [0, 1, 1, 0], // قطر معاكس
    [1, 0, 1, 0], // أفقي
    [0, 1, 0, 1], // أفقي معاكس
    [1, 1, 0, 0], // عمودي
    [0, 0, 1, 1]  // عمودي معاكس
];

// 2. الدالة الرئيسية لتوليد الأجزاء المشفرة
function generateShares(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

    // نضاعف الأبعاد لأن كل بكسل سيصبح 2x2
    const shareWidth = width * 2;
    const shareHeight = height * 2;

    // إنشاء بيانات فارغة للجزأين
    const share1Data = new ImageData(shareWidth, shareHeight);
    const share2Data = new ImageData(shareWidth, shareHeight);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // قراءة البكسل من الصورة الأصلية
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            
            // تحويل البكسل إلى رمادي لتحديد هل هو أسود أم أبيض
            const gray = (r + g + b) / 3;
            const isBlack = gray < 128; // عتبة اللون

            // اختيار نمط عشوائي للجزء الأول
            const patternIndex = Math.floor(Math.random() * PATTERNS.length);
            const p1 = PATTERNS[patternIndex];
            
            // تحديد نمط الجزء الثاني بناءً على لون البكسل
            let p2;
            if (isBlack) {
                // إذا كان أسود، النمطان متطابقان
                p2 = p1; 
            } else {
                // إذا كان أبيض، النمطان متعاكسان
                p2 = p1.map(val => 1 - val); 
            }

            // رسم المربع 2x2 في الجزأين
            drawBlock(share1Data, x * 2, y * 2, p1);
            drawBlock(share2Data, x * 2, y * 2, p2);
        }
    }
    return { share1Data, share2Data };
}

// 3. دالة مساعدة لرسم مربع 2x2 في بيانات الصورة
function drawBlock(imageData, startX, startY, pattern) {
    const width = imageData.width;
    for (let i = 0; i < 4; i++) {
        const dx = i % 2;             
        const dy = Math.floor(i / 2); 
        
        const px = startX + dx;
        const py = startY + dy;
        const idx = (py * width + px) * 4;
        
        // إذا كان 1 نضعه أسود (0)، وإذا كان 0 نضعه أبيض (255)
        const val = pattern[i] === 1 ? 0 : 255; 
        
        imageData.data[idx] = val;     // R
        imageData.data[idx + 1] = val; // G
        imageData.data[idx + 2] = val; // B
        imageData.data[idx + 3] = 255; // Alpha
    }
}

// 4. دالة لدمج الجزأين رقمياً (محاكاة وضع الشفافيتين فوق بعضهما)
function combineShares(share1, share2) {
    const width = share1.width;
    const height = share1.height;
    const combinedData = new ImageData(width, height);
    
    for (let i = 0; i < share1.data.length; i += 4) {
        // دمج البكسلات: إذا كان أي منهما أسود (0)، تكون النتيجة سوداء
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

// 5. دالة لمعالجة الصورة المرفوعة
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
            
            // تشغيل خوارزمية التشفير
            const { share1Data, share2Data } = generateShares(imageData);
            const combinedData = combineShares(share1Data, share2Data);
            
            // رسم النتائج على الشاشة
            drawToCanvas('canvasShare1', share1Data);
            drawToCanvas('canvasShare2', share2Data);
            drawToCanvas('canvasCombined', combinedData);
            
            // إظهار قسم النتائج بعد المعالجة
            document.getElementById('resultsSection').style.display = 'block';
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// دالة مساعدة لرسم البيانات النهائية على الـ Canvas
function drawToCanvas(canvasId, imageData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
}

// ربط حدث اختيار الصورة عند اكتمال تحميل الصفحة
window.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                processImage(e.target.files[0]);
            }
        });
    }
});
