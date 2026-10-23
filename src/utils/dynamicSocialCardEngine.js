/**
 * ADSA T-Board Dynamic Social Card & Visual Preview Engine
 * Pure client-side HTML5 Canvas & Vector renderer for generating
 * auto-generated, high-resolution (1200x630 & 1080x1080) social cards.
 * Zero external npm dependencies. Fully offline capable.
 */

const CANTEEN_CANONICAL = 'https://canteen.alathurpadidars.in';

/**
 * Draw a rounded rectangle with path
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Text auto-wrap helper for Canvas
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  if (!text) return y;
  const words = text.split(' ');
  let line = '';
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, y);
      line = words[n] + ' ';
      y += lineHeight;
      lineCount++;
      if (lineCount >= maxLines - 1 && n < words.length - 1) {
        // Append ellipsis to last line
        let remaining = words.slice(n).join(' ');
        while (ctx.measureText(remaining + '...').width > maxWidth && remaining.length > 0) {
          remaining = remaining.slice(0, -1);
        }
        ctx.fillText(remaining.trim() + '...', x, y);
        return y + lineHeight;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, y);
  return y + lineHeight;
}

/**
 * Draw the official Alathurpadi Dars Academy Crest Shield on canvas
 */
function drawDarsCrest(ctx, x, y, size = 64, color = '#34d399') {
  ctx.save();
  ctx.translate(x, y);

  // Background rounded box
  roundRect(ctx, 0, 0, size, size, size * 0.28);
  ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
  ctx.stroke();

  // Scale path to fit inside box with padding
  const scale = size / 64;
  ctx.scale(scale, scale);

  // Shield Path
  ctx.beginPath();
  ctx.moveTo(32, 16);
  ctx.lineTo(48, 22);
  ctx.lineTo(48, 36);
  ctx.bezierCurveTo(48, 46, 41, 52, 32, 56);
  ctx.bezierCurveTo(23, 52, 16, 46, 16, 36);
  ctx.lineTo(16, 22);
  ctx.closePath();
  ctx.lineWidth = 2.8;
  ctx.strokeStyle = color;
  ctx.stroke();

  // Inner Checkmark
  ctx.beginPath();
  ctx.moveTo(25, 36);
  ctx.lineTo(30, 41);
  ctx.lineTo(39, 31);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  ctx.restore();
}

/**
 * Render Background Grid & Ambient Glows
 */
function renderCanvasBackground(ctx, width, height, themeColor = '#059669') {
  // 1. Deep Obsidian Base
  ctx.fillStyle = '#080d0b';
  ctx.fillRect(0, 0, width, height);

  // 2. Ambient Radial Glow
  const radial = ctx.createRadialGradient(
    width * 0.75,
    height * 0.25,
    50,
    width * 0.65,
    height * 0.35,
    width * 0.75
  );
  radial.addColorStop(0, themeColor);
  radial.addColorStop(0.5, 'rgba(6, 78, 59, 0.4)');
  radial.addColorStop(1, 'rgba(8, 13, 11, 0)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);

  // 3. Bottom Teal Glow
  const bottomRadial = ctx.createRadialGradient(
    width * 0.2,
    height * 0.85,
    20,
    width * 0.25,
    height * 0.8,
    width * 0.5
  );
  bottomRadial.addColorStop(0, 'rgba(13, 148, 136, 0.25)');
  bottomRadial.addColorStop(1, 'rgba(8, 13, 11, 0)');
  ctx.fillStyle = bottomRadial;
  ctx.fillRect(0, 0, width, height);

  // 4. Subtle Architectural Grid Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.lineWidth = 1;
  const gridSize = 100;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 5. Outer Glassmorphic Border
  const pad = 32;
  roundRect(ctx, pad, pad, width - pad * 2, height - pad * 2, 28);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/**
 * Main Dynamic Generator Function
 * Generates an HTML5 Canvas populated with rich dynamic social card content.
 */
export async function renderDynamicSocialCard(template = 'portal', options = {}) {
  const isSquare = options.aspectRatio === 'square';
  const width = isSquare ? 1080 : 1200;
  const height = isSquare ? 1080 : 630;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Theme accent colors based on template
  const themeColors = {
    portal: '#059669',
    menu: '#0d9488',
    board: '#10b981',
    kitchen: '#d97706',
    support: '#0ea5e9',
    announcement: options.severity === 'critical' ? '#e11d48' : '#059669',
  };
  const themeColor = themeColors[template] || '#059669';

  // Render Background
  renderCanvasBackground(ctx, width, height, themeColor);

  // Draw Dars Crest
  const crestX = 76;
  const crestY = 72;
  drawDarsCrest(ctx, crestX, crestY, 68, '#34d399');

  // Institution Header
  ctx.fillStyle = '#a7f3d0';
  ctx.font = '800 15px -apple-system, "Plus Jakarta Sans", sans-serif';
  ctx.fillText('ALATHURPADI DARS STUDENTS ASSOCIATION (ADSA)', 160, 98);

  ctx.fillStyle = '#9ca3af';
  ctx.font = '500 13px -apple-system, "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Historical Alathurpadi Juma Masjid • Melmuri, Malappuram, Kerala', 160, 122);

  // Date / IST Pill on top-right
  const todayStr = options.dateStr || new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const datePillText = `📅 ${todayStr} (IST)`;
  ctx.font = '700 13px -apple-system, "Plus Jakarta Sans", sans-serif';
  const datePillWidth = ctx.measureText(datePillText).width + 24;
  roundRect(ctx, width - 76 - datePillWidth, 76, datePillWidth, 38, 12);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.fillText(datePillText, width - 76 - datePillWidth + 12, 100);

  // Template Specific Content
  if (template === 'menu') {
    renderMenuTemplate(ctx, width, height, options);
  } else if (template === 'kitchen') {
    renderKitchenTemplate(ctx, width, height, options);
  } else if (template === 'announcement') {
    renderAnnouncementTemplate(ctx, width, height, options);
  } else {
    renderPortalTemplate(ctx, width, height, options);
  }

  // Footer Domain & Verification Bar
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  const footerY = height - 76;
  ctx.beginPath();
  ctx.moveTo(76, footerY);
  ctx.lineTo(width - 76, footerY);
  ctx.stroke();

  ctx.fillStyle = '#34d399';
  ctx.font = '700 15px -apple-system, monospace';
  ctx.fillText(options.customUrl || CANTEEN_CANONICAL, 76, footerY + 34);

  ctx.fillStyle = '#9ca3af';
  ctx.font = '600 13px -apple-system, "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Official Alathurpadi Dars Food Management System', width - 76, footerY + 34);
  ctx.textAlign = 'left';

  return canvas;
}

/**
 * 1. Master Portal Template
 */
function renderPortalTemplate(ctx, width, height, options) {
  // Main Title
  const titleGrad = ctx.createLinearGradient(76, 210, 600, 210);
  titleGrad.addColorStop(0, '#34d399');
  titleGrad.addColorStop(0.5, '#6ee7b7');
  titleGrad.addColorStop(1, '#a7f3d0');

  ctx.fillStyle = titleGrad;
  ctx.font = '900 68px -apple-system, "Plus Jakarta Sans", sans-serif';
  ctx.fillText(options.title || 'ADSA T-Board', 76, 225);

  // Subtitle
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 28px -apple-system, "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    options.subtitle || 'Smart Dining Logistics & Real-Time Token Attendance',
    76,
    275
  );

  // Description
  ctx.fillStyle = '#d1fae5';
  ctx.font = '500 18px -apple-system, "Plus Jakarta Sans", sans-serif';
  wrapText(
    ctx,
    options.description ||
      'Live meal attendance matrix, kitchen preparation manifests, dietary avoiders setup, and instant dispute care concierge at Alathurpadi Dars.',
    76,
    318,
    width - 152,
    26,
    2
  );

  // Feature Badges Row
  const badges = [
    { label: '⚡ Live 3D Token Matrix', color: '#10b981' },
    { label: '🍲 Kitchen Display (KDS)', color: '#14b8a6' },
    { label: '🚫 Dietary Avoiders', color: '#f43f5e' },
    { label: '⏰ Cutoff 14:00 IST', color: '#f59e0b' },
  ];

  let badgeX = 76;
  const badgeY = height === 1080 ? 460 : 395;
  badges.forEach((b) => {
    ctx.font = '700 14px -apple-system, "Plus Jakarta Sans", sans-serif';
    const bWidth = ctx.measureText(b.label).width + 30;

    roundRect(ctx, badgeX, badgeY, bWidth, 48, 14);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(b.label, badgeX + 15, badgeY + 29);
    badgeX += bWidth + 14;
  });
}

/**
 * 2. Live Daily Menu Template
 */
function renderMenuTemplate(ctx, width, height, options) {
  // Title
  ctx.fillStyle = '#2dd4bf';
  ctx.font = '900 56px -apple-system, "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Campus Dining Menu', 76, 210);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 24px -apple-system, "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Weekly Roster & Today’s Culinary Specials', 76, 250);

  // Menu Cards Display (Breakfast & Lunch)
  const bfDish = options.breakfastDish || 'Appam & Veg Kurma / Egg Curry';
  const lunchDish = options.lunchDish || 'Traditional Rice & Fish Curry / Moru';
  const bfCategory = options.breakfastCategory || 'Veg / Egg';
  const lunchCategory = options.lunchCategory || 'Non-Veg';

  const cardWidth = (width - 152 - 20) / 2;
  const cardHeight = height === 1080 ? 280 : 155;
  const cardY = 280;

  // Card 1: Breakfast
  roundRect(ctx, 76, cardY, cardWidth, cardHeight, 18);
  ctx.fillStyle = 'rgba(20, 184, 166, 0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(45, 212, 191, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#5eead4';
  ctx.font = '800 13px -apple-system, "Plus Jakarta Sans", sans-serif';
  ctx.fillText('☕ BREAKFAST (07:00 - 08:30 IST)', 96, cardY + 34);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 20px -apple-system, "Plus Jakarta Sans", sans-serif';
  wrapText(ctx, bfDish, 96, cardY + 68, cardWidth - 40, 26, 2);

  ctx.fillStyle = '#9ca3af';
  ctx.font = '600 12px -apple-system, "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Category: ${bfCategory}`, 96, cardY + cardHeight - 22);

  // Card 2: Lunch
  const lunchX = 76 + cardWidth + 20;
  roundRect(ctx, lunchX, cardY, cardWidth, cardHeight, 18);
  ctx.fillStyle = 'rgba(244, 63, 94, 0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(251, 113, 133, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#fda4af';
  ctx.font = '800 13px -apple-system, "Plus Jakarta Sans", sans-serif';
  ctx.fillText('🍲 LUNCH (12:30 - 14:00 IST)', lunchX + 20, cardY + 34);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 20px -apple-system, "Plus Jakarta Sans", sans-serif';
  wrapText(ctx, lunchDish, lunchX + 20, cardY + 68, cardWidth - 40, 26, 2);

  ctx.fillStyle = '#9ca3af';
  ctx.font = '600 12px -apple-system, "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Category: ${lunchCategory}`, lunchX + 20, cardY + cardHeight - 22);

  // Cutoff Banner
  const bannerY = cardY + cardHeight + 20;
  roundRect(ctx, 76, bannerY, width - 152, 42, 12);
  ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.font = '700 13px -apple-system, "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    '⏰ Daily Cutoff strictly at 14:00 IST for tomorrow’s preparation counts & dietary exclusions.',
    96,
    bannerY + 26
  );
}

/**
 * 3. Kitchen Manifest Template
 */
function renderKitchenTemplate(ctx, width, height, options) {
  ctx.fillStyle = '#fbbf24';
  ctx.font = '900 56px -apple-system, "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Kitchen Display Manifest', 76, 210);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 24px -apple-system, "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Real-Time Serving Quantities & Substitute Roster', 76, 250);

  // Counter Islands
  const totalDiners = options.totalDiners || '342';
  const avoidersCount = options.avoidersCount || '28';
  const prepTarget = options.prepTarget || '314';

  const boxWidth = (width - 152 - 30) / 3;
  const boxHeight = 150;
  const boxY = 280;

  // Box 1: Total Diners
  roundRect(ctx, 76, boxY, boxWidth, boxHeight, 18);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.stroke();

  ctx.fillStyle = '#9ca3af';
  ctx.font = '700 13px -apple-system, sans-serif';
  ctx.fillText('REGISTERED TOKENS', 96, boxY + 36);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 48px -apple-system, sans-serif';
  ctx.fillText(totalDiners, 96, boxY + 95);

  // Box 2: Avoiders
  const box2X = 76 + boxWidth + 15;
  roundRect(ctx, box2X, boxY, boxWidth, boxHeight, 18);
  ctx.fillStyle = 'rgba(244, 63, 94, 0.1)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(251, 113, 133, 0.3)';
  ctx.stroke();

  ctx.fillStyle = '#fda4af';
  ctx.font = '700 13px -apple-system, sans-serif';
  ctx.fillText('DIETARY AVOIDERS', box2X + 20, boxY + 36);
  ctx.fillStyle = '#f43f5e';
  ctx.font = '900 48px -apple-system, sans-serif';
  ctx.fillText(avoidersCount, box2X + 20, boxY + 95);

  // Box 3: Prep Target
  const box3X = box2X + boxWidth + 15;
  roundRect(ctx, box3X, boxY, boxWidth, boxHeight, 18);
  ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.3)';
  ctx.stroke();

  ctx.fillStyle = '#6ee7b7';
  ctx.font = '700 13px -apple-system, sans-serif';
  ctx.fillText('PRIMARY COOK COUNT', box3X + 20, boxY + 36);
  ctx.fillStyle = '#34d399';
  ctx.font = '900 48px -apple-system, sans-serif';
  ctx.fillText(prepTarget, box3X + 20, boxY + 95);
}

/**
 * 5. Announcement Template
 */
function renderAnnouncementTemplate(ctx, width, height, options) {
  const isCritical = options.severity === 'critical';
  ctx.fillStyle = isCritical ? '#f43f5e' : '#34d399';
  ctx.font = '900 56px -apple-system, "Plus Jakarta Sans", sans-serif';
  ctx.fillText(isCritical ? '⚠️ Campus Alert' : '📢 Official Bulletin', 76, 210);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 28px -apple-system, "Plus Jakarta Sans", sans-serif';
  wrapText(ctx, options.title || 'Important Dining Announcement', 76, 260, width - 152, 34, 2);

  ctx.fillStyle = '#d1fae5';
  ctx.font = '500 18px -apple-system, "Plus Jakarta Sans", sans-serif';
  wrapText(
    ctx,
    options.body || 'Please note the dining timings and cutoff rules for the upcoming meal services.',
    76,
    335,
    width - 152,
    26,
    3
  );
}

/**
 * Convert Canvas to Blob (Promise-based)
 */
export function canvasToBlob(canvas, type = 'image/png', quality = 0.95) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

/**
 * Trigger browser file download
 */
export function downloadCanvasAsPng(canvas, filename = 'adsa-tboard-social-card.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Copy image to system clipboard
 */
export async function copyCanvasToClipboard(canvas) {
  if (typeof navigator === 'undefined' || !navigator.clipboard || !window.ClipboardItem) {
    throw new Error('Clipboard Image API not supported in this browser');
  }
  const blob = await canvasToBlob(canvas, 'image/png');
  await navigator.clipboard.write([
    new window.ClipboardItem({
      'image/png': blob,
    }),
  ]);
}
