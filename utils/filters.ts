import { FilterType } from "../types";

// --- Color Space Utilities ---

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

// --- HELPER EFFECTS ---

// 1. Viñeteado Óptico: Oscurecimiento radial en las esquinas de la lente
const applyOpticalVignette = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const gradient = ctx.createRadialGradient(
        x + w / 2, y + h / 2, w * 0.3, // Start transparent circle in center
        x + w / 2, y + h / 2, w * 0.8  // End at corners
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.6, 'rgba(0,0,0,0.05)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.4)'); // Dark corners

    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
};

// 2. Textura de Papel: Ruido monocromático para el marco
const applyPaperTexture = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Creamos un canvas pequeño para el patrón de ruido
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 100;
    patternCanvas.height = 100;
    const pCtx = patternCanvas.getContext('2d');
    if(!pCtx) return;

    const imgData = pCtx.createImageData(100, 100);
    for (let i = 0; i < imgData.data.length; i += 4) {
        const gray = Math.random() * 255;
        imgData.data[i] = gray;
        imgData.data[i+1] = gray;
        imgData.data[i+2] = gray;
        imgData.data[i+3] = 15; // Muy transparente
    }
    pCtx.putImageData(imgData, 0, 0);

    const pattern = ctx.createPattern(patternCanvas, 'repeat');
    if (pattern) {
        ctx.fillStyle = pattern;
        ctx.globalCompositeOperation = 'multiply'; // Fusionar con el gradiente blanco
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
    }
};

// 3. Halación (Bloom): Resplandor en altas luces
const applyHalation = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    // 1. Extraer la imagen actual
    const sourceData = ctx.getImageData(x, y, w, h);
    
    // 2. Crear un mapa de solo luces altas
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
        
        // Calcular luminancia
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Threshold: Solo píxeles muy brillantes (>220)
        if (luma > 220) {
            hData.data[i] = r;
            hData.data[i+1] = g;
            hData.data[i+2] = b;
            hData.data[i+3] = 255; 
        } else {
            hData.data[i+3] = 0; // Transparente
        }
    }
    
    hCtx.putImageData(hData, 0, 0);

    // 3. Componer con Blur y Screen Mode
    ctx.save();
    // Aplicar blur fuerte al mapa de luces
    ctx.filter = 'blur(8px)'; 
    ctx.globalCompositeOperation = 'screen'; // Modo de fusión para añadir luz
    ctx.globalAlpha = 0.6; // Intensidad del bloom
    ctx.drawImage(highlightCanvas, x, y);
    ctx.restore();
};


// --- KODAK GOLD 80 LOGIC ---
const applyKodakGold80 = (data: Uint8ClampedArray, width: number, height: number) => {
  // 6. GRANO: Fuerte (Luminancia)
  const noise = generateNoise(width, height, 40); 

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 1. CONTRASTE: Levantamiento del Punto Negro (Fade)
    const blackLift = 35;
    r = blackLift + (r / 255) * (255 - blackLift);
    g = blackLift + (g / 255) * (255 - blackLift);
    b = blackLift + (b / 255) * (255 - blackLift);

    // 2. BALANCE CROMÁTICO:
    // Global: +5% Cálido
    r *= 1.05; 
    b *= 0.95;
    
    // Sombras: Tinte Naranja-Rojo
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    if (luma < 100) {
      const factor = (100 - luma) / 100; 
      r += 15 * factor;
      g += 5 * factor;
    }

    // Conversión a HSL para pasos 3 y 4
    let [h, s, l] = rgbToHsl(r, g, b);

    // 3. SATURACIÓN: -20% Desaturación General
    s = s * 0.80;

    // 4. TONOS DE PIEL (Clave): Naranjas y Rojos
    if (h < 40 || h > 340) {
      l = Math.min(100, l * 1.10); // +10% Luminosidad (Brillo)
      s = Math.max(0, s * 0.95);   // -5% Saturación (Suavizar)
    }

    // Volver a RGB
    const rgb = hslToRgb(h, s, l);
    r = rgb[0]; g = rgb[1]; b = rgb[2];

    // 6. GRANO (Aplicación)
    r = clamp(r + noise[i]);
    g = clamp(g + noise[i+1]);
    b = clamp(b + noise[i+2]);

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
};

// --- FUJIFILM PRO 400H LOGIC ---
const applyFujiPro400H = (data: Uint8ClampedArray, width: number, height: number) => {
  // 6. GRANO: Fino (ISO 100/200)
  const noise = generateNoise(width, height, 18);

  // LUT de Contraste Sigmoideo
  const contrastLUT = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
      let x = i / 255;
      let val = (1 / (1 + Math.exp(-6 * (x - 0.5)))) * 255;
      val = (val - 12) * 1.1; 
      contrastLUT[i] = clamp(val);
  }

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 1. CONTRASTE: Curva S Marcada
    r = contrastLUT[r];
    g = contrastLUT[g];
    b = contrastLUT[b];

    // 2. BALANCE CROMÁTICO:
    r *= 0.95;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    if (luma > 180) {
        const factor = (luma - 180) / 75;
        g += 10 * factor; 
        r += 5 * factor;  
    }

    let [h, s, l] = rgbToHsl(r, g, b);

    // 3. COLOR CLAVE (GREEN SHIFT): Verde -> Cian
    if (h >= 70 && h <= 170) {
        h = h + 30; 
        l = Math.min(100, l * 1.05);
    }

    // 4. SATURACIÓN:
    s = s * 1.10;
    if (h >= 170 && h <= 260) {
        s = Math.min(100, s * 1.20);
    }

    // 5. MANEJO DE LUCES
    if (l > 95) l = 95 + (l-95)*0.5;

    const rgb = hslToRgb(h, s, l);
    r = rgb[0]; g = rgb[1]; b = rgb[2];

    // 6. GRANO
    r = clamp(r + noise[i]);
    g = clamp(g + noise[i+1]);
    b = clamp(b + noise[i+2]);

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
};


export const applyFilterToCanvas = (
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  filter: FilterType
) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  // --- GEOMETRÍA POLAROID ---
  const margin = Math.max(20, img.naturalWidth * 0.06); 
  const bottomMargin = Math.max(60, img.naturalWidth * 0.22); 
  const innerWidth = img.naturalWidth;
  const innerHeight = img.naturalHeight;
  const totalWidth = innerWidth + (margin * 2);
  const totalHeight = innerHeight + margin + bottomMargin;

  // Redimensionar
  canvas.width = totalWidth;
  canvas.height = totalHeight;

  // 1. DIBUJAR PAPEL POLAROID (Mejorado)
  // Gradiente sutil para que no sea un color plano digital
  const paperGradient = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
  paperGradient.addColorStop(0, '#ffffff');    // Luz arriba
  paperGradient.addColorStop(1, '#f2f0ea');    // Sombra sutil abajo
  ctx.fillStyle = paperGradient;
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Añadir textura de papel (ruido sutil)
  applyPaperTexture(ctx, totalWidth, totalHeight);

  // 2. SOMBRA INTERNA DIFUSA (Mejorado)
  // Sombra "profunda" detrás de la foto para dar volumen
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#1a1a1a'; 
  ctx.fillRect(margin, margin, innerWidth, innerHeight);
  
  // Resetear sombra para no afectar a la imagen
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // 3. DIBUJAR LA FOTO
  ctx.drawImage(img, margin, margin, innerWidth, innerHeight);
  
  // 4. EFECTOS DE REVELADO (Halación) - Solo para Kodak
  // Se aplica ANTES de la manipulación de píxeles para tener datos suaves
  if (filter === FilterType.KODAK_GOLD) {
      applyHalation(ctx, margin, margin, innerWidth, innerHeight);
  }

  // Si no hay filtro de color, terminamos aquí
  if (filter === FilterType.NONE) return;

  // 5. PROCESAMIENTO DE PÍXELES (Filtros de Color y Grano)
  const imgData = ctx.getImageData(margin, margin, innerWidth, innerHeight);
  const data = imgData.data;

  if (filter === FilterType.KODAK_GOLD) {
    applyKodakGold80(data, innerWidth, innerHeight);
  } else if (filter === FilterType.FUJI_PRO_400H) {
    applyFujiPro400H(data, innerWidth, innerHeight);
  }

  // Volcar datos modificados
  ctx.putImageData(imgData, margin, margin);

  // 6. VIÑETEADO ÓPTICO (Final)
  // Se aplica sobre los píxeles modificados para simular la lente
  // Solo sobre la foto, no sobre el papel
  applyOpticalVignette(ctx, margin, margin, innerWidth, innerHeight);
};
