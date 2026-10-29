// Draws SOLE's contact map (assets/svg/map-sales-office.svg) from OpenStreetMap data in the
// line style of ERA's map: buildings ink @10%, roads as white bands with hairline edges, a soft sea.
// Data: map/osm.xml from api.openstreetmap.org (© OpenStreetMap contributors, ODbL).
const fs = require('fs');
const path = require('path');
const x = fs.readFileSync(path.join(__dirname, 'osm.xml'), 'utf8');

const W = 1440, H = 760, INK = '#17233B'; // ERA's ink; the build recolors it to SOLE's
// ERA's pin sits at top 43% / right 44% of the map box
const PIN = { x: W * 0.56 - 8, y: H * 0.43 + 8 };
const OFFICE = { lat: 25.7285, lon: -80.2330 }; // South Bayshore Drive by Dinner Key
const S = 75000, K = Math.cos(OFFICE.lat * Math.PI / 180);
const px = (lat, lon) => [PIN.x + (lon - OFFICE.lon) * K * S, PIN.y - (lat - OFFICE.lat) * S];

const nodes = new Map();
for (const m of x.matchAll(/<node id="(\d+)"[^>]*lat="([-\d.]+)" lon="([-\d.]+)"/g)) nodes.set(m[1], [+m[2], +m[3]]);
const ways = [];
for (const m of x.matchAll(/<way id="(\d+)"[^>]*>([\s\S]*?)<\/way>/g)) {
  const refs = [...m[2].matchAll(/<nd ref="(\d+)"/g)].map(r => r[1]);
  const tags = Object.fromEntries([...m[2].matchAll(/<tag k="([^"]+)" v="([^"]*)"/g)].map(t => [t[1], t[2]]));
  ways.push({ refs, tags });
}
const pts = w => w.refs.map(r => nodes.get(r)).filter(Boolean).map(([la, lo]) => px(la, lo));
const d = (p, close) => p.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('') + (close ? 'Z' : '');

// sea: stitch coastline ways into chains (water lies to the right of the drawing direction),
// then close each chain around the frame on its water side
const coast = ways.filter(w => w.tags.natural === 'coastline').map(w => w.refs.slice());
let merged = true;
while (merged) {
  merged = false;
  for (let i = 0; i < coast.length && !merged; i++) for (let j = 0; j < coast.length && !merged; j++) {
    if (i !== j && coast[i][coast[i].length - 1] === coast[j][0]) { coast[i] = coast[i].concat(coast[j].slice(1)); coast.splice(j, 1); merged = true; }
  }
}
const chains = coast.map(c => c.map(r => nodes.get(r)).filter(Boolean).map(([la, lo]) => px(la, lo)));
const main = chains.sort((a, b) => b.length - a.length)[0] || [];
// mainland coast here runs roughly SW->NE with the bay to the SE, so close it via the bottom-right
const sea = main.length ? d([...main, [W + 400, main[main.length - 1][1]], [W + 400, H + 400], [main[0][0], H + 400]], true) : '';
const islands = chains.slice(1).filter(c => c.length > 3 && c[0][0] === c[c.length - 1][0]).map(c => d(c, true));

const ROAD = { primary: 7, secondary: 6, tertiary: 5, residential: 3.2, unclassified: 3.2, service: 1.8 };
const roads = ways.filter(w => ROAD[w.tags.highway]).map(w => ({ w: ROAD[w.tags.highway], p: d(pts(w)) }));
const buildings = ways.filter(w => w.tags.building).map(w => d(pts(w), true));

// landmarks: centroid of a named way or a named node
const named = n => {
  const w = ways.find(v => v.tags.name === n);
  if (w) { const p = pts(w); return [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length]; }
  const m = x.match(new RegExp(`<node id="\\d+"[^>]*lat="([-\\d.]+)" lon="([-\\d.]+)"[^>]*>\\s*(?:<tag[^>]*>\\s*)*?<tag k="name" v="${n}"`));
  return m ? px(+m[1], +m[2]) : null;
};
const LABELS = [['Peacock Park', ['PEACOCK', 'PARK']], ['CocoWalk', ['COCOWALK']], ['Dinner Key Marina', ['DINNER KEY', 'MARINA']], ['Miami City Hall', ['CITY HALL']]];
const labels = LABELS.map(([n, lines]) => {
  const p = named(n); if (!p) { console.log('label not found:', n); return ''; }
  const [lx, ly] = p;
  return `<circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="2.4" fill="${INK}" fill-opacity="0.6"/>` +
    lines.map((t, i) => `<text x="${(lx + 8).toFixed(1)}" y="${(ly + 3 + i * 9).toFixed(1)}" font-family="Archivo, Arial, sans-serif" font-size="6.5" letter-spacing="0.9" fill="${INK}" fill-opacity="0.6">${t}</text>`).join('');
}).join('');

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs><radialGradient id="fade" cx="${(PIN.x / W).toFixed(3)}" cy="${(PIN.y / H).toFixed(3)}" r="0.62"><stop offset="0.55" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></radialGradient>
<mask id="m"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
<linearGradient id="sea" x1="0" y1="0" x2="0.4" y2="1"><stop stop-color="white" stop-opacity="0.45"/><stop offset="1" stop-color="white" stop-opacity="0.1"/></linearGradient></defs>
<g mask="url(#m)">
<path d="${sea}" fill="url(#sea)"/>${islands.map(p => `<path d="${p}" fill="${INK}" fill-opacity="0.06"/>`).join('')}
<path d="${d(main)}" stroke="${INK}" stroke-opacity="0.35" stroke-width="0.6"/>
${buildings.map(b => `<path d="${b}" fill="${INK}" fill-opacity="0.1"/>`).join('')}
${roads.map(r => `<path d="${r.p}" stroke="${INK}" stroke-opacity="0.16" stroke-width="${(r.w * 0.7 + 0.8).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
${roads.map(r => `<path d="${r.p}" stroke="white" stroke-opacity="0.42" stroke-width="${(r.w * 0.7).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
${labels}
<text x="${W - 8}" y="${H - 8}" text-anchor="end" font-family="Archivo, Arial, sans-serif" font-size="6" fill="${INK}" fill-opacity="0.45">© OpenStreetMap contributors</text>
</g></svg>`;
const out = path.join(__dirname, '../../assets/svg/map-sales-office.svg');
fs.writeFileSync(out, svg);
console.log('map written', Math.round(svg.length / 1024) + 'KB', 'buildings', buildings.length, 'roads', roads.length, 'coast chains', chains.length);
