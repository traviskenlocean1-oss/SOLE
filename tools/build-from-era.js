// Builds SOLE's index.html, era.css and main.js from ERA's real source (tools/era-src).
// Structure, classes and animation code stay theirs; text, media, logo, colors and fonts become SOLE's.
// Run: node tools/build-from-era.js
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = path.join(__dirname, 'era-src');
const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');

// ---------- colors ----------
const COLORS = [
  ['#340c24', '#1f3328'], // plum "on-color" sections -> banyan green
  ['#b5cedb', '#a7c4e2'], // sky blue brand -> pale Miami sky (the cut-out house photos sit on it)
  ['#17233b', '#1c2620'], // navy ink -> green-black ink
  ['#f3f3ec', '#f6f1e6'], // cream
  ['#758696', '#7b8478'],
  ['#f8bbcb', '#f2b48f'],
];
const recolor = s => COLORS.reduce((acc, [a, b]) => acc.replace(new RegExp(a, 'gi'), b), s);

// ---------- css ----------
let css = read('era.css');
css = css.replace(/@font-face\s*{[^}]*MaisonNeue[^}]*}/g, '');
css = recolor(css);
// ERA's Adobe/Webflow fonts are licensed to their domain; free stand-ins until SOLE has its own kit
css = css.replace(/"?Maison Neue Extended"?/g, "Archivo").replace(/ambroise-francois-std/g, "'Instrument Serif'").replace(/sloop-script-three/g, "'Pinyon Script'");
// the stand-in display face is wider than Ambroise François, so headings scale down to keep ERA's line widths
css = css.replace(/var\(--_fonts---(h[1-6])--size\)/g, 'calc(var(--_fonts---$1--size) * var(--sole-dscale, 1))');
// ...and line-heights grow by the same factor so every heading box keeps ERA's height
css = css.replace(/var\(--_fonts---(h[1-6])--line-height\)/g, 'calc(var(--_fonts---$1--line-height) / var(--sole-dscale, 1))');
fs.writeFileSync(path.join(ROOT, 'assets/css/era.css'), css);

// ---------- js ----------
let js = read('main.js');
js = js.replace('"Deal from Era"', '"Deal from SOLE"');
fs.writeFileSync(path.join(ROOT, 'assets/js/main.js'), js);

// ---------- html ----------
let html = read('index.html');

// media: map ERA files (by name fragment) to SOLE photos
const IMG = 'assets/img/';
const MEDIA = [
  ['gated-community_day', 'hero-day.jpg'],
  ['gated-community_night', 'hero-night.jpg'],
  ['img_cam_05_alpha', 'quote-house.webp'],
  ['img_cam_02', 'loc-1.jpg'],
  ['img_cam_03', 'loc-2.jpg'],
  ['img_cam_07', 'loc-3.jpg'],
  ['img_cam_09', 'loc-4.jpg'],
  ['img_cta_1920', 'cta.jpg'],
  ['img_clouds_02', 'clouds-1.jpg'],
  ['img_clouds_47', 'clouds-2.jpg'],
  ['img_clouds_33', 'clouds-3.jpg'],
  ['master-plan', 'master-plan.jpg'],
  ['garden-2', 'garden-2.jpg'],
  ['era-residence-garden', 'garden.jpg'],
  ['ground-floor-basement', 'courtyard.jpg'],
  ['era-residence-gated-community', 'gated.jpg'],
  ['era-residence-pool', 'pool.jpg'],
  ['spa-%26-gym', 'spa.jpg'],
  ['era-residence-parking', 'entrance.jpg'],
  ['era-residence-kitchen', 'living.jpg'],
  ['6a15153b797c328a9f2f5964_era-residence-terrace', 'terrace-2.jpg'],
  ['6a150bbc2a39862be04f2cd5_era-residence-terrace', 'bedroom.jpg'],
  ['6a15723f346e4b3a6c0af26a_era-residence-terrace', 'dining.jpg'],
  ['era-residence-landscaping', 'landscaping.jpg'],
  ['bougainvillea-flowers_01', 'flower-1.webp'],
  ['bougainvillea-flowers_02', 'flower-2.webp'],
  ['bougainvillea-flowers_03', 'flower-3.webp'],
  ['bougainvillea-flowers_04', 'flower-4.webp'],
  ['bougainvillea-flowers_05', 'flower-1.webp'],
  ['bougainvillea-flowers_06', 'flower-2.webp'],
  ['bougainvillea-flowers_07', 'flower-3.webp'],
  ['fav_512x512', '../brand/favicon-512.png'],
  ['preloader_arch-l', '../svg/preloader-arch-l.svg'],
  ['preloader_bg', 'preloader-script.png'],
  ['loc_path_labels', '../svg/loc-path-labels.svg'],
  ['loc_path', '../svg/loc-path.svg'],
  ['landscape.svg', '../brand/sole-symbol.svg'],
];
const mapUrl = url => {
  const hit = MEDIA.find(([k]) => url.includes(k));
  return hit ? IMG + hit[1] : null;
};
// srcset/sizes only point at ERA's resized copies
html = html.replace(/\s(srcset|sizes)="[^"]*"/g, '');
// flower videos: our own 10s VP9-alpha sway loops (tools/sway). No HEVC-alpha .mov for Safari, which falls back to the poster.
const FLOWER_VIDEO = n => `assets/video/flower-${((+n - 1) % 4) + 1}.webm`;
html = html.replace(/<source src="https:\/\/assets\.era-residence\.com\/flowers\/bougainvillea-flowers_(\d+)\.webm"[^>]*>/g, (m, n) => `<source src="${FLOWER_VIDEO(n)}" type="video/webm"/>`);
html = html.replace(/<source[^>]*assets\.era-residence\.com\/flowers[^>]*\.mov"[^>]*>/g, '');
html = html.replace(/(src|poster|href|content|data-src)="(https:\/\/(?:cdn\.prod\.website-files\.com|assets\.era-residence\.com)\/[^"]+)"/g, (m, attr, url) => {
  if (/webflow\.[a-z0-9.]+\.js/.test(url)) return `${attr}="assets/js/webflow.js"`;
  if (/webflow\.shared\.[a-z0-9]+\.min\.css/.test(url)) return `${attr}="assets/css/era.css"`;
  const local = mapUrl(url);
  return local ? `${attr}="${local}"` : m;
});

// inline-style background urls (preloader arch) use url('...')
html = html.replace(/url\('(https:\/\/cdn\.prod\.website-files\.com\/[^']+)'\)/g, (m, url) => { const l = mapUrl(url); return l ? `url('${l}')` : m; });
// partner logo image -> the name already shows as text
html = html.replace(/(<img[^>]*src=")[^"]*Unreal%20logo\.svg("[^>]*>)/g, '$1assets/svg/grove-house-logo.svg$2');
// contact + legal + socials
html = html.replace(/href="tel:\+34655408648"/g, 'href="tel:+13055550187"');
html = html.replace(/href="https:\/\/maps\.app\.goo\.gl\/[^"]*"/g, 'href="https://maps.google.com/?q=South+Bayshore+Drive+Coconut+Grove+Miami+FL"');
html = html.replace(/aria-label="Avenida Litoral, 29680 Estepona, Málaga, Spain"/g, 'aria-label="South Bayshore Drive, Coconut Grove, Miami, FL 33133"');
html = html.replace(/href="https:\/\/cdn\.prod\.website-files\.com\/[^"]+\.pdf"/g, 'href="#"');
html = html.replace(/href="https:\/\/www\.(linkedin|facebook|instagram)\.com\/[^"]*"/g, 'href="#"');

// text: exact visible strings -> SOLE copy
const TEXT = JSON.parse(fs.readFileSync(path.join(__dirname, 'sole-text.json'), 'utf8'));
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
for (const [from, to] of Object.entries(TEXT)) {
  html = html.replace(new RegExp('>\\s*' + esc(from) + '\\s*<', 'g'), () => '>' + to + '<');
}
html = html.replace(/(Three reasons to choose )Era/g, '$1Sole');
html = html.replace(/(aria-label|alt|title)="([^"]*)"/g, (m, a, v) => `${a}="${v.replace(/envy maison|ERA Residences?|Era Residence|Era\b/gi, 'SOLE Residence')}"`);

// logo emblem: their 40x40 symbol -> our sun symbol
const SYM = fs.readFileSync(path.join(ROOT, 'assets/brand/sole-symbol.svg'), 'utf8').trim();
html = html.replace(/<svg width="100%" height="100%" viewBox="0 0 40 40"[\s\S]*?<\/svg>/g, SYM);
// circular "RESIDENCE · ERA · ESTEPONA" badge -> our own ring text
const ring = (size, id) => `<svg width="100%" height="100%" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><path id="${id}" d="M${size / 2},${size / 2} m-${size * 0.4},0 a${size * 0.4},${size * 0.4} 0 1,1 ${size * 0.8},0 a${size * 0.4},${size * 0.4} 0 1,1 -${size * 0.8},0"/></defs><text fill="currentColor" font-family="var(--_fonts---font-body)" font-size="${size * 0.068}" letter-spacing="${size * 0.034}"><textPath href="#${id}" startOffset="0">SOLE · RESIDENCE · COCONUT GROVE ·</textPath></text></svg>`;
html = html.replace(/<svg[^>]*viewBox="0 0 120 120"[\s\S]*?<\/svg>/, ring(120, 'ring-desk'));
html = html.replace(/<svg[^>]*viewBox="0 0 80 80"[\s\S]*?<\/svg>/, ring(80, 'ring-mob'));

// third-party bits that belong to ERA only
html = html.replace(/<script src="https:\/\/use\.typekit\.net[^>]*><\/script>\s*<script[^>]*>try\{Typekit\.load\(\);\}catch\(e\)\{\}<\/script>/, '');
html = html.replace(/<script>\s*\(function\(w,d,s,l,i\)[\s\S]*?<\/script>/, '');
html = html.replace(/<noscript><iframe[^>]*googletagmanager[\s\S]*?<\/noscript>/g, '');
html = html.replace(/<script>\s*console\.log\([\s\S]*?<\/script>/, '');
html = html.replace(/<script>\s*document\.addEventListener\('DOMContentLoaded', function \(\) \{\s*function loadtwc[\s\S]*?<\/script>/, '<script src="assets/js/main.js"></script>');
html = html.replace(/<script src="https:\/\/unpkg\.com\/@barba\/core"><\/script>/, '<script src="https://unpkg.com/@barba/core@2.10.3/dist/barba.umd.js"></script>');
html = html.replace(/\s*integrity="[^"]*"/g, '');

// ERA's structured data and video previews describe their project
html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');
html = html.replace(/<meta property="og:video[^>]*>/g, '');
html = html.replace(/<link href="[^"]*" rel="(icon|apple-touch-icon)"[^>]*>/g, '');
html = html.replace(/<!-- (Google Tag Manager|End Google Tag Manager)[^>]*-->/g, '');
html = html.replace(/href="https:\/\/thefirstthelast\.agency[^"]*"/g, 'href="https://getvisionarywebstudio.com"').replace(/aria-label="The First The Last"/g, 'aria-label="Visionary Web Studio"');

// their agency's animated logo (Lottie) -> Visionary credit as text only
html = html.replace(/<div data-json="[^"]*" class="credits_logo"><\/div>/g, '');
html = html.replace(/aria-label="Thefirstthelast"/g, 'aria-label="Visionary Web Studio"');

// head: SOLE's own SEO layer + fonts
const HEAD = fs.readFileSync(path.join(__dirname, 'sole-head.html'), 'utf8');
html = html.replace(/<head>[\s\S]*?<link href="[^"]*era\.css"[^>]*>/, `<head>${HEAD}<link href="assets/css/era.css" rel="stylesheet" type="text/css"/>`);
html = html.replace(/<\/head>/, '<link href="assets/css/sole.css" rel="stylesheet" type="text/css"/></head>');
html = html.replace(/data-wf-domain="[^"]*"/, '').replace(/<html /, '<html lang="en" ');
html = html.replace(/<!-- Last Published:[^>]*-->/, '');
html = recolor(html);

fs.writeFileSync(path.join(ROOT, 'index.html'), html);
const left = (html.match(/website-files\.com|era-residence\.com|Estepona|Marbella/gi) || []);
console.log('index.html written,', html.length, 'bytes; leftover ERA refs:', left.length);
