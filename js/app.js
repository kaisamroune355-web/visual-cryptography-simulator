// --- التنقل بين التبويبات ---
function openTab(tabName) {
    document.querySelectorAll('.card').forEach(card => card.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
}

// --- دوال التشفير الكلاسيكي ---
function caesarCipher(text, shift, decrypt = false) {
    return text.replace(/[a-zA-Z]/g, c => {
        const base = c <= 'Z' ? 65 : 97;
        let s = (decrypt ? -shift : shift) % 26;
        return String.fromCharCode((c.charCodeAt(0) - base + s + 26) % 26 + base);
    });
}
function doCaesar(decrypt) {
    const text = document.getElementById('inCaesarText').value;
    const shift = parseInt(document.getElementById('inCaesarShift').value) || 3;
    document.getElementById('resCaesar').innerText = caesarCipher(text, shift, decrypt);
}

function vigenereCipher(text, key, decrypt = false) {
    let result = ""; let keyIndex = 0; key = key.toLowerCase();
    if(key.length === 0) return "أدخل كلمة مفتاحية";
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        if (/[a-zA-Z]/.test(char)) {
            const isUpper = char === char.toUpperCase();
            const base = isUpper ? 65 : 97;
            let shift = key[keyIndex % key.length].charCodeAt(0) - 97;
            if (decrypt) shift = -shift;
            result += String.fromCharCode((char.charCodeAt(0) - base + shift + 26) % 26 + base);
            keyIndex++;
        } else { result += char; }
    }
    return result;
}
function doVigenere(decrypt) {
    const text = document.getElementById('inVigText').value;
    const key = document.getElementById('inVigKey').value;
    document.getElementById('resVig').innerText = vigenereCipher(text, key, decrypt);
}

// --- دوال AES و RSA و Hash (الحديثة) ---
const enc = new TextEncoder(); const dec = new TextDecoder();
function bufToHex(buf) { return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''); }
function hexToBuf(hex) { return new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))); }

async function getAESKey(password) {
    const keyMat = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt: enc.encode("salt"), iterations: 100000, hash: "SHA-256" }, keyMat, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function doAES(decrypt) {
    const text = document.getElementById('inAesText').value;
    const pass = document.getElementById('inAesPass').value;
    const resBox = document.getElementById('resAes');
    if (!text || !pass) { resBox.innerText = "أدخل النص وكلمة المرور"; return; }
    
    try {
        if (!decrypt) {
            const key = await getAESKey(pass); const iv = crypto.getRandomValues(new Uint8Array(12));
            const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text));
            resBox.innerText = bufToHex(iv.buffer) + ":" + bufToHex(cipher);
        } else {
            const parts = text.split(":");
            if(parts.length !== 2) { resBox.innerText = "صيغة النص المشفر غير صحيحة (يجب أن يحتوي على :)"; return; }
            const key = await getAESKey(pass); const iv = hexToBuf(parts[0]); const data = hexToBuf(parts[1]);
            const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
            resBox.innerText = dec.decode(plain);
        }
    } catch (e) { resBox.innerText = "حدث خطأ (تأكد من كلمة المرور أو صحة النص)"; }
}

let rsaKeys = null;
async function genRSA() {
    rsaKeys = await crypto.subtle.generateKey({ name: "RSA-OAEP", modulusLength: 1024, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["encrypt", "decrypt"]);
    alert("تم توليد المفاتيح بنجاح!");
}
async function doRSA(decrypt) {
    const text = document.getElementById('inRsaText').value;
    const resBox = document.getElementById('resRsa');
    if (!rsaKeys) { resBox.innerText = "اضغط على زر توليد المفاتيح أولاً!"; return; }
    if (!text) { resBox.innerText = "أدخل النص"; return; }

    try {
        if (!decrypt) {
            const cipher = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, rsaKeys.publicKey, enc.encode(text));
            resBox.innerText = bufToHex(cipher);
        } else {
            const plain = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, rsaKeys.privateKey, hexToBuf(text));
            resBox.innerText = dec.decode(plain);
        }
    } catch (e) { resBox.innerText = "فشلت العملية (النص طويل جداً أو غير صالح)"; }
}

async function doHash() {
    const text = document.getElementById('inHashText').value;
    if(!text) return;
    const hashBuf = await crypto.subtle.digest("SHA-256", enc.encode(text));
    document.getElementById('resHash').innerText = bufToHex(hashBuf);
}

// --- التشفير البصري ---
const PATTERNS = [[1, 0, 0, 1], [0, 1, 1, 0], [1, 0, 1, 0], [0, 1, 0, 1], [1, 1, 0, 0], [0, 0, 1, 1]];
function generateShares(imageData) {
    const width = imageData.width; const height = imageData.height; const data = imageData.data;
    const shareWidth = width * 2; const shareHeight = height * 2;
    const tempCanvas = document.createElement('canvas'); tempCanvas.width = shareWidth; tempCanvas.height = shareHeight;
    const ctx = tempCanvas.getContext('2d');
    const share1Data = ctx.createImageData(shareWidth, shareHeight); const share2Data = ctx.createImageData(shareWidth, shareHeight);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const isBlack = ((data[idx] + data[idx+1] + data[idx+2]) / 3) < 128;
            const p1 = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
            const p2 = isBlack ? p1 : p1.map(v => 1 - v);
            drawBlock(share1Data, x * 2, y * 2, p1); drawBlock(share2Data, x * 2, y * 2, p2);
        }
    }
    return { share1Data, share2Data };
}
function drawBlock(imgData, sx, sy, pat) {
    const w = imgData.width;
    for (let i = 0; i < 4; i++) {
        const idx = ((sy + Math.floor(i / 2)) * w + (sx + i % 2)) * 4;
        const val = pat[i] === 1 ? 0 : 255;
        imgData.data[idx] = imgData.data[idx+1] = imgData.data[idx+2] = val; imgData.data[idx+3] = 255;
    }
}
function combineShares(s1, s2) {
    const w = s1.width; const h = s1.height;
    const tempCanvas = document.createElement('canvas'); tempCanvas.width = w; tempCanvas.height = h;
    const ctx = tempCanvas.getContext('2d'); const comb = ctx.createImageData(w, h);
    for (let i = 0; i < s1.data.length; i += 4) {
        comb.data[i] = Math.min(s1.data[i], s2.data[i]); comb.data[i+1] = Math.min(s1.data[i+1], s2.data[i+1]); comb.data[i+2] = Math.min(s1.data[i+2], s2.data[i+2]); comb.data[i+3] = 255;
    }
    return comb;
}
function drawToCanvas(id, imgData) {
    const cvs = document.getElementById(id); if(!cvs) return;
    cvs.width = imgData.width; cvs.height = imgData.height;
    cvs.getContext('2d').putImageData(imgData, 0, 0);
}
document.getElementById('imageInput')?.addEventListener('change', e => {
    if(!e.target.files.length) return;
    const reader = new FileReader();
    reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
            const cvs = document.createElement('canvas'); cvs.width = img.width; cvs.height = img.height;
            const ctx = cvs.getContext('2d'); ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, img.width, img.height);
            const { share1Data, share2Data } = generateShares(imgData);
            drawToCanvas('canvasShare1', share1Data); drawToCanvas('canvasShare2', share2Data);
            drawToCanvas('canvasCombined', combineShares(share1Data, share2Data));
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
});
