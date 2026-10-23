/**
 * ADSA T-Board Multi-Route Social Pages Prerenderer
 * Injects route-specific OpenGraph, Twitter cards, and canonicals into static HTML entrypoints in /dist
 * for Telegram, WhatsApp, Twitter/X, Discord, Slack, and Google/Bing crawlers.
 * Target Domain: https://canteen.alathurpadidars.in
 */

const fs = require('fs');
const path = require('path');

const BASE_DOMAIN = 'https://canteen.alathurpadidars.in';
const DIST_DIR = path.resolve(__dirname, '../dist');
const BASE_HTML_PATH = path.join(DIST_DIR, 'index.html');

if (!fs.existsSync(BASE_HTML_PATH)) {
  console.log('⚠️ dist/index.html not found. Run vite build first.');
  process.exit(0);
}

const baseHtml = fs.readFileSync(BASE_HTML_PATH, 'utf8');

const ROUTES = [
  {
    path: 'menu',
    title: 'Campus Dining Menu & Specials • ADSA T-Board',
    description: 'Weekly meal schedules, special campus culinary rosters, and dietary avoiders manifest for Alathurpadi Dars.',
    image: `${BASE_DOMAIN}/og-menu.png`,
    url: `${BASE_DOMAIN}/menu`,
  },
  {
    path: 'support',
    title: 'ADSA Care & Concierge Hub • Campus Helpdesk',
    description: 'Direct student inquiry tracking, 1-click token unblocking, committee hotlines, and campus dining assistance.',
    image: `${BASE_DOMAIN}/og-support.png`,
    url: `${BASE_DOMAIN}/support`,
  },
  {
    path: 'guide',
    title: 'System Guide & Visual User Manual • ADSA T-Board',
    description: 'Comprehensive documentation and visual manual on meal schedules, cutoff rules, color codes, and gestures.',
    image: `${BASE_DOMAIN}/og-preview.png`,
    url: `${BASE_DOMAIN}/guide`,
  },
  {
    path: 'breakfast',
    title: 'Breakfast Supply Manifest & Section Logistics • ADSA T-Board',
    description: 'Real-time morning meal attendance counts, section division manifests, and dietary avoiders for Alathurpadi Dars.',
    image: `${BASE_DOMAIN}/og-preview.png`,
    url: `${BASE_DOMAIN}/breakfast`,
  },
  {
    path: 'lunch',
    title: 'Lunch Supply Manifest & Section Logistics • ADSA T-Board',
    description: 'Real-time afternoon meal attendance counts, section division manifests, and dietary avoiders for Alathurpadi Dars.',
    image: `${BASE_DOMAIN}/og-preview.png`,
    url: `${BASE_DOMAIN}/lunch`,
  },
  {
    path: 'list',
    title: 'Dietary Avoiders & Manifest Documents • ADSA T-Board',
    description: 'Official student dietary avoidance registers, PDF export manifests, and culinary logs for Alathurpadi Dars.',
    image: `${BASE_DOMAIN}/og-preview.png`,
    url: `${BASE_DOMAIN}/list`,
  },
  {
    path: 'student',
    title: 'Student Dining Portal & Digital Pass • ADSA T-Board',
    description: 'Student meal routine, advance date overrides, self-service dietary preference change requests, and digital dining pass.',
    image: `${BASE_DOMAIN}/og-preview.png`,
    url: `${BASE_DOMAIN}/student`,
  },
  {
    path: 'adab',
    title: 'ആദാബുൽ മാഇദ • അന്നവും അദബും | ADSA T-Board',
    description: 'ദർസിലെ പവിത്രമായ തീൻമേശ മര്യാദകൾ, തിരുനബി ﷺ യുടെ ചര്യ, 1/3 വയറിന്റെ സമതുലിതാവസ്ഥ, അന്നം പാഴാക്കാതിരിക്കാനുള്ള ആഹ്വാനം. ആലത്തൂർപടി ദർസ് ഫുഡ് മാനേജ്‌മെന്റ് സിസ്റ്റം.',
    image: `${BASE_DOMAIN}/og-preview.png`,
    url: `${BASE_DOMAIN}/adab`,
  },
];

console.log(`🚀 Prerendering route-specific Social HTML pages for ${BASE_DOMAIN}...`);

ROUTES.forEach((route) => {
  const routeDir = path.join(DIST_DIR, route.path);
  if (!fs.existsSync(routeDir)) {
    fs.mkdirSync(routeDir, { recursive: true });
  }

  let routeHtml = baseHtml;

  // Replace Title & Canonical
  routeHtml = routeHtml.replace(/<title>.*?<\/title>/, `<title>${route.title}</title>`);
  routeHtml = routeHtml.replace(/<meta name="title" content=".*?" \/>/, `<meta name="title" content="${route.title}" />`);
  routeHtml = routeHtml.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${route.url}" />`);

  // Replace OpenGraph meta tags
  routeHtml = routeHtml.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${route.title}" />`);
  routeHtml = routeHtml.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${route.description}" />`);
  routeHtml = routeHtml.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${route.url}" />`);
  routeHtml = routeHtml.replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${route.image}" />`);
  routeHtml = routeHtml.replace(/<meta property="og:image:secure_url" content=".*?" \/>/, `<meta property="og:image:secure_url" content="${route.image}" />`);

  // Replace Twitter Card meta tags
  routeHtml = routeHtml.replace(/<meta name="twitter:domain" content=".*?" \/>/, `<meta name="twitter:domain" content="canteen.alathurpadidars.in" />`);
  routeHtml = routeHtml.replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${route.title}" />`);
  routeHtml = routeHtml.replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${route.description}" />`);
  routeHtml = routeHtml.replace(/<meta name="twitter:url" content=".*?" \/>/, `<meta name="twitter:url" content="${route.url}" />`);
  routeHtml = routeHtml.replace(/<meta name="twitter:image" content=".*?" \/>/, `<meta name="twitter:image" content="${route.image}" />`);

  const targetPath = path.join(routeDir, 'index.html');
  fs.writeFileSync(targetPath, routeHtml, 'utf8');
  console.log(`✅ Prerendered dist/${route.path}/index.html (${route.image})`);
});

console.log('🎉 Multi-Route Social OpenGraph HTML pages generated successfully!');
