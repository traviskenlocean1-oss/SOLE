// Draws SOLE's 25 floor plans (assets/plans/unit-NNN.svg) in the style of ERA's plan drawings:
// heavy ink walls, light tiled floors, plank-wood terraces, simple furniture, room labels with areas.
// Units come from tools/units.json (built from ERA's apartment list, converted to sq ft).
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '../../assets/plans');
fs.mkdirSync(OUT, { recursive: true });

const INK = '#1c2620', TILE = '#e4e1da', GRID = '#d2cec5', WOOD = '#ecd5bb', PLANK = '#dcbd9d', GARDEN = '#cfdcc4';
const FONT = 'Archivo, Arial, sans-serif';

// Layout units are on a 100x100 grid per level block; rooms: [kind, label, x, y, w, h]
const LAYOUTS = {
  garden: [
    { caption: 'GROUND FLOOR', y: 0, rooms: [
      ['terrace', 'Terrace', 0, 0, 40, 44], ['living', 'Living / kitchen', 40, 0, 38, 26], ['bed', 'Bedroom 1', 78, 0, 22, 26],
      ['bath', 'Bath 1', 78, 26, 22, 14], ['bed', 'Bedroom 2', 40, 26, 24, 18], ['hall', 'Entry', 64, 26, 14, 18] ] },
    { caption: 'LOWER LEVEL', y: 52, rooms: [
      ['garden', 'Garden', 0, 0, 30, 36], ['family', 'Family room', 30, 0, 36, 24], ['bed', 'Bedroom 3', 66, 0, 34, 24],
      ['bath', 'Bath 2', 66, 24, 18, 12], ['hall', 'Laundry', 84, 24, 16, 12], ['hall', 'Storage', 30, 24, 36, 12] ] },
  ],
  ground: [
    { caption: 'GROUND FLOOR', y: 18, rooms: [
      ['terrace', 'Terrace', 0, 0, 34, 62], ['living', 'Living / kitchen', 34, 0, 40, 34], ['bed', 'Primary bedroom', 74, 0, 26, 34],
      ['bed', 'Bedroom 2', 34, 34, 26, 28], ['bath', 'Bath', 60, 34, 20, 16], ['hall', 'Entry', 60, 50, 20, 12], ['bath', 'Bath 2', 80, 34, 20, 28] ] },
  ],
  penthouse: [
    { caption: 'MAIN FLOOR', y: 0, rooms: [
      ['living', 'Living / kitchen', 0, 0, 46, 30], ['bed', 'Primary bedroom', 46, 0, 30, 30], ['bath', 'Bath 1', 76, 0, 24, 16],
      ['hall', 'Entry', 76, 16, 24, 14], ['bed', 'Bedroom 2', 0, 30, 40, 16], ['bath', 'Bath 2', 40, 30, 20, 16], ['hall', 'Stair', 60, 30, 40, 16] ] },
    { caption: 'ROOFTOP TERRACE', y: 54, rooms: [
      ['terrace', 'Rooftop terrace', 0, 0, 70, 40], ['hall', 'Stair', 70, 0, 30, 18], ['pool', 'Plunge pool', 70, 18, 30, 22] ] },
  ],
};
LAYOUTS.penthouse3 = JSON.parse(JSON.stringify(LAYOUTS.penthouse));
LAYOUTS.penthouse3[0].rooms[6] = ['bed', 'Bedroom 3', 60, 30, 40, 16];

const S = 9, OX = 50, OY = 40; // 100 grid units -> 900 px inside a 1000 viewBox
const esc = s => s.replace(/&/g, '&amp;');

function furniture(kind, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2 + 22, f = [];
  const r = (a, b, c, d, extra = '') => f.push(`<rect x="${a.toFixed(1)}" y="${b.toFixed(1)}" width="${c.toFixed(1)}" height="${d.toFixed(1)}" fill="none" stroke="${INK}" stroke-width="2" rx="3" ${extra}/>`);
  if (kind === 'bed') { const bw = Math.min(w * .55, 140), bh = Math.min(h - 78, 170); r(cx - bw / 2, cy - bh / 2, bw, bh); r(cx - bw / 2 + 8, cy - bh / 2 + 8, bw / 2 - 12, 26); r(cx + 4, cy - bh / 2 + 8, bw / 2 - 12, 26); }
  if (kind === 'living' || kind === 'family') {
    const tw = Math.min(w * .32, 150), th = Math.min(h * .26, 70); r(x + w * .12, cy - th / 2, tw, th);
    for (let i = 0; i < 3; i++) { r(x + w * .12 + 10 + i * (tw - 20) / 2.5, cy - th / 2 - 26, 22, 18); r(x + w * .12 + 10 + i * (tw - 20) / 2.5, cy + th / 2 + 8, 22, 18); }
    r(x + w * .6, y + 54, w * .3, 34); r(x + w * .6, y + 94, 34, Math.max(30, h - 150));
    if (kind === 'living') f.push(`<rect x="${(x + 14).toFixed(1)}" y="${(y + h - 36).toFixed(1)}" width="${(w * .4).toFixed(1)}" height="22" fill="${INK}" fill-opacity=".08" stroke="${INK}" stroke-width="2"/>`);
  }
  if (kind === 'bath') { r(x + 12, y + h - 46, Math.min(w * .5, 90), 34); f.push(`<circle cx="${(x + w - 34).toFixed(1)}" cy="${(y + h - 30).toFixed(1)}" r="14" fill="none" stroke="${INK}" stroke-width="2"/>`); }
  if (kind === 'pool') f.push(`<rect x="${(x + 18).toFixed(1)}" y="${(y + 18).toFixed(1)}" width="${(w - 36).toFixed(1)}" height="${(h - 36).toFixed(1)}" fill="#bcd7ec" stroke="${INK}" stroke-width="2.5" rx="4"/>`);
  if (kind === 'terrace') { r(x + w * .18, y + h * .55, 46, 110); r(x + w * .18 + 56, y + h * .55, 46, 110); }
  if (kind === 'garden') for (let i = 0; i < 4; i++) f.push(`<circle cx="${(x + w * (.22 + .2 * i)).toFixed(1)}" cy="${(y + h * (.3 + .15 * (i % 2))).toFixed(1)}" r="${16 + 4 * (i % 2)}" fill="#a9c19c" fill-opacity=".7" stroke="${INK}" stroke-opacity=".35"/>`);
  return f.join('');
}

function draw(unit) {
  const levels = LAYOUTS[unit.layout];
  const mirror = unit.mirror;
  const interior = levels.flatMap(l => l.rooms).filter(r => !['terrace', 'garden', 'pool'].includes(r[0]));
  const outside = levels.flatMap(l => l.rooms).filter(r => ['terrace', 'garden', 'pool'].includes(r[0]));
  const inArea = interior.reduce((s, r) => s + r[4] * r[5], 0), outArea = outside.reduce((s, r) => s + r[4] * r[5], 0);
  let body = '';
  for (const lv of levels) {
    const yb = OY + lv.y * S;
    const rect = ([kind, label, gx, gy, gw, gh]) => {
      const gxM = mirror ? 100 - gx - gw : gx;
      return [kind, label, OX + gxM * S, yb + gy * S, gw * S, gh * S, gw * gh];
    };
    const rooms = lv.rooms.map(rect);
    // floors
    for (const [kind, , x, y, w, h] of rooms) {
      const fill = kind === 'terrace' ? 'url(#plank)' : kind === 'garden' ? GARDEN : kind === 'pool' ? WOOD : 'url(#tile)';
      body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
    }
    // walls: interior rooms get heavy walls, outdoor spaces a light rail
    for (const [kind, , x, y, w, h] of rooms) {
      const outdoor = ['terrace', 'garden', 'pool'].includes(kind);
      body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-width="${outdoor ? 2 : 9}" stroke-opacity="${outdoor ? .55 : 1}"/>`;
    }
    // window breaks on the outer edge of each interior room (white gaps in the heavy wall)
    for (const [kind, , x, y, w, h] of rooms) {
      if (['terrace', 'garden', 'pool', 'hall'].includes(kind)) continue;
      body += `<rect x="${(x + w * .3).toFixed(1)}" y="${(y - 3).toFixed(1)}" width="${(w * .4).toFixed(1)}" height="6" fill="${TILE}" stroke="${INK}" stroke-width="1"/>`;
    }
    for (const [kind, label, x, y, w, h, ga] of rooms) {
      body += furniture(kind, x, y, w, h);
      const outdoor = ['terrace', 'garden', 'pool'].includes(kind);
      const sq = Math.round((outdoor ? unit.terraceSqft * ga / outArea : unit.sqft * ga / inArea));
      const lx = x + w / 2, ly = y + (kind === 'hall' ? h / 2 - 4 : 30);
      body += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" font-family="${FONT}" font-size="15" fill="${INK}">${esc(label)}</text>`;
      body += `<text x="${lx.toFixed(1)}" y="${(ly + 17).toFixed(1)}" text-anchor="middle" font-family="${FONT}" font-size="13" fill="${INK}" fill-opacity=".7">${sq.toLocaleString('en-US')} sq ft</text>`;
    }
    const capY = yb + Math.max(...lv.rooms.map(r => r[3] + r[5])) * S + 34;
    body += `<text x="${OX}" y="${capY}" font-family="${FONT}" font-size="17" font-weight="600" fill="${INK}" letter-spacing="1">${lv.caption}</text>`;
  }
  return `<svg width="2350" height="2350" viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs>
<pattern id="tile" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="${TILE}"/><path d="M24 0H0V24" fill="none" stroke="${GRID}" stroke-width="1"/></pattern>
<pattern id="plank" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="${WOOD}"/><path d="M0 13.5H14" fill="none" stroke="${PLANK}" stroke-width="1.2"/></pattern>
</defs>${body}</svg>`;
}

const units = JSON.parse(fs.readFileSync(path.join(__dirname, '../units.json'), 'utf8'));
for (const u of units) fs.writeFileSync(path.join(OUT, `unit-${u.no}.svg`), draw(u));
console.log('plans written:', units.length);
