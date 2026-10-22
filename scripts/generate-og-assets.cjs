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

  <!-- Left Institution Emblem Crest (Islamic 8-point geometric star + Shield) -->
  <g transform="translate(84, 82)">
    <rect width="72" height="72" rx="20" fill="#10b981" fill-opacity="0.15" stroke="#10b981" stroke-width="1.5"/>
    <!-- Shield Icon -->
    <path d="M36 18 L52 24 V38 C52 48 45 54 36 58 C27 54 20 48 20 38 V24 Z" fill="none" stroke="#34d399" stroke-width="3" stroke-linejoin="round"/>
    <!-- Checkmark in Shield -->
    <path d="M29 38 L34 43 L43 33" fill="none" stroke="#6ee7b7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
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
      https://adsatboard.web.app/
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
    <text x="0" y="32" fill="#2dd4bf" font-family="-apple-system, monospace" font-size="16" font-weight="700">https://adsatboard.web.app/menu</text>
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
    <text x="0" y="32" fill="#34d399" font-family="-apple-system, monospace" font-size="16" font-weight="700">https://adsatboard.web.app/board</text>
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
    <text x="0" y="32" fill="#34d399" font-family="-apple-system, monospace" font-size="16" font-weight="700">https://adsatboard.web.app/support</text>
    <text x="1032" y="32" fill="#9ca3af" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" text-anchor="end">Official ADSA Campus Care Hub</text>
  </g>
</svg>
`;

renderSvgToPng(supportSvg, path.join(PUBLIC_DIR, 'og-support.png'), 1200, 630);
console.log('✅ Generated public/og-support.png (1200x630)');

// 5. GENERATE FAVICON SUITE & TOUCH ICONS
console.log('🎨 Generating Favicon & Touch Icon Suite...');

const iconBaseSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="iconBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#022c22"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="110" fill="url(#iconBg)"/>
  <rect x="20" y="20" width="472" height="472" rx="90" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="8"/>
  <!-- Dars Crest Shield -->
  <path d="M256 90 L380 140 V260 C380 345 325 400 256 425 C187 400 132 345 132 260 V140 Z" fill="none" stroke="#34d399" stroke-width="20" stroke-linejoin="round"/>
  <path d="M200 256 L240 296 L320 206" fill="none" stroke="#ffffff" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

renderSvgToPng(iconBaseSvg, path.join(PUBLIC_DIR, 'apple-touch-icon.png'), 180, 180);
renderSvgToPng(iconBaseSvg, path.join(PUBLIC_DIR, 'android-chrome-192x192.png'), 192, 192);
renderSvgToPng(iconBaseSvg, path.join(PUBLIC_DIR, 'android-chrome-512x512.png'), 512, 512);
renderSvgToPng(iconBaseSvg, path.join(PUBLIC_DIR, 'favicon-32x32.png'), 32, 32);
renderSvgToPng(iconBaseSvg, path.join(PUBLIC_DIR, 'favicon-16x16.png'), 16, 16);

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
      type: "image/png"
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
console.log('🎉 All social assets generated successfully!');
