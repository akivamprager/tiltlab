// render.mjs: turn a widget module (JSX, export default () => <svg>) into
// (1) a static SVG file with real colours, for GitHub, and (2) the one-line code string for the doc.
import { transformSync } from 'esbuild';
import fs from 'fs';
const [,, src, outSvg, outCode] = process.argv;
const code = fs.readFileSync(src, 'utf8');
const TOK = {
  '--cds-text-primary': '#14181f', '--cds-text-secondary': '#5b6472', '--cds-chart-axis': '#3d4350',
  '--cds-chart-grid': '#d9dde3', '--cds-chart-reference-tint': '#f1f3f5',
  '--cds-chart-categorical-1': '#1f6feb', '--cds-chart-categorical-2': '#e8590c', '--cds-chart-categorical-3': '#2b8a3e',
  '--cds-chart-categorical-4': '#9c36b5', '--cds-chart-categorical-5': '#0c8599', '--cds-chart-categorical-6': '#c2255c',
  '--cds-chart-status-good': '#2b8a3e', '--cds-chart-status-warning': '#e67700', '--cds-chart-status-critical': '#c92a2a',
};
const kebab = k => ({ className: 'class' }[k] || (k.startsWith('data') ? k.replace(/[A-Z]/g, m => '-' + m.toLowerCase()) : k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function h(tag, props, ...kids) {
  const flat = kids.flat(Infinity).filter(k => k !== null && k !== false && k !== undefined);
  const attrs = Object.entries(props || {}).filter(([k]) => k !== 'key').map(([k, v]) => ` ${kebab(k)}="${esc(v)}"`).join('');
  const inner = flat.map(k => (typeof k === 'string' && k.startsWith('<') && k.endsWith('>') && k._svg) ? k : (k && k.__svg ? k.s : esc(k))).join('');
  const s = `<${tag}${attrs}>${inner}</${tag}>`;
  return { __svg: true, s, toString() { return s; } };
}
const js = transformSync(code, { loader: 'jsx', jsxFactory: 'h', format: 'cjs' }).code;
const mod = { exports: {} };
new Function('module', 'exports', 'h', js)(mod, mod.exports, h);
let svg = mod.exports.default().s;
svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, Segoe UI, Arial, sans-serif" style="background:#fff"');
svg = svg.replace(/var\((--cds-[a-z0-9-]+)\)/g, (m, t) => TOK[t] || m);
fs.writeFileSync(outSvg, svg);
fs.writeFileSync(outCode, code.replace(/\s*\n\s*/g, ' ').trim());
console.log('ok', outSvg, svg.length, 'bytes');
