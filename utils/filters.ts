import { FilterType } from "../types";

// --- Utilities ---

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return [h, s * 100, l * 100];
};

const hslToRgb = (h: number, s: number, l: number) => {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [r * 255, g * 255, b * 255];
};

const clamp = (val: number) => Math.max(0, Math.min(255, val));

const generateNoise = (width: number, height: number, strength: number) => {
  const size = width * height * 4;
  const noise = new Float32Array(size);
  for (let i = 0; i < size; i += 4) {
    const val = (Math.random() - 0.5) * strength;
    noise[i] = val;
    noise[i+1] = val;
    noise[i+2] = val;
  }
  return noise;
};

// --- EFFECTS ---

// 1. Viñeteado Óptico (Lente)
const applyOpticalVignette = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const gradient = ctx.createRadialGradient(
        x + w / 2, y + h / 2, w * 0.35, 
        x + w / 2, y + h / 2, w * 0.85
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.5, 'rgba(0,0,0,0.02)');
    gradient.addColorStop(1, 'rgba(10,5,0,0.5)'); // Warm dark corners

    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
};

// 2. Textura Papel Polaroid
const applyPaperTexture = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 64;
    patternCanvas.height = 64;
    const pCtx = patternCanvas.getContext('2d');
    if(!pCtx) return;

    const imgData = pCtx.createImageData(64, 64);
    for (let i = 0; i < imgData.data.length; i += 4) {
        const v = 255 - Math.random() * 10;
        imgData.data[i] = v;
        imgData.data[i+1] = v;
        imgData.data[i+2] = v;
        imgData.data[i+3] = 10; // Very subtle
    }
    pCtx.putImageData(imgData, 0, 0);
    
    const pattern = ctx.createPattern(patternCanvas, 'repeat');
    if(pattern) {
        ctx.fillStyle = pattern;
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillRect(0,0,w,h);
        ctx.globalCompositeOperation = 'source-over';
    }
};

// 3. Halación (Glow en luces altas)
const applyHalation = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const sourceData = ctx.getImageData(x, y, w, h);
    const highlightCanvas = document.createElement('canvas');
    highlightCanvas.width = w;
    highlightCanvas.height = h;
    const hCtx = highlightCanvas.getContext('2d');
    if (!hCtx) return;

    const hData = hCtx.createImageData(w, h);
    for (let i = 0; i < sourceData.data.length; i += 4) {
        const r = sourceData.data[i];
        const g = sourceData.data[i+1];
        const b = sourceData.data[i+2];
        const luma = 0.299*r + 0.587*g + 0.114*b;
        
        if (luma > 210) {
            hData.data[i] = 255; // Push to warm white
            hData.data[i+1] = 220;
            hData.data[i+2] = 200;
            hData.data[i+3] = (luma - 210) * 2; 
        } else {
            hData.data[i+3] = 0;
        }
    }
    hCtx.putImageData(hData, 0, 0);

    ctx.save();
    ctx.filter = 'blur(6px)';
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.5;
    ctx.drawImage(highlightCanvas, x, y);
    ctx.restore();
};

// --- LOGIC PER FILTER ---

const applyKodakGold80 = (data: Uint8ClampedArray, width: number, height: number) => {
    const noise = generateNoise(width, height, 35);
    
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i+1], b = data[i+2];

        // 1. Lift Blacks (Fade)
        const lift = 30;
        r = lift + (r/255)*(255-lift);
        g = lift + (g/255)*(255-lift);
        b = lift + (b/255)*(255-lift);

        // 2. Warmth
        r *= 1.08; 
        b *= 0.92;

        // 3. Shadows warmth
        const luma = 0.299*r + 0.587*g + 0.114*b;
        if(luma < 100) {
            r += (100-luma)*0.15;
            g += (100-luma)*0.05;
        }

        // 4. HSL Tweaks
        let [h,s,l] = rgbToHsl(r,g,b);
        s *= 0.85; // Desaturate
        
        // Skin tones
        if(h < 40 || h > 340) {
            l *= 1.05;
            s *= 0.95;
        }

        const rgb = hslToRgb(h,s,l);
        r = rgb[0]; g = rgb[1]; b = rgb[2];

        // Noise
        data[i] = clamp(r + noise[i]);
        data[i+1] = clamp(g + noise[i+1]);
        data[i+2] = clamp(b + noise[i+2]);
    }
};

const applyFujiPro400H = (data: Uint8ClampedArray, width: number, height: number) => {
    const noise = generateNoise(width, height, 20);
    
    // Contrast Curve
    const curve = new Uint8Array(256);
    for(let i=0; i<256; i++) {
        let x = i/255;
        let y = (1 / (1 + Math.exp(-5 * (x - 0.5)))) * 255; // S-Curve
        curve[i] = clamp((y - 10) * 1.08);
    }

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i+1], b = data[i+2];

        // 1. Contrast
        r = curve[r]; g = curve[g]; b = curve[b];

        // 2. Cool/Cyan Bias
        r *= 0.96;
        
        // Highlights Green/Yellow tint
        const luma = 0.299*r + 0.587*g + 0.114*b;
        if(luma > 180) {
            g += (luma-180) * 0.1;
            r += (luma-180) * 0.05;
        }

        // 3. HSL - Green Shift
        let [h,s,l] = rgbToHsl(r,g,b);
        
        // Greens -> Cyan
        if (h > 60 && h < 160) {
            h += 20;
            s *= 1.1;
        }

        // Boost Blues
        if (h > 170 && h < 260) {
            s *= 1.2;
        }

        // Global Sat
        s *= 1.1;

        const rgb = hslToRgb(h,s,l);
        r = rgb[0]; g = rgb[1]; b = rgb[2];

        // Noise
        data[i] = clamp(r + noise[i]);
        data[i+1] = clamp(g + noise[i+1]);
        data[i+2] = clamp(b + noise[i+2]);
    }
};

export const applyFilterToCanvas = (
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  filter: FilterType
) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  // 1. POLAROID GEOMETRY
  const margin = Math.max(20, img.naturalWidth * 0.05);
  const bottomMargin = Math.max(80, img.naturalWidth * 0.25); // Chin
  const innerW = img.naturalWidth;
  const innerH = img.naturalHeight;
  const totalW = innerW + (margin*2);
  const totalH = innerH + margin + bottomMargin;

  canvas.width = totalW;
  canvas.height = totalH;

  // 2. DRAW PAPER
  const grad = ctx.createLinearGradient(0,0,totalW,totalH);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(1, '#f0f0f0');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,totalW,totalH);
  applyPaperTexture(ctx, totalW, totalH);

  // 3. DRAW SHADOW
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = '#000';
  ctx.fillRect(margin, margin, innerW, innerH);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // 4. DRAW IMAGE
  ctx.drawImage(img, margin, margin, innerW, innerH);

  // 5. KODAK HALATION (Before pixel manip)
  if (filter === FilterType.KODAK_GOLD) {
      applyHalation(ctx, margin, margin, innerW, innerH);
  }

  if (filter === FilterType.NONE) return;

  // 6. PIXEL MANIPULATION
  const imgData = ctx.getImageData(margin, margin, innerW, innerH);
  
  if (filter === FilterType.KODAK_GOLD) {
      applyKodakGold80(imgData.data, innerW, innerH);
  } else if (filter === FilterType.FUJI_PRO_400H) {
      applyFujiPro400H(imgData.data, innerW, innerH);
  }

  ctx.putImageData(imgData, margin, margin);

  // 7. VIGNETTE (After pixel manip, inside frame)
  applyOpticalVignette(ctx, margin, margin, innerW, innerH);
};