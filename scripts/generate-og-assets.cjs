/**
 * ADSA T-Board Social Assets & Favicon Generator
 * Generates pixel-perfect 1200x630 OpenGraph banners and high-DPI icon suites
 * for Telegram, WhatsApp, Twitter/X, Discord, Slack, and Apple iMessage.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PUBLIC_DIR = path.resolve(__dirname, '../public');
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Helper to convert SVG string to PNG using macOS native sips
function renderSvgToPng(svgContent, targetPngPath, width, height) {
  const tempSvgPath = targetPngPath.replace(/\.png$/, '.temp.svg');
  fs.writeFileSync(tempSvgPath, svgContent, 'utf8');
  try {
    execSync(`sips -s format png "${tempSvgPath}" --out "${targetPngPath}"`, { stdio: 'pipe' });
    if (width && height) {
      execSync(`sips -z ${height} ${width} "${targetPngPath}"`, { stdio: 'pipe' });
    }
  } finally {
    if (fs.existsSync(tempSvgPath)) {
      fs.unlinkSync(tempSvgPath);
    }
  }
}

console.log('🎨 Generating high-fidelity Social OpenGraph Cards (1200x630)...');

// Authentic ADSA T-Board Dining Logo (Cutlery / Crossed Spoon & Fork from commit 44672f31ca70b3b07516c714d27da1b8b3b7c1eb)
const TBOARD_CUTLERY_PATH = "M97.34,0.74c0.86-0.93,2.3-0.99,3.23-0.13c0.93,0.86,0.99,2.3,0.13,3.23L81.98,24.1l-0.03,0.04 c-2.29,2.77-3.86,5.33-4.56,7.67c-0.62,2.07-0.53,3.95,0.39,5.59c0.49,0.88,0.33,1.96-0.32,2.67l0,0l-8.89,9.62 c-0.87-0.95-1.56-1.72-2.02-2.22c-0.21-0.28-0.45-0.55-0.7-0.81l-0.02,0.02c-0.12-0.13-0.25-0.25-0.38-0.37l7.6-8.23 c-0.89-2.38-0.88-4.91-0.06-7.6c0.88-2.92,2.75-6.03,5.44-9.27c0.06-0.08,0.11-0.16,0.18-0.23L97.32,0.72L97.34,0.74L97.34,0.74z M57.13,55.01c-0.84-0.94-0.76-2.39,0.18-3.23c0.94-0.84,2.39-0.76,3.23,0.18c9.41,10.54,38.5,41.73,46.56,53.39 c10.63,15.05-5.83,19.79-11.29,14.31c-13.64-13.19-42.6-46.82-55.33-61.08c-4.58,1.94-9.03,2.24-13.5,0.96 c-4.81-1.37-9.52-4.58-14.3-9.51l-0.06-0.06c-3.64-3.84-6.49-7.63-8.55-11.38c-2.11-3.86-3.4-7.68-3.86-11.47 c-0.49-4.08-0.11-7.88,0.99-11.25c1.29-3.96,3.58-7.31,6.58-9.8c3.02-2.5,6.73-4.12,10.87-4.62c3.44-0.41,7.19-0.06,11.07,1.21 c5.37,1.75,11.63,6.1,16.82,11.68c3.83,4.11,7.11,8.92,9.06,13.87c2.03,5.16,2.65,10.5,1.02,15.5c-0.96,2.96-2.7,5.74-5.4,8.25 c-0.93,0.86-2.37,0.8-3.23-0.12c-0.86-0.93-0.8-2.37,0.12-3.23c2.09-1.95,3.43-4.08,4.16-6.33c1.26-3.87,0.73-8.16-0.93-12.38 c-1.74-4.42-4.69-8.74-8.15-12.45c-4.68-5.02-10.23-8.91-14.91-10.44c-3.21-1.04-6.28-1.34-9.09-1c-3.26,0.4-6.18,1.65-8.51,3.6 c-2.34,1.95-4.13,4.58-5.16,7.71c-0.89,2.73-1.2,5.87-0.79,9.26c0.39,3.2,1.5,6.47,3.32,9.81c1.91,3.43,4.53,6.9,7.9,10.45 l0.02,0.03c4.22,4.35,8.27,7.15,12.28,8.29c3.79,1.08,7.65,0.66,11.68-1.35c0.92-0.53,2.11-0.35,2.84,0.47 c12.42,13.91,42.63,48.92,56.01,61.89c5.81,2.37,9.03-0.55,6.25-5.7C100.7,102.43,63.5,62.17,57.13,55.01L57.13,55.01L57.13,55.01z M45.07,75.12l-29.16,31.55c-0.06,0.06-0.11,0.12-0.18,0.18c-4.26,4.6,3.28,11.3,7.96,6.82l28.32-30.65l3.04,3.45l-28.1,30.41l0,0 c-0.06,0.07-0.12,0.13-0.2,0.2c-1.68,1.41-3.37,2.33-5.08,2.71c-1.76,0.4-3.49,0.22-5.15-0.56c-0.28-0.11-0.54-0.25-0.77-0.46 l-4.03-3.73l0,0c-0.06-0.06-0.12-0.11-0.18-0.18c-1.56-1.8-2.3-3.72-2.1-5.75c0.19-1.92,1.21-3.79,3.14-5.59l29.44-31.86 L45.07,75.12L45.07,75.12z M75.63,57.46l1.73-1.87c0.86-0.93,2.31-0.99,3.23-0.13s0.99,2.3,0.13,3.23l-2,2.16L75.63,57.46 L75.63,57.46z M104.45,7.43c0.86-0.93,2.3-0.99,3.23-0.13c0.93,0.86,0.99,2.3,0.13,3.23L91.4,28.3c-0.86,0.93-2.3,0.99-3.23,0.13 c-0.93-0.86-0.99-2.3-0.13-3.23L104.45,7.43L104.45,7.43L104.45,7.43z M111.55,14c0.86-0.93,2.3-0.99,3.23-0.13 c0.93,0.86,0.99,2.3,0.13,3.23L98.51,34.86c-0.86,0.93-2.3,0.99-3.23,0.13c-0.93-0.86-0.99-2.3-0.13-3.23L111.55,14L111.55,14 L111.55,14z M118.91,20.83c0.86-0.93,2.3-0.99,3.23-0.13c0.93,0.86,0.99,2.31,0.13,3.23L103.55,44.2c-0.07,0.07-0.14,0.13-0.21,0.2 c-4.26,4.1-8.33,6.47-12.22,7.14c-4.22,0.73-8.09-0.47-11.64-3.57c-0.95-0.83-1.04-2.28-0.22-3.22c0.83-0.95,2.28-1.04,3.22-0.22 c2.45,2.14,5.07,2.98,7.84,2.49c2.98-0.51,6.26-2.48,9.84-5.93l0.02-0.02l18.71-20.25L118.91,20.83L118.91,20.83z";

// 1. MASTER PORTAL SOCIAL CARD (og-preview.png)
const masterSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <!-- Background Gradients -->
    <radialGradient id="bgGlow" cx="70%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#065f46" stop-opacity="0.85"/>
      <stop offset="45%" stop-color="#064e3b" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#080d0b" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
    </linearGradient>
    <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="50%" stop-color="#6ee7b7"/>
      <stop offset="100%" stop-color="#a7f3d0"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="30" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Deep Obsidian Background with Emerald Ambient Glow -->
  <rect width="1200" height="630" fill="#080d0b"/>
  <rect width="1200" height="630" fill="url(#bgGlow)"/>

  <!-- Subtle High-Tech Blueprint Grid Overlay -->
  <g stroke="rgba(255,255,255,0.03)" stroke-width="1">
    <line x1="0" y1="105" x2="1200" y2="105"/>
    <line x1="0" y1="210" x2="1200" y2="210"/>
    <line x1="0" y1="315" x2="1200" y2="315"/>
    <line x1="0" y1="420" x2="1200" y2="420"/>
    <line x1="0" y1="525" x2="1200" y2="525"/>
    <line x1="200" y1="0" x2="200" y2="630"/>
    <line x1="400" y1="0" x2="400" y2="630"/>
    <line x1="600" y1="0" x2="600" y2="630"/>
    <line x1="800" y1="0" x2="800" y2="630"/>
    <line x1="1000" y1="0" x2="1000" y2="630"/>
  </g>

  <!-- Glowing Accent Orbs -->
  <circle cx="980" cy="220" r="180" fill="#10b981" opacity="0.12" filter="url(#glow)"/>
  <circle cx="220" cy="500" r="140" fill="#0d9488" opacity="0.1" filter="url(#glow)"/>

  <!-- Outer Glass Frame Border -->
  <rect x="36" y="36" width="1128" height="558" rx="28" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>

  <!-- Left Institution Emblem Crest (ADSA T-Board Dining Cutlery Icon) -->
  <g transform="translate(84, 82)">
    <rect width="72" height="72" rx="20" fill="#10b981" fill-opacity="0.15" stroke="#10b981" stroke-width="1.5"/>
    <g transform="translate(15, 15) scale(0.34)" fill="#34d399">
      <path d="${TBOARD_CUTLERY_PATH}"/>
    </g>
  </g>

  <!-- Institution Eyebrow Header -->
  <text x="176" y="112" fill="#a7f3d0" font-family="-apple-system, 'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="800" letter-spacing="3">
    ALATHURPADI DARS STUDENTS ASSOCIATION (ADSA)
  </text>
  <text x="176" y="136" fill="#9ca3af" font-family="-apple-system, 'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="500" letter-spacing="1">
    Historical Alathurpadi Juma Masjid • Melmuri, Malappuram, Kerala
  </text>

  <!-- Main Title: ADSA T-Board -->
  <text x="84" y="246" fill="url(#titleGrad)" font-family="-apple-system, 'Plus Jakarta Sans', sans-serif" font-size="76" font-weight="900" letter-spacing="-1.5">
    ADSA T-Board
  </text>

  <!-- Subtitle: Food Management System -->
  <text x="84" y="304" fill="#ffffff" font-family="-apple-system, 'Plus Jakarta Sans', sans-serif" font-size="32" font-weight="800" letter-spacing="-0.5">
    Smart Dining Logistics &amp; Real-Time Token Attendance
  </text>

  <text x="84" y="348" fill="#d1fae5" font-family="-apple-system, 'Plus Jakarta Sans', sans-serif" font-size="20" font-weight="500" opacity="0.9">
    Official automated meal management system serving hundreds of campus residents daily.
  </text>

  <!-- 4 Feature Pills Row -->
  <g transform="translate(84, 400)">
    <!-- Pill 1: 3D Token Matrix -->
    <g transform="translate(0, 0)">
      <rect width="230" height="52" rx="14" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(52, 211, 153, 0.4)" stroke-width="1.2"/>
      <circle cx="26" cy="26" r="6" fill="#10b981"/>
      <text x="44" y="32" fill="#ffffff" font-family="-apple-system, 'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="700">Live 3D Token Matrix</text>
    </g>

    <!-- Pill 2: Kitchen Display -->
    <g transform="translate(245, 0)">
      <rect width="235" height="52" rx="14" fill="rgba(20, 184, 166, 0.15)" stroke="rgba(45, 212, 191, 0.4)" stroke-width="1.2"/>
      <circle cx="26" cy="26" r="6" fill="#14b8a6"/>
      <text x="44" y="32" fill="#ffffff" font-family="-apple-system, 'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="700">Kitchen Display (KDS)</text>
    </g>

    <!-- Pill 3: Dietary Avoiders -->
    <g transform="translate(495, 0)">
      <rect width="230" height="52" rx="14" fill="rgba(244, 63, 94, 0.15)" stroke="rgba(251, 113, 133, 0.4)" stroke-width="1.2"/>
      <circle cx="26" cy="26" r="6" fill="#f43f5e"/>
      <text x="44" y="32" fill="#ffffff" font-family="-apple-system, 'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="700">Dietary Avoiders</text>
    </g>

    <!-- Pill 4: Cutoff 14:00 IST -->
    <g transform="translate(740, 0)">
      <rect width="240" height="52" rx="14" fill="rgba(245, 158, 11, 0.15)" stroke="rgba(251, 191, 36, 0.4)" stroke-width="1.2"/>
      <circle cx="26" cy="26" r="6" fill="#f59e0b"/>
      <text x="44" y="32" fill="#ffffff" font-family="-apple-system, 'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="700">Daily Cutoff 14:00 IST</text>
    </g>
  </g>

  <!-- Bottom Institutional Trust Bar -->
  <g transform="translate(84, 520)">
    <line x1="0" y1="0" x2="1032" y2="0" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <text x="0" y="32" fill="#34d399" font-family="-apple-system, monospace" font-size="16" font-weight="700">
      https://canteen.alathurpadidars.in/
    </text>
    <text x="1032" y="32" fill="#9ca3af" font-family="-apple-system, 'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="600" text-anchor="end">
      Alathurpadi Dars Canteen Operations • Verified Portal
    </text>
  </g>
</svg>
`;

renderSvgToPng(masterSvg, path.join(PUBLIC_DIR, 'og-preview.png'), 1200, 630);
console.log('✅ Generated public/og-preview.png (1200x630)');

// 2. DINING MENU SOCIAL CARD (og-menu.png)
const menuSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="menuGlow" cx="70%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#0f766e" stop-opacity="0.85"/>
      <stop offset="45%" stop-color="#064e3b" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#080d0b" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="menuTitleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2dd4bf"/>
      <stop offset="50%" stop-color="#5eead4"/>
      <stop offset="100%" stop-color="#99f6e4"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#080d0b"/>
  <rect width="1200" height="630" fill="url(#menuGlow)"/>
  <rect x="36" y="36" width="1128" height="558" rx="28" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>

  <text x="84" y="120" fill="#5eead4" font-family="-apple-system, sans-serif" font-size="16" font-weight="800" letter-spacing="3">
    ADSA T-BOARD • CULINARY OPERATIONS
  </text>
  <text x="84" y="240" fill="url(#menuTitleGrad)" font-family="-apple-system, sans-serif" font-size="70" font-weight="900">
    Campus Dining Menu
  </text>
  <text x="84" y="300" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="30" font-weight="800">
    Weekly Meal Schedule, Culinary Specials &amp; Avoiders
  </text>
  <text x="84" y="348" fill="#ccfbf1" font-family="-apple-system, sans-serif" font-size="20" font-weight="500">
    Breakfast, Lunch, Dinner rosters with dietary substitute manifests for Alathurpadi Dars.
  </text>

  <g transform="translate(84, 400)">
    <rect width="250" height="52" rx="14" fill="rgba(20, 184, 166, 0.2)" stroke="#2dd4bf" stroke-width="1.2"/>
    <text x="30" y="32" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="15" font-weight="700">🍲 Daily Canteen Menu</text>
    <g transform="translate(265, 0)">
      <rect width="250" height="52" rx="14" fill="rgba(244, 63, 94, 0.2)" stroke="#fb7185" stroke-width="1.2"/>
      <text x="30" y="32" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="15" font-weight="700">🚫 Avoiders Matrix</text>
    </g>
    <g transform="translate(530, 0)">
      <rect width="260" height="52" rx="14" fill="rgba(245, 158, 11, 0.2)" stroke="#fbbf24" stroke-width="1.2"/>
      <text x="30" y="32" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="15" font-weight="700">⏰ Cutoff: 14:00 IST</text>
    </g>
  </g>

  <g transform="translate(84, 520)">
    <line x1="0" y1="0" x2="1032" y2="0" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <text x="0" y="32" fill="#2dd4bf" font-family="-apple-system, monospace" font-size="16" font-weight="700">https://canteen.alathurpadidars.in/menu</text>
    <text x="1032" y="32" fill="#9ca3af" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" text-anchor="end">Alathurpadi Dars Canteen Portal</text>
  </g>
</svg>
`;

renderSvgToPng(menuSvg, path.join(PUBLIC_DIR, 'og-menu.png'), 1200, 630);
console.log('✅ Generated public/og-menu.png (1200x630)');

// 3. DAILY TOKEN BOARD SOCIAL CARD (og-board.png)
const boardSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="boardGlow" cx="70%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#065f46" stop-opacity="0.85"/>
      <stop offset="45%" stop-color="#064e3b" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#080d0b" stop-opacity="1"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#080d0b"/>
  <rect width="1200" height="630" fill="url(#boardGlow)"/>
  <rect x="36" y="36" width="1128" height="558" rx="28" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>

  <text x="84" y="120" fill="#6ee7b7" font-family="-apple-system, sans-serif" font-size="16" font-weight="800" letter-spacing="3">
    ADSA T-BOARD • REAL-TIME OPERATIONS
  </text>
  <text x="84" y="240" fill="#34d399" font-family="-apple-system, sans-serif" font-size="70" font-weight="900">
    Interactive Token Board
  </text>
  <text x="84" y="300" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="30" font-weight="800">
    3D Tactile Attendance Matrix &amp; Student Token Ledger
  </text>
  <text x="84" y="348" fill="#d1fae5" font-family="-apple-system, sans-serif" font-size="20" font-weight="500">
    Active token tracking, quick status toggles, batch filters, and cutoff countdown.
  </text>

  <g transform="translate(84, 520)">
    <line x1="0" y1="0" x2="1032" y2="0" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <text x="0" y="32" fill="#34d399" font-family="-apple-system, monospace" font-size="16" font-weight="700">https://canteen.alathurpadidars.in/board</text>
    <text x="1032" y="32" fill="#9ca3af" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" text-anchor="end">Live Token Management Board</text>
  </g>
</svg>
`;

renderSvgToPng(boardSvg, path.join(PUBLIC_DIR, 'og-board.png'), 1200, 630);
console.log('✅ Generated public/og-board.png (1200x630)');

// 4. CARE CONCIERGE & SUPPORT SOCIAL CARD (og-support.png)
const supportSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="careGlow" cx="70%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#047857" stop-opacity="0.85"/>
      <stop offset="45%" stop-color="#064e3b" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#080d0b" stop-opacity="1"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#080d0b"/>
  <rect width="1200" height="630" fill="url(#careGlow)"/>
  <rect x="36" y="36" width="1128" height="558" rx="28" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>

  <text x="84" y="120" fill="#a7f3d0" font-family="-apple-system, sans-serif" font-size="16" font-weight="800" letter-spacing="3">
    ADSA CARE &amp; CONCIERGE • STUDENT HELPDESK
  </text>
  <text x="84" y="240" fill="#34d399" font-family="-apple-system, sans-serif" font-size="70" font-weight="900">
    ADSA Care Hub
  </text>
  <text x="84" y="300" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="30" font-weight="800">
    Instant Dispute Resolution, Token Unblocking &amp; Direct Hotlines
  </text>
  <text x="84" y="348" fill="#d1fae5" font-family="-apple-system, sans-serif" font-size="20" font-weight="500">
    Verified committee assistance, WhatsApp hotlines, ticket tracking, and knowledge base.
  </text>

  <g transform="translate(84, 520)">
    <line x1="0" y1="0" x2="1032" y2="0" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <text x="0" y="32" fill="#34d399" font-family="-apple-system, monospace" font-size="16" font-weight="700">https://canteen.alathurpadidars.in/support</text>
    <text x="1032" y="32" fill="#9ca3af" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" text-anchor="end">Official ADSA Campus Care Hub</text>
  </g>
</svg>
`;

renderSvgToPng(supportSvg, path.join(PUBLIC_DIR, 'og-support.png'), 1200, 630);
console.log('✅ Generated public/og-support.png (1200x630)');

// 5. GENERATE FAVICON SUITE & TOUCH ICONS (T-BOARD DINING LOGO)
console.log('🎨 Generating Favicon & Touch Icon Suite (T-Board Dining Logo)...');

const iconBaseSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="iconBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#022c22"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#iconBg)"/>
  <rect x="16" y="16" width="480" height="480" rx="96" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="6"/>
  <g transform="translate(106, 106) scale(2.44)" fill="#ffffff">
    <path d="${TBOARD_CUTLERY_PATH}"/>
  </g>
</svg>
`;

// Save vector SVG icons (favicon.svg & vite.svg)
fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), iconBaseSvg.trim(), 'utf8');
fs.writeFileSync(path.join(PUBLIC_DIR, 'vite.svg'), iconBaseSvg.trim(), 'utf8');
console.log('✅ Generated public/favicon.svg & public/vite.svg');

// Render high-DPI and standard raster icons
renderSvgToPng(iconBaseSvg, path.join(PUBLIC_DIR, 'apple-touch-icon.png'), 180, 180);
console.log('✅ Generated public/apple-touch-icon.png (180x180)');
renderSvgToPng(iconBaseSvg, path.join(PUBLIC_DIR, 'android-chrome-192x192.png'), 192, 192);
console.log('✅ Generated public/android-chrome-192x192.png (192x192)');
renderSvgToPng(iconBaseSvg, path.join(PUBLIC_DIR, 'android-chrome-512x512.png'), 512, 512);
console.log('✅ Generated public/android-chrome-512x512.png (512x512)');
renderSvgToPng(iconBaseSvg, path.join(PUBLIC_DIR, 'favicon-32x32.png'), 32, 32);
console.log('✅ Generated public/favicon-32x32.png (32x32)');
renderSvgToPng(iconBaseSvg, path.join(PUBLIC_DIR, 'favicon-16x16.png'), 16, 16);
console.log('✅ Generated public/favicon-16x16.png (16x16)');

// Generate multi-resolution favicon.ico via Python Pillow
try {
  const icoScript = `from PIL import Image; img = Image.open('${path.join(PUBLIC_DIR, 'favicon-32x32.png')}'); img.save('${path.join(PUBLIC_DIR, 'favicon.ico')}', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])`;
  execSync(`python3 -c "${icoScript}"`, { stdio: 'pipe' });
  console.log('✅ Generated public/favicon.ico (16x16, 32x32, 48x48)');
} catch (icoErr) {
  console.warn('⚠️ Could not generate favicon.ico via Pillow, skipping .ico compilation:', icoErr.message);
}

// 6. GENERATE WEB APP MANIFEST
const manifestContent = {
  name: "ADSA T-Board • Alathurpadi Dars",
  short_name: "ADSA T-Board",
  description: "Official Food Logistics & Token Attendance Management System for Alathurpadi Dars.",
  start_url: "/",
  display: "standalone",
  background_color: "#080d0b",
  theme_color: "#059669",
  orientation: "portrait-primary",
  icons: [
    {
      src: "/favicon-32x32.png",
      sizes: "32x32",
      type: "image/png"
    },
    {
      src: "/android-chrome-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable"
    },
    {
      src: "/android-chrome-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable"
    }
  ]
};

fs.writeFileSync(path.join(PUBLIC_DIR, 'site.webmanifest'), JSON.stringify(manifestContent, null, 2), 'utf8');
console.log('✅ Generated public/site.webmanifest');
console.log('🎉 All social and icon assets generated successfully!');
