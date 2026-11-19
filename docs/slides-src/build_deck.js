// build_deck.js - builds docs/presentation.pptx, the 4-slide deck for the 4-minute talk (Hebrew, RTL).
//
//   NODE_PATH=<dir with pptxgenjs + sharp> APPLY_THEME=<pptx skill>/scripts/apply_theme.js \
//     node docs/slides-src/build_deck.js
//
// The numbers come from the same formulas as calc.py; keep them in step with README and
// docs/PRESENTATION.md. Speaker notes follow the script in docs/PRESENTATION.md.
const path = require('path');
const pptxgen = require('pptxgenjs');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'docs', 'presentation.pptx');

// ---- circuit numbers (calc.py defaults) ---------------------------------------------
const VB = 9.0, R1 = 47, R2 = 1000, Vf = 1.8, I_OFF = 0.5e-3;
const i0 = (VB - Vf) / (R1 + R2);                 // 6.88 mA
const tauOf = C => R2 * C;
const tOff = C => tauOf(C) * Math.log(i0 / I_OFF);
const fmt = (x, d = 1) => x.toFixed(d);

// ---- theme ---------------------------------------------------------------------------
const THEME = {
  name: 'RC Fade',
  headFontFace: 'Arial',
  bodyFontFace: 'Arial',
  colors: {
    dk1: '1B1F24', lt1: 'FFFFFF', dk2: '3D4350', lt2: 'F1F3F5',
    accent1: 'C92A2A', accent2: '495057', accent3: 'ADB5BD', accent4: 'E8590C',
    accent5: '2B8A3E', accent6: '868E96', hlink: '1F6FEB', folHlink: '9C36B5',
  },
};
const HEX = THEME.colors;

async function main() {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';                    // 10 x 5.625 in
  pres.rtlMode = true;
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  pres.title = 'נורה שנכבית לאט';
  const C = pres.SchemeColor;
  const RTL = { rtlMode: true, align: 'right', lang: 'he-IL' };
  // a mixed bold/plain paragraph keeps right-to-left only if every run carries it
  const rtlRuns = runs => runs.map(r => ({ text: r.text, options: { ...(r.options || {}), ...RTL } }));

  // ---- layouts ----
  pres.defineSlideMaster({
    title: 'TITLE_DARK',
    background: { color: C.text1 },
    objects: [
      { placeholder: { options: { name: 'title', type: 'title', x: 3.6, y: 1.35, w: 5.9, h: 1.1,
        fontSize: 44, bold: true, color: C.background1, valign: 'bottom', ...RTL }, text: '' } },
      { placeholder: { options: { name: 'body', type: 'body', x: 3.6, y: 2.55, w: 5.9, h: 0.9,
        fontSize: 20, color: C.accent3, valign: 'top', ...RTL }, text: '' } },
    ],
  });
  pres.defineSlideMaster({
    title: 'CONTENT',
    background: { color: C.background1 },
    margin: [0.4, 0.5, 0.5, 0.5],
    objects: [
      { placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.3, w: 9.0, h: 0.7,
        fontSize: 32, bold: true, color: C.text1, valign: 'middle', ...RTL }, text: '' } },
    ],
    slideNumber: { x: 0.4, y: 5.15, w: 0.5, h: 0.3, fontSize: 10, color: C.accent6 },
  });

  // the motif: a lit LED (red circle with a glow) and its fading copies
  const led = (slide, x, y, d, transparency, name) => slide.addShape(pres.shapes.OVAL, {
    x, y, w: d, h: d, fill: { color: C.accent1, transparency }, line: { type: 'none' },
    shadow: { type: 'outer', color: HEX.accent1, blur: d * 18, offset: 0, angle: 0, opacity: transparency < 50 ? 0.55 : 0 },
    objectName: name,
  });
  // an equation line, left-to-right; parts are strings or {sub: '...'} / {sup: '...'}
  const eq = (slide, parts, o) => slide.addText(parts.map(p => typeof p === 'string'
    ? { text: p, options: {} }
    : { text: p.sub || p.sup, options: p.sub ? { subscript: true } : { superscript: true } }), {
    isTextBox: true, fontFace: 'Cambria', fontSize: 17, color: C.text1, align: 'center', valign: 'middle',
    margin: 0, ...o,
  });

  // ---- slide 1: title ----
  pres.addSection({ title: 'פתיחה' });
  let s = pres.addSlide({ masterName: 'TITLE_DARK', sectionTitle: 'פתיחה' });
  s.addText('נורה שנכבית לאט', { placeholder: 'title' });
  s.addText('דעיכה במעגל RC מסדר ראשון', { placeholder: 'body' });
  led(s, 1.0, 1.45, 1.8, 0, 'LED lit');
  // the fade: brightness ~ i(t)/i0 = e^(-t/tau), tau = 1 s
  [0, 1, 2, 3].forEach((t, k) => {
    const x = 0.75 + k * 0.62;
    led(s, x, 4.0, 0.36, Math.round(100 * (1 - Math.exp(-t))), 'LED at t=' + t);
    s.addText(t + ' s', { isTextBox: true, x: x - 0.12, y: 4.42, w: 0.6, h: 0.3, fontSize: 11,
      color: C.accent3, align: 'center', margin: 0, objectName: 'fade label ' + t });
  });
  s.addText('אחרי שעוזבים את הלחצן, הנורה דועכת אקספוננציאלית עם τ = 1 s', { isTextBox: true, x: 3.6, y: 4.0, w: 5.9, h: 0.5,
    fontSize: 14, color: C.accent3, valign: 'middle', ...RTL, objectName: 'fade caption' });
  s.addNotes('0:00–0:20. לוחצים על הלחצן, ואז עוזבים. "כשלוחצים, הנורה נדלקת. כשעוזבים, היא לא נכבית מיד אלא דועכת. נראה למה, ונחזה כמה זמן זה לוקח."');

  // ---- slide 2: the circuit ----
  pres.addSection({ title: 'המעגל' });
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'המעגל' });
  s.addText('המעגל', { placeholder: 'title' });
  const svg = path.join(ROOT, 'docs', 'img', 'rc_circuit.svg');
  const meta = await sharp(svg, { density: 288 }).metadata();
  const top = Math.round(meta.height * 0.15);       // drop the figure's own title line
  const png = await sharp(svg, { density: 288 }).extract({ left: 0, top, width: meta.width, height: meta.height - top }).png().toBuffer();
  const ratio = meta.width / (meta.height - top);
  const imgW = 8.4;
  s.addImage({ data: 'image/png;base64,' + png.toString('base64'), x: 0.8, y: 1.1, w: imgW, h: imgW / ratio,
    altText: 'שרטוט המעגל: סוללה 9 וולט, לחצן, R1 = 47 אוהם, קבל 1000 מיקרופרד, R2 = 1 קילו־אוהם ונורה אדומה', objectName: 'schematic' });
  const cards = [
    [{ text: 'לוחצים: ', options: { bold: true } }, { text: 'הקבל נטען, והנורה דולקת בעוצמה קבועה' }],
    [{ text: 'עוזבים: ', options: { bold: true } }, { text: 'הקבל מתפרק דרך R2 והנורה, והיא דועכת' }],
    [{ text: 'הנורה (תרגול 3): ', options: { bold: true } }, { text: 'מקור מתח קבוע, בערך 1.8 V' }],
  ];
  cards.forEach((runs, k) => {
    const w = 2.8, h = 0.9, x = 6.7 - k * 3.1, y = 4.1;      // first card on the right (RTL)
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: C.background2 },
      line: { type: 'none' }, objectName: 'card ' + (k + 1) });
    led(s, x + w - 0.36, y + 0.34, 0.22, 0, 'card dot ' + (k + 1));
    s.addText(rtlRuns(runs), { isTextBox: true, x: x + 0.15, y: y + 0.08, w: w - 0.6, h: h - 0.16, fontSize: 14,
      color: C.text1, valign: 'middle', margin: 0, ...RTL, objectName: 'card text ' + (k + 1) });
  });
  s.addNotes('0:20–0:50. "המעגל: סוללה, לחצן, שני נגדים, קבל ונורה. את הנורה מחליפים במקור מתח קבוע של 1.8 וולט, המודל הליניארי למקוטעין מתרגול 3."');

  // ---- slide 3: charge fast, discharge slow ----
  pres.addSection({ title: 'הסבר' });
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'הסבר' });
  s.addText('טעינה מהירה, פריקה איטית', { placeholder: 'title' });
  const col = (x, title, lit, rows, callout, tag) => {
    const y = 1.15, w = 4.35, h = 3.85;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1, fill: { color: C.background2 },
      line: { type: 'none' }, objectName: tag + ' card' });
    led(s, x + w - 0.55, y + 0.22, 0.32, lit ? 0 : 85, tag + ' LED');
    s.addText(title, { isTextBox: true, x: x + 0.2, y: y + 0.15, w: w - 0.85, h: 0.46, fontSize: 20, bold: true,
      color: C.text1, valign: 'middle', margin: 0, ...RTL, objectName: tag + ' header' });
    let yy = y + 0.75;
    rows.forEach((r, k) => {
      if (typeof r === 'string') {
        s.addText(r, { isTextBox: true, x: x + 0.2, y: yy, w: w - 0.4, h: 0.34, fontSize: 14, color: C.text2,
          valign: 'middle', margin: 0, ...RTL, objectName: tag + ' text ' + k });
        yy += 0.38;
      } else {
        eq(s, r, { x: x + 0.2, y: yy, w: w - 0.4, h: 0.44, objectName: tag + ' equation ' + k });
        yy += 0.5;
      }
    });
    eq(s, callout, { x: x + 0.2, y: y + h - 0.72, w: w - 0.4, h: 0.55, fontSize: 26, bold: true, color: C.accent1,
      objectName: tag + ' tau' });
  };
  col(5.15, 'לחצן לחוץ: טעינה', true, [
    'במצב יציב אין זרם לקבל, אז לפי KVL:',
    ['i = (V', { sub: 'B' }, ' − V', { sub: 'f' }, ') / (R', { sub: '1' }, ' + R', { sub: '2' }, ') ≈ ' + fmt(i0 * 1e3) + ' mA'],
    ['v', { sub: '0' }, ' = V', { sub: 'f' }, ' + i·R', { sub: '2' }, ' ≈ ' + fmt(Vf + i0 * R2) + ' V'],
    'הקבל רואה שקול תבנין (תרגול 2):',
    ['R', { sub: 'th' }, ' = R', { sub: '1' }, ' ∥ R', { sub: '2' }, ' ≈ ' + Math.round(R1 * R2 / (R1 + R2)) + ' Ω'],
  ], ['τ ≈ ' + Math.round(R1 * R2 / (R1 + R2) * 1000e-6 * 1000) + ' ms'], 'charge');
  col(0.5, 'לחצן משוחרר: פריקה', false, [
    'KCL בצומת של הקבל (תרגול 4):',
    ['C·dv', { sub: 'C' }, '/dt = −(v', { sub: 'C' }, ' − V', { sub: 'f' }, ') / R', { sub: '2' }],
    'הפתרון שואף ל־Vf ולא לאפס:',
    ['v', { sub: 'C' }, '(t) − V', { sub: 'f' }, ' = (v', { sub: '0' }, ' − V', { sub: 'f' }, ')·e', { sup: '−t/τ' }],
  ], ['τ = R', { sub: '2' }, 'C = ' + fmt(tauOf(1000e-6), 0) + ' s'], 'discharge');
  s.addNotes('0:50–1:30, לחצן לחוץ: "הסוללה עם R1 היא מקור מתח מעשי. במצב יציב אין זרם לקבל, אז לפי KVL יש 7 מיליאמפר בנורה, והקבל טעון ל־8.7 וולט. הקבל רואה שקול תבנין עם R1 מקביל ל־R2, בערך 45 אוהם, אז הוא נטען בפחות מרבע שנייה."\n\n1:30–2:20, לחצן משוחרר: "הקבל מתפרק דרך R2 והנורה. KCL בצומת נותן משוואה מסדר ראשון, והפתרון הוא אקספוננט עם טאו שווה R2 כפול C, שנייה אחת. המתח לא שואף לאפס אלא ל־1.8 וולט."');

  // ---- slide 4: prediction vs measurement ----
  pres.addSection({ title: 'הדגמה' });
  s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'הדגמה' });
  s.addText('חיזוי מול מדידה', { placeholder: 'title' });
  const ts = Array.from({ length: 25 }, (_, k) => k * 0.25);
  const curve = Cf => ts.map(t => +(i0 * 1e3 * Math.exp(-t / tauOf(Cf))).toFixed(3));
  s.addChart(pres.charts.LINE, [
    { name: 'C = 1000 µF', labels: ts.map(t => (Number.isInteger(t) ? String(t) : '')), values: curve(1000e-6) },
    { name: 'C = 2200 µF', labels: ts.map(t => (Number.isInteger(t) ? String(t) : '')), values: curve(2200e-6) },
    { name: 'נראית כבויה (0.5 mA)', labels: ts.map(String), values: ts.map(() => I_OFF * 1e3) },
  ], {
    x: 0.4, y: 1.1, w: 4.9, h: 3.9, objectName: 'current chart',
    chartColors: [HEX.accent1, HEX.dk2, HEX.accent3], lineSize: 2.5, lineDataSymbol: 'none',
    showTitle: true, title: 'זרם הנורה i(t) [mA]', titleFontSize: 13, titleColor: HEX.dk1, titleFontFace: '+mn-lt',
    showLegend: true, legendPos: 'b', legendFontSize: 11, legendFontFace: '+mn-lt', legendColor: HEX.dk2,
    catAxisTitle: 't [s]', showCatAxisTitle: true, catAxisTitleFontSize: 11, catAxisTitleColor: HEX.dk2,
    catAxisLabelColor: HEX.dk2, catAxisLabelFontSize: 11, catAxisLabelFontFace: '+mn-lt',
    valAxisLabelColor: HEX.dk2, valAxisLabelFontSize: 11, valAxisLabelFontFace: '+mn-lt', valAxisMinVal: 0, valAxisMaxVal: Math.ceil(i0 * 1e3),
    valAxisLabelFormatCode: '0', valGridLine: { color: 'DEE2E6', size: 0.75 }, catGridLine: { style: 'none' },
  });
  const head = { bold: true, color: HEX.lt1, fill: { color: HEX.dk1 }, align: 'center', fontSize: 14 };
  const cell = { color: HEX.dk1, align: 'center', fontSize: 16 };
  const big = { ...cell, bold: true, color: HEX.accent1 };
  // columns run right-to-left: C | tau | prediction | measured
  s.addTable([
    [{ text: 'נמדד', options: head }, { text: 'חיזוי', options: head }, { text: 'τ', options: head }, { text: 'C', options: head }],
    [{ text: '___ s', options: cell }, { text: fmt(tOff(1000e-6)) + ' s', options: big }, { text: fmt(tauOf(1000e-6), 0) + ' s', options: cell }, { text: '1000 µF', options: cell }],
    [{ text: '___ s', options: cell }, { text: fmt(tOff(2200e-6)) + ' s', options: big }, { text: fmt(tauOf(2200e-6)) + ' s', options: cell }, { text: '2200 µF', options: cell }],
  ], { x: 5.6, y: 1.2, w: 3.9, colW: [0.95, 0.95, 0.8, 1.2], rowH: 0.48, border: { type: 'solid', pt: 0.75, color: 'DEE2E6' },
    fontFace: 'Arial', valign: 'middle', objectName: 'prediction table' });
  const notes = [
    [{ text: 't', options: {} }, { text: 'off', options: { subscript: true } }, { text: ' = τ·ln(i₀ / 0.5 mA) = τ·ln ' + Math.round(i0 / I_OFF), options: {} }],
    [{ text: 'היחס בין הקבלים: פי 2.2, ', options: { bold: true } }, { text: 'בלי קשר להגדרה של "כבויה"' }],
    [{ text: 'מגבלת המודל: ', options: { bold: true } }, { text: 'בזרם נמוך המתח על הנורה יורד, והדעיכה ארוכה מעט יותר' }],
  ];
  notes.forEach((runs, k) => {
    const y = 2.8 + k * 0.75;
    led(s, 9.27, y + 0.26, 0.18, 0, 'note dot ' + (k + 1));
    s.addText(k === 0 ? runs : rtlRuns(runs), { isTextBox: true, x: 5.55, y, w: 3.55, h: 0.7, fontSize: 14,
      color: C.text1, valign: 'middle', margin: 0, ...(k === 0 ? { align: 'right', fontFace: 'Cambria' } : RTL),
      objectName: 'note ' + (k + 1) });
  });
  s.addNotes('2:20–2:40: "הנורה נראית כבויה בערך בחצי מיליאמפר. טאו כפול לן 14 נותן 2.6 שניות."\n\n2:40–3:05, הדגמה 1: לוחצים, עוזבים, ומפעילים את הסטופר ברגע העזיבה. "יצא ___ שניות."\n\n3:05–3:35, הדגמה 2: מחליפים לקבל של 2200 מיקרופרד, לוחצים, עוזבים, מודדים. "החיזוי היה פי 2.2, יצא ___."\n\n3:35–3:45, סיכום: "מעגל מסדר ראשון: טאו שווה RC קובע את הזמן, והוא מתאים למדידה. הסטייה הקטנה היא כי המתח על הנורה יורד קצת בזרם נמוך."');

  await pres.writeFile({ fileName: OUT });
  const { applyTheme } = require(process.env.APPLY_THEME);
  await applyTheme(OUT, THEME);
  console.log('wrote', OUT);
}

main().catch(e => { console.error(e); process.exit(1); });
