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

// --- KODAK GOLD 80 IMPLEMENTATION ---
const applyKodakGold80 = (data: Uint8ClampedArray, width: number, height: number) => {
  // 6. GRANO: Fuerte (Luminancia)
  const noise = generateNoise(width, height, 40); 

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 1. CONTRASTE: Levantamiento del Punto Negro (Fade)
    // Los negros no son 0, son gris oscuro cálido (~30)
    // Fórmula simple de 'lift': nuevo_val = lift + (val * (255-lift)/255)
    const blackLift = 35;
    r = blackLift + (r / 255) * (255 - blackLift);
    g = blackLift + (g / 255) * (255 - blackLift);
    b = blackLift + (b / 255) * (255 - blackLift);

    // 2. BALANCE CROMÁTICO:
    // Global: +5% Cálido
    r *= 1.05; 
    b *= 0.95;
    
    // Sombras: Tinte Naranja-Rojo
    // Si la luminosidad es baja, inyectar rojo y un poco de verde (naranja)
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    if (luma < 100) {
      const factor = (100 - luma) / 100; // Más fuerte en lo más oscuro
      r += 15 * factor;
      g += 5 * factor;
    }

    // Conversión a HSL para pasos 3 y 4
    let [h, s, l] = rgbToHsl(r, g, b);

    // 3. SATURACIÓN: -20% Desaturación General
    s = s * 0.80;

    // 4. TONOS DE PIEL (Clave): Naranjas y Rojos
    // Hue Rojo es alrededor de 0/360, Naranja ~30
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

// --- FUJIFILM PRO 400H IMPLEMENTATION ---
const applyFujiPro400H = (data: Uint8ClampedArray, width: number, height: number) => {
  // 6. GRANO: Fino (ISO 100/200)
  const noise = generateNoise(width, height, 18);

  // LUT de Contraste Sigmoideo (Paso 1)
  const contrastLUT = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
      let x = i / 255;
      // S-Curve Aggressive: Steep center, pushes blacks down, whites up
      let val = (1 / (1 + Math.exp(-6 * (x - 0.5)))) * 255;
      // Normalizar para asegurar rango completo pero orgánico
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
    // Global: Frío/Cian (-5% Temp)
    r *= 0.95;
    // Luces: Tinte Amarillo/Verde sutil
    // Check Luma after contrast
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    if (luma > 180) {
        const factor = (luma - 180) / 75;
        g += 10 * factor; // Verde
        r += 5 * factor;  // Amarillo (R+G)
    }

    // HSL para manipulación de color precisa
    let [h, s, l] = rgbToHsl(r, g, b);

    // 3. COLOR CLAVE (GREEN SHIFT): Verde -> Cian
    // Rango Verdes: ~80 a ~160
    if (h >= 70 && h <= 170) {
        // Mover Hacia Cian (que es 180)
        // Shift negativo es hacia amarillo, positivo hacia cian (en grados HSL estándar)
        // Green (120) -> Cyan (180). Queremos sumar.
        // El usuario pidió "Mover hacia el Cian".
        h = h + 30; 
        // Luminosidad Verde +5%
        l = Math.min(100, l * 1.05);
    }

    // 4. SATURACIÓN:
    // Global +10%
    s = s * 1.10;
    // Azul/Cian +20% (Rango 170 - 260)
    if (h >= 170 && h <= 260) {
        s = Math.min(100, s * 1.20);
    }

    // 5. MANEJO DE LUCES: Compresión de Highlights
    // Evitar quemados puros (255). Roll-off suave.
    if (l > 95) l = 95 + (l-95)*0.5;

    // Volver a RGB
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

  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  // 5. NITIDEZ/DESENFOQUE (KODAK) - Paso Previo al Render
  // Aplicar filtro nativo del canvas *antes* de dibujar la imagen
  if (filter === FilterType.KODAK_GOLD) {
      // "Desenfoque Gaussian muy ligero"
      // Calculamos un radio relativo al tamaño de la imagen para consistencia
      const blurRadius = Math.max(0.5, canvas.width / 2000); 
      ctx.filter = `blur(${blurRadius}px)`;
  } else {
      ctx.filter = 'none';
  }

  // Draw original
  ctx.drawImage(img, 0, 0);
  
  // Reset filter for future draws so we don't blur the UI or subsequent draws accidentally (though we redraw everything)
  ctx.filter = 'none';

  if (filter === FilterType.NONE) return;

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  if (filter === FilterType.KODAK_GOLD) {
    applyKodakGold80(data, canvas.width, canvas.height);
  } else if (filter === FilterType.FUJI_PRO_400H) {
    applyFujiPro400H(data, canvas.width, canvas.height);
  }

  ctx.putImageData(imgData, 0, 0);
};