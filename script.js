/* ── State ──────────────────────────────────────────────────────────── */
let state = {
  r: 66, g: 133, b: 244,
  ratioW: 16, ratioH: 9,
  customW: 16, customH: 9,
  ratioLabel: '16:9',
  sizePx: 1024,
};

const PRESETS = [
  { name: 'Google Blue',   hex: '#4285F4' },
  { name: 'Google Red',    hex: '#EA4335' },
  { name: 'Google Yellow', hex: '#FBBC05' },
  { name: 'Google Green',  hex: '#34A853' },
  { name: 'Midnight',      hex: '#202124' },
  { name: 'Slate',         hex: '#5F6368' },
  { name: 'Cloud',         hex: '#F8F9FA' },
  { name: 'Teal',          hex: '#00BCD4' },
  { name: 'Purple',        hex: '#9C27B0' },
  { name: 'Coral',         hex: '#FF6F61' },
  { name: 'Mint',          hex: '#00C9A7' },
  { name: 'Amber',         hex: '#FF8F00' },
];

const RATIOS = [
  { label: '1:1',    w: 1,    h: 1    },
  { label: '4:3',    w: 4,    h: 3    },
  { label: '16:9',   w: 16,   h: 9    },
  { label: '3:2',    w: 3,    h: 2    },
  { label: '2:1',    w: 2,    h: 1    },
  { label: '9:16',   w: 9,    h: 16   },
  { label: '3:4',    w: 3,    h: 4    },
  { label: 'Custom', w: null, h: null },
];

const SIZES = [
  { label: 'Small',  px: 512  },
  { label: 'Medium', px: 1024 },
  { label: 'Large',  px: 2048 },
  { label: '4K',     px: 3840 },
];

/* ── Helpers ────────────────────────────────────────────────────────── */
function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  if (h.length === 3) return {
    r: parseInt(h[0]+h[0], 16),
    g: parseInt(h[1]+h[1], 16),
    b: parseInt(h[2]+h[2], 16),
  };
  if (h.length === 6) return {
    r: parseInt(h.slice(0,2), 16),
    g: parseInt(h.slice(2,4), 16),
    b: parseInt(h.slice(4,6), 16),
  };
  return { r: 66, g: 133, b: 244 };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b]
    .map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0'))
    .join('');
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > .5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function getLum(r, g, b) { return .299*r + .587*g + .114*b; }
function getHex()         { return rgbToHex(state.r, state.g, state.b); }

function getActualRatio() {
  if (state.ratioLabel === 'Custom')
    return { w: Number(state.customW) || 1, h: Number(state.customH) || 1 };
  const r = RATIOS.find(x => x.label === state.ratioLabel);
  return { w: r.w, h: r.h };
}

function getOutputDims() {
  const { w, h } = getActualRatio();
  const base = state.sizePx;
  if (w >= h) return { w: base, h: Math.round(base * h / w) };
  return { w: Math.round(base * w / h), h: base };
}

/* ── DOM Refs ───────────────────────────────────────────────────────── */
const preview      = document.getElementById('preview');
const badgeHex     = document.getElementById('badge-hex');
const badgeHsl     = document.getElementById('badge-hsl');
const badgeRatio   = document.getElementById('badge-ratio');
const hexInput     = document.getElementById('hex-input');
const hexSwatch    = document.getElementById('hex-swatch');
const copyBtn      = document.getElementById('copy-btn');
const rangeR       = document.getElementById('range-r');
const rangeG       = document.getElementById('range-g');
const rangeB       = document.getElementById('range-b');
const numR         = document.getElementById('num-r');
const numG         = document.getElementById('num-g');
const numB         = document.getElementById('num-b');
const colorPicker  = document.getElementById('color-picker');
const pickerHex    = document.getElementById('picker-hex');
const pickerRgb    = document.getElementById('picker-rgb');
const pickerHsl    = document.getElementById('picker-hsl');
const customRatio  = document.getElementById('custom-ratio');
const cwInput      = document.getElementById('cw');
const chInput      = document.getElementById('ch');
const dimensionsEl = document.getElementById('dimensions');
const dlBtn        = document.getElementById('dl-btn');
const canvas       = document.getElementById('canvas');
const presetsEl    = document.getElementById('presets');
const ratioCont    = document.getElementById('ratio-chips');
const sizeCont     = document.getElementById('size-chips');

/* ── Render ─────────────────────────────────────────────────────────── */
function render() {
  const hex    = getHex();
  const isDark = getLum(state.r, state.g, state.b) < 128;
  const hsl    = rgbToHsl(state.r, state.g, state.b);
  const { w, h } = getActualRatio();

  // Preview panel
  preview.style.background = hex;
  const previewH = Math.min(Math.max(Math.round(340 * h / w), 80), 260);
  preview.style.height = previewH + 'px';

  // Adaptive badge colours
  const darkBg  = isDark ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.12)';
  const darkTxt = isDark ? '#fff' : '#202124';
  [badgeHex, badgeHsl, badgeRatio].forEach(b => {
    b.style.background = darkBg;
    b.style.color      = darkTxt;
  });
  badgeHex.textContent   = hex.toUpperCase();
  badgeHsl.textContent   = `HSL ${hsl.h}° ${hsl.s}% ${hsl.l}%`;
  badgeRatio.textContent = `${w}:${h}`;

  // HEX panel
  hexSwatch.style.background = hex;

  // Picker panel
  colorPicker.value        = hex;
  pickerHex.textContent    = hex.toUpperCase();
  pickerRgb.textContent    = `rgb(${state.r}, ${state.g}, ${state.b})`;
  pickerHsl.textContent    = `hsl(${hsl.h}°, ${hsl.s}%, ${hsl.l}%)`;

  // RGB sliders & number inputs
  rangeR.value = state.r; numR.value = state.r;
  rangeG.value = state.g; numG.value = state.g;
  rangeB.value = state.b; numB.value = state.b;

  // Preset active ring
  presetsEl.querySelectorAll('.preset-swatch').forEach(el => {
    el.classList.toggle('active', el.dataset.hex === hex.toLowerCase());
  });

  // Output dimensions
  const dims = getOutputDims();
  dimensionsEl.textContent = `${dims.w} × ${dims.h} px`;
}

function setFromHex(hex) {
  const c  = hexToRgb(hex);
  state.r  = c.r; state.g = c.g; state.b = c.b;
  render();
}

/* ── Build Preset Swatches ──────────────────────────────────────────── */
PRESETS.forEach(p => {
  const btn         = document.createElement('button');
  btn.className     = 'preset-swatch';
  btn.dataset.hex   = p.hex.toLowerCase();
  btn.title         = p.name;
  btn.style.background = p.hex;
  btn.addEventListener('click', () => {
    hexInput.value = p.hex.toUpperCase();
    setFromHex(p.hex);
  });
  presetsEl.appendChild(btn);
});

/* ── Build Ratio Chips ──────────────────────────────────────────────── */
RATIOS.forEach(r => {
  const btn     = document.createElement('button');
  btn.className = 'chip' + (r.label === state.ratioLabel ? ' active' : '');
  btn.textContent = r.label;
  btn.addEventListener('click', () => {
    state.ratioLabel = r.label;
    ratioCont.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    customRatio.classList.toggle('visible', r.label === 'Custom');
    render();
  });
  ratioCont.appendChild(btn);
});

/* ── Build Size Chips ───────────────────────────────────────────────── */
SIZES.forEach(s => {
  const btn     = document.createElement('button');
  btn.className = 'size-chip' + (s.px === state.sizePx ? ' active' : '');
  btn.innerHTML = `<div>${s.label}</div><div class="size-chip-sub">${s.px}px</div>`;
  btn.addEventListener('click', () => {
    state.sizePx = s.px;
    sizeCont.querySelectorAll('.size-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    render();
  });
  sizeCont.appendChild(btn);
});

/* ── Tabs ───────────────────────────────────────────────────────────── */
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t    => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p  => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
  });
});

/* ── HEX Input ──────────────────────────────────────────────────────── */
hexInput.addEventListener('input', () => {
  let v = hexInput.value.trim();
  if (!v.startsWith('#')) v = '#' + v;
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) setFromHex(v);
});

/* ── Copy Button ────────────────────────────────────────────────────── */
copyBtn.addEventListener('click', async () => {
  await navigator.clipboard.writeText(getHex().toUpperCase());
  copyBtn.textContent = '✓ Copied';
  copyBtn.classList.add('copied');
  setTimeout(() => { copyBtn.textContent = 'Copy'; copyBtn.classList.remove('copied'); }, 1800);
});

/* ── RGB Sliders + Number Inputs ────────────────────────────────────── */
function bindRgb(range, num, ch) {
  range.addEventListener('input', () => {
    state[ch]      = +range.value;
    hexInput.value = getHex().toUpperCase();
    render();
  });
  num.addEventListener('input', () => {
    state[ch]      = clamp(+num.value || 0, 0, 255);
    hexInput.value = getHex().toUpperCase();
    render();
  });
}
bindRgb(rangeR, numR, 'r');
bindRgb(rangeG, numG, 'g');
bindRgb(rangeB, numB, 'b');

/* ── Native Color Picker ────────────────────────────────────────────── */
colorPicker.addEventListener('input', () => {
  hexInput.value = colorPicker.value.toUpperCase();
  setFromHex(colorPicker.value);
});

/* ── Custom Ratio Inputs ────────────────────────────────────────────── */
cwInput.addEventListener('input', () => { state.customW = cwInput.value; render(); });
chInput.addEventListener('input', () => { state.customH = chInput.value; render(); });

/* ── Ripple Effect ──────────────────────────────────────────────────── */
function addRipple(e) {
  const rect = dlBtn.getBoundingClientRect();
  const r    = document.createElement('span');
  r.className   = 'ripple-el';
  r.style.left  = (e.clientX - rect.left) + 'px';
  r.style.top   = (e.clientY - rect.top)  + 'px';
  dlBtn.appendChild(r);
  setTimeout(() => r.remove(), 650);
}

/* ── Download ───────────────────────────────────────────────────────── */
dlBtn.addEventListener('click', e => {
  addRipple(e);
  dlBtn.classList.add('loading');
  dlBtn.disabled = true;

  setTimeout(() => {
    const dims       = getOutputDims();
    canvas.width     = dims.w;
    canvas.height    = dims.h;
    const ctx        = canvas.getContext('2d');
    ctx.fillStyle    = getHex();
    ctx.fillRect(0, 0, dims.w, dims.h);

    const ratio  = getActualRatio();
    const link   = document.createElement('a');
    link.download = `color-${getHex().replace('#','')}-${ratio.w}x${ratio.h}-${dims.w}x${dims.h}.png`;
    link.href     = canvas.toDataURL('image/png');
    link.click();

    dlBtn.classList.remove('loading');
    dlBtn.disabled = false;
  }, 350);
});

/* ── Init ───────────────────────────────────────────────────────────── */
render();
