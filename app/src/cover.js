// Cover renderer: draws the multi-panel GTA-style poster cover on a 2D canvas.
// Everything here is drawn procedurally from the user's photos and the editor
// state — no artwork, logo or font from any game is used anywhere.

export const COVER_LAYOUTS = {
  hero: 'Hero + 3',
  full: 'Full bleed',
  duo: 'Duo',
  trio: 'Trio',
  nine: 'Nine grid',
};

export const COVER_GRADES = {
  vice: 'Vice Sunset',
  neon: 'Neon Night',
  palm: 'Palm Gold',
  frost: 'Cold Violet',
};

export const EXPORT_SIZES = {
  '1080x1080': { width: 1080, height: 1080, label: 'Square · 1080 × 1080' },
  '1080x1350': { width: 1080, height: 1350, label: 'Portrait · 1080 × 1350' },
  '1920x1080': { width: 1920, height: 1080, label: 'Landscape · 1920 × 1080' },
};

// Panel rectangles as fractions of the cover [x, y, width, height].
export function coverPanelRects(layoutId) {
  switch (layoutId) {
    case 'full':
      return [[0, 0, 1, 1]];
    case 'duo':
      return [[0, 0, 0.5, 1], [0.5, 0, 0.5, 1]];
    case 'trio':
      return [[0, 0, 1 / 3, 1], [1 / 3, 0, 1 / 3, 1], [2 / 3, 0, 1 / 3, 1]];
    case 'nine': {
      const rects = [];
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          rects.push([col / 3, row / 3, 1 / 3, 1 / 3]);
        }
      }
      return rects;
    }
    case 'hero':
    default:
      return [
        [0, 0, 0.62, 1],
        [0.62, 0, 0.38, 1 / 3],
        [0.62, 1 / 3, 0.38, 1 / 3],
        [0.62, 2 / 3, 0.38, 1 / 3],
      ];
  }
}

// Gradient stops for each colour grade: [sky top, sky middle, sky bottom,
// photo tint, title accent, subtitle colour].
export function coverGradeStops(gradeId) {
  switch (gradeId) {
    case 'neon':
      return ['#ff2e88', '#7b2ff7', '#0b1030', '#ff2e88', '#2ee6c8', '#2ee6c8'];
    case 'palm':
      return ['#ffb347', '#ff7a3d', '#c22e6e', '#ffb347', '#ffe066', '#fff3b0'];
    case 'frost':
      return ['#7dd3fc', '#6366f1', '#1e1b4b', '#818cf8', '#c4b5fd', '#a5f3fc'];
    case 'vice':
    default:
      return ['#ff9a3d', '#ff2e88', '#5b2a86', '#ff5e8a', '#ffd166', '#ff8fb3'];
  }
}

export function defaultCoverState() {
  return {
    layout: 'hero',
    grade: 'vice',
    gradeStrength: 0.55,
    size: '1080x1350',
    title: 'Neon Shore',
    subtitle: 'a vice city story',
    titleSize: 1,
    titlePosition: 'middle',
    titleStyle: 'outline',
    grain: true,
    palms: true,
    selectedPanel: 0,
    panels: [
      { photo: 0, zoom: 1.15, offsetX: 0, offsetY: 0.45 },
      { photo: 1, zoom: 1.15, offsetX: 0, offsetY: 0.5 },
      { photo: 0, zoom: 1.15, offsetX: 0, offsetY: 1 },
      { photo: 1, zoom: 1.15, offsetX: 0, offsetY: 0.5 },
    ],
  };
}

export function blankPanel() {
  return { photo: null, zoom: 1.15, offsetX: 0, offsetY: 0 };
}

export function panelsForLayout(layoutId, previousPanels) {
  const count = coverPanelRects(layoutId).length;
  const panels = [];
  for (let i = 0; i < count; i += 1) {
    panels.push(previousPanels[i] ? { ...previousPanels[i] } : blankPanel());
  }
  return panels;
}

// --- photo fitting ----------------------------------------------------------

function drawFittedPhoto(ctx, image, rect, panel) {
  const [rx, ry, rw, rh] = rect;
  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  const base = Math.max(rw / iw, rh / ih) * panel.zoom;
  const dw = iw * base;
  const dh = ih * base;
  const dx = rx + (rw - dw) / 2 + panel.offsetX * rw * 0.55;
  const dy = ry + (rh - dh) / 2 + panel.offsetY * rh * 0.55;
  // Pin the photo to the panel edges so a large offset can never expose
  // the white board behind it: the photo always covers its panel.
  const pinnedX = Math.min(rx, Math.max(rx + rw - dw, dx));
  const pinnedY = Math.min(ry, Math.max(ry + rh - dh, dy));
  ctx.save();
  ctx.beginPath();
  ctx.rect(rx, ry, rw, rh);
  ctx.clip();
  ctx.drawImage(image, pinnedX, pinnedY, dw, dh);
  ctx.restore();
}

function drawPanelGrade(ctx, rect, tint, strength) {
  const [rx, ry, rw, rh] = rect;
  const wash = ctx.createLinearGradient(rx, ry, rx, ry + rh);
  wash.addColorStop(0, tint);
  wash.addColorStop(1, '#2a0a4d');
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = Math.min(1, strength + 0.25);
  ctx.fillStyle = wash;
  ctx.fillRect(rx, ry, rw, rh);
  ctx.restore();
}

// --- procedural decoration --------------------------------------------------

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let grainTileCache = null;
function grainTile() {
  if (grainTileCache) return grainTileCache;
  const tile = document.createElement('canvas');
  tile.width = 140;
  tile.height = 140;
  const tctx = tile.getContext('2d');
  const image = tctx.createImageData(140, 140);
  const rand = seededRandom(20261119);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = Math.floor(rand() * 255);
    image.data[i] = v;
    image.data[i + 1] = v;
    image.data[i + 2] = v;
    image.data[i + 3] = 255;
  }
  tctx.putImageData(image, 0, 0);
  grainTileCache = tile;
  return tile;
}

function drawFilmGrain(ctx, width, height) {
  const tile = grainTile();
  const pattern = ctx.createPattern(tile, 'repeat');
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawVignette(ctx, width, height) {
  const glow = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.42,
    width / 2, height / 2, Math.max(width, height) * 0.75,
  );
  glow.addColorStop(0, 'rgba(10, 4, 24, 0)');
  glow.addColorStop(1, 'rgba(10, 4, 24, 0.55)');
  ctx.save();
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawHalftoneDots(ctx, x, y, width, height, colour) {
  const step = Math.max(10, width / 46);
  ctx.save();
  ctx.fillStyle = colour;
  for (let row = 0; row * step < height; row += 1) {
    const fade = 1 - row / Math.max(1, Math.ceil(height / step));
    for (let col = 0; col * step < width; col += 1) {
      const r = step * 0.22 * (0.35 + 0.65 * fade) * (0.7 + 0.3 * ((col + row) % 2));
      ctx.beginPath();
      ctx.arc(x + col * step + step / 2, y + row * step + step / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawPalmSilhouette(ctx, baseX, baseY, size, lean, colour) {
  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.scale(lean, 1);
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineCap = 'round';
  // Trunk, curving gently as it rises.
  ctx.lineWidth = size * 0.045;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.06, -size * 0.55, size * 0.02, -size * 0.95);
  ctx.stroke();
  // Fronds fanning from the crown.
  const crownX = size * 0.02;
  const crownY = -size * 0.95;
  for (let i = 0; i < 7; i += 1) {
    const angle = Math.PI * (0.08 + (i / 6) * 0.84);
    const reach = size * (0.42 + (i % 3) * 0.07);
    const tipX = crownX + Math.cos(angle) * reach;
    const tipY = crownY - Math.sin(angle) * reach * 0.55;
    const midX = crownX + Math.cos(angle) * reach * 0.55;
    const midY = crownY - Math.sin(angle) * reach * 0.75 - size * 0.08;
    ctx.lineWidth = size * 0.028;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(midX, midY, tipX, tipY);
    ctx.stroke();
  }
  // Coconut cluster.
  ctx.beginPath();
  ctx.arc(crownX - size * 0.02, crownY + size * 0.03, size * 0.035, 0, Math.PI * 2);
  ctx.arc(crownX + size * 0.03, crownY + size * 0.04, size * 0.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// --- title block ------------------------------------------------------------

function titleBandY(state, height) {
  if (state.titlePosition === 'top') return height * 0.1;
  if (state.titlePosition === 'bottom') return height * 0.78;
  return height * 0.42;
}

function fitTitleFont(ctx, text, maxWidth, baseSize) {
  let size = baseSize;
  ctx.font = `${size}px Anton, "Arial Black", sans-serif`;
  while (size > 28 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px Anton, "Arial Black", sans-serif`;
  }
  return size;
}

function drawTitleBlock(ctx, state, width, height, stops) {
  const bandY = titleBandY(state, height);
  const bandHeight = height * 0.17;
  const bandX = width * 0.05;
  const bandWidth = width * 0.9;

  // Halftone strip behind the title.
  ctx.save();
  ctx.globalAlpha = 0.5;
  drawHalftoneDots(ctx, bandX, bandY, bandWidth, bandHeight * 0.42, '#ffffff');
  ctx.restore();

  const title = (state.title || 'Neon Shore').toUpperCase();
  const baseSize = width * 0.115 * state.titleSize;
  const size = fitTitleFont(ctx, title, bandWidth, baseSize);
  const titleY = bandY + bandHeight * 0.52 + size * 0.32;
  const centreX = width / 2;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.font = `${size}px Anton, "Arial Black", sans-serif`;
  if (state.titleStyle === 'sunset') {
    const fill = ctx.createLinearGradient(centreX - bandWidth / 2, 0, centreX + bandWidth / 2, 0);
    fill.addColorStop(0, stops[0]);
    fill.addColorStop(0.5, stops[3]);
    fill.addColorStop(1, stops[4]);
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = size * 0.08;
    ctx.shadowOffsetY = size * 0.05;
    ctx.lineWidth = size * 0.1;
    ctx.strokeStyle = '#1a0b2e';
    ctx.strokeText(title, centreX, titleY);
    ctx.fillStyle = fill;
    ctx.fillText(title, centreX, titleY);
  } else if (state.titleStyle === 'neon') {
    ctx.shadowColor = stops[5];
    ctx.shadowBlur = size * 0.35;
    ctx.lineWidth = size * 0.09;
    ctx.strokeStyle = '#12041f';
    ctx.strokeText(title, centreX, titleY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, centreX, titleY);
    ctx.shadowBlur = 0;
    ctx.fillStyle = stops[5];
    ctx.globalAlpha = 0.9;
    ctx.fillText(title, centreX, titleY);
  } else {
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = size * 0.06;
    ctx.shadowOffsetY = size * 0.045;
    ctx.lineWidth = size * 0.14;
    ctx.strokeStyle = '#160a26';
    ctx.strokeText(title, centreX, titleY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, centreX, titleY);
  }
  ctx.restore();

  const subtitle = (state.subtitle || '').trim();
  if (subtitle) {
    const subSize = Math.max(20, size * 0.3);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = subSize * 0.2;
    ctx.shadowOffsetY = subSize * 0.08;
    ctx.fillStyle = stops[5];
    ctx.fillText(subtitle, centreX, titleY + size * 0.62);
    ctx.restore();
  }
}

// --- main entry -------------------------------------------------------------

export function drawCover(ctx, state, images, width, height) {
  const stops = coverGradeStops(state.grade);
  const rects = coverPanelRects(state.layout);
  const gutter = Math.max(4, Math.round(width * 0.006));

  // White poster board: the gutters read as thin white frame lines.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  rects.forEach((fraction, index) => {
    const rect = [
      fraction[0] * width + gutter,
      fraction[1] * height + gutter,
      fraction[2] * width - gutter * 2,
      fraction[3] * height - gutter * 2,
    ];
    const panel = state.panels[index] || blankPanel();
    // A panel naming a photo past the loaded ones wraps around to a loaded
    // photo, so panels keep their intended alternation while photos load.
    const image = panel.photo === null || !images.length
      ? null
      : images[panel.photo % images.length];
    if (image) {
      drawFittedPhoto(ctx, image, rect, panel);
      drawPanelGrade(ctx, rect, stops[3], state.gradeStrength);
    } else {
      const sky = ctx.createLinearGradient(rect[0], rect[1], rect[0], rect[1] + rect[3]);
      sky.addColorStop(0, stops[0]);
      sky.addColorStop(0.55, stops[1]);
      sky.addColorStop(1, stops[2]);
      ctx.fillStyle = sky;
      ctx.fillRect(rect[0], rect[1], rect[2], rect[3]);
    }
  });

  // Sunset sky band across the whole cover, low and warm.
  const skyBand = ctx.createLinearGradient(0, 0, 0, height * 0.34);
  skyBand.addColorStop(0, stops[0]);
  skyBand.addColorStop(1, 'rgba(255,46,136,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.5 * state.gradeStrength + 0.15;
  ctx.fillStyle = skyBand;
  ctx.fillRect(0, 0, width, height * 0.34);
  ctx.restore();

  if (state.palms) {
    const palmColour = 'rgba(18, 6, 34, 0.88)';
    drawPalmSilhouette(ctx, width * 0.055, height * 0.99, height * 0.22, 1, palmColour);
    drawPalmSilhouette(ctx, width * 0.945, height * 0.99, height * 0.17, 1, palmColour);
  }

  drawTitleBlock(ctx, state, width, height, stops);

  if (state.grain) {
    drawFilmGrain(ctx, width, height);
    drawVignette(ctx, width, height);
  }

  // Outer white frame.
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = gutter * 1.6;
  ctx.strokeRect(gutter * 0.8, gutter * 0.8, width - gutter * 1.6, height - gutter * 1.6);
  ctx.restore();
}

export function renderCoverToCanvas(state, images, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas.getContext('2d'), state, images, width, height);
  return canvas;
}
