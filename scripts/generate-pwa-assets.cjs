const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create clean, high-contrast SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </radialGradient>
    <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#0ea5e9" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <linearGradient id="silverPlate" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="50%" stop-color="#cbd5e1" />
      <stop offset="100%" stop-color="#64748b" />
    </linearGradient>
  </defs>

  <rect width="512" height="512" rx="104" fill="url(#bgGlow)" />
  <rect width="496" height="496" x="8" y="8" rx="96" fill="none" stroke="#1e293b" stroke-width="4" />

  <g stroke="#1e293b" stroke-width="3" stroke-linecap="round">
    <line x1="256" y1="56" x2="256" y2="120" />
    <line x1="256" y1="392" x2="256" y2="456" />
    <line x1="56" y1="256" x2="120" y2="256" />
    <line x1="392" y1="256" x2="456" y2="256" />
    <circle cx="256" cy="56" r="6" fill="#38bdf8" />
    <circle cx="256" cy="456" r="6" fill="#38bdf8" />
    <circle cx="56" cy="256" r="6" fill="#38bdf8" />
    <circle cx="456" cy="256" r="6" fill="#38bdf8" />
  </g>

  <polygon points="256,110 380,180 380,332 256,402 132,332 132,180" 
           fill="#0b0f19" stroke="url(#neonCyan)" stroke-width="8" stroke-linejoin="round" />

  <rect x="196" y="196" width="120" height="120" rx="20" fill="url(#silverPlate)" />
  <rect x="216" y="216" width="80" height="80" rx="12" fill="#020617" stroke="#38bdf8" stroke-width="4" />

  <g fill="#38bdf8">
    <rect x="226" y="180" width="8" height="16" rx="2" />
    <rect x="252" y="180" width="8" height="16" rx="2" />
    <rect x="278" y="180" width="8" height="16" rx="2" />
    <rect x="226" y="316" width="8" height="16" rx="2" />
    <rect x="252" y="316" width="8" height="16" rx="2" />
    <rect x="278" y="316" width="8" height="16" rx="2" />
    <rect x="180" y="226" width="16" height="8" rx="2" />
    <rect x="180" y="252" width="16" height="8" rx="2" />
    <rect x="180" y="278" width="16" height="8" rx="2" />
    <rect x="316" y="226" width="16" height="8" rx="2" />
    <rect x="316" y="252" width="16" height="8" rx="2" />
    <rect x="316" y="278" width="16" height="8" rx="2" />
  </g>

  <circle cx="256" cy="256" r="14" fill="#38bdf8" />
  <circle cx="256" cy="256" r="6" fill="#ffffff" />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');

// 2. Valid 8-bit RGBA PNG Generator Function (WebAPK Compliant)
function crc32(buf) {
  let table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([len, typeAndData, crc]);
}

function generateChixusPng(size, isMaskable = false) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // Truecolor with alpha (RGBA)
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const ihdrChunk = makeChunk("IHDR", ihdr);

  const rowSize = 1 + size * 4;
  const raw = Buffer.alloc(rowSize * size);

  const cx = size / 2;
  const cy = size / 2;
  const maxR = isMaskable ? size * 0.36 : size * 0.44;
  const coreR = isMaskable ? size * 0.16 : size * 0.20;
  const dotR = isMaskable ? size * 0.05 : size * 0.06;

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0;
    for (let x = 0; x < size; x++) {
      const px = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let r = 8, g = 12, b = 20, a = 255;

      if (dist >= maxR - 8 && dist <= maxR) {
        r = 56; g = 189; b = 248; a = 255;
      } else if (dist < maxR - 8 && dist > coreR + 10) {
        r = 11; g = 15; b = 25; a = 255;
      } else if (dist <= coreR + 10 && dist > coreR) {
        r = 203; g = 213; b = 225; a = 255;
      } else if (dist <= coreR && dist > dotR + 4) {
        r = 2; g = 6; b = 23; a = 255;
      } else if (dist <= dotR + 4 && dist > dotR) {
        r = 56; g = 189; b = 248; a = 255;
      } else if (dist <= dotR) {
        r = 255; g = 255; b = 255; a = 255;
      }

      if ((Math.abs(dx) <= 2 && dist < maxR) || (Math.abs(dy) <= 2 && dist < maxR)) {
        if (dist > coreR + 14 && dist < maxR - 12) {
          r = 56; g = 189; b = 248; a = 255;
        }
      }

      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
      raw[px + 3] = a;
    }
  }

  const idatChunk = makeChunk("IDAT", zlib.deflateSync(raw));
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));
  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generateChixusPng(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generateChixusPng(512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generateChixusPng(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generateChixusPng(180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generateChixusPng(64, false));

// 3. Clean WebAPK-compliant manifest.json
const manifestContent = {
  id: "/",
  name: "CHIXUS Visual Fault Inspector",
  short_name: "CHIXUS",
  description: "CHIXUS sovereign decentralized electronics verification network, optical solder fault inspector, and operator profile matrix.",
  start_url: "/",
  scope: "/",
  display: "standalone",
  orientation: "portrait",
  theme_color: "#080c14",
  background_color: "#080c14",
  icons: [
    {
      src: "/pwa-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any"
    },
    {
      src: "/pwa-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any"
    },
    {
      src: "/pwa-maskable-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable"
    }
  ]
};

fs.writeFileSync(path.join(publicDir, 'manifest.json'), JSON.stringify(manifestContent, null, 2), 'utf8');

// 4. Network-First Service Worker v5.0.0 (Never caches JS/TSX bundles or HTML so updates are instant)
const swContent = `// CHIXUS Sovereign Edge Service Worker v5.0.0 - Always-Fresh Live Bundle Architecture
const CACHE_NAME = 'chixus-pwa-v5.0.0';
const STATIC_ICONS = [
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ICONS).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const reqUrl = new URL(event.request.url);
  const isStaticIcon = STATIC_ICONS.includes(reqUrl.pathname);
  if (!isStaticIcon) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
`;

fs.writeFileSync(path.join(publicDir, 'sw.js'), swContent, 'utf8');
console.log('✅ CHIXUS PWA icons, manifest.json, and sw.js (v5.0.0) generated in /public');

