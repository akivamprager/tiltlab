export default () => {
  const ink = 'var(--cds-text-primary)', quiet = 'var(--cds-text-secondary)', grid = 'var(--cds-chart-grid)', tint = 'var(--cds-chart-reference-tint)';
  const pow = 'var(--cds-chart-categorical-2)', i2c = 'var(--cds-chart-categorical-5)', led = 'var(--cds-chart-categorical-1)', bad = 'var(--cds-chart-status-critical)', opt = 'var(--cds-chart-categorical-4)';
  const px = n => 60 + 34 * Math.floor((n - 1) / 2), py = n => (n % 2 === 0 ? 140 : 176);
  const kind = n => (n === 1 ? 'pow' : n === 3 || n === 5 ? 'i2c' : n === 6 || n === 14 ? 'gnd' : n === 11 || n === 13 || n === 15 || n === 16 || n === 18 ? 'led' : n === 2 || n === 4 ? 'bad' : n === 36 || n === 38 || n === 39 || n === 40 ? 'opt' : 'none');
  const fillOf = k => (k === 'pow' ? pow : k === 'i2c' ? i2c : k === 'gnd' ? ink : k === 'led' ? led : 'none');
  const strokeOf = k => (k === 'bad' ? bad : k === 'opt' ? opt : k === 'none' ? grid : fillOf(k));
  const pins = Array.from({ length: 40 }, (_, i) => i + 1);
  const dot = (x, y, c, dash) => <circle cx={x} cy={y} r='7' fill={dash ? 'none' : c} stroke={c} strokeWidth='2' strokeDasharray={dash ? '3 2' : 'none'}/>;
  return <svg viewBox='0 0 760 340' role='img' aria-label='מחבר 40 הפינים של ה־Pi והפינים שבשימוש' fontSize='12.5'>
    <text data-claude-text-id='title' x='736' y='28' direction='rtl' textAnchor='start' fontSize='15' fontWeight='600' fill={ink}>מחבר 40 הפינים: 10 פינים בשימוש, ועוד 4 ל־DAC האופציונלי</text>
    <g data-claude-anchor='header'><rect x='40' y='120' width='686' height='76' rx='6' fill={tint} stroke={grid}/>
      <rect x='48' y='164' width='24' height='24' rx='3' fill='none' stroke={ink} strokeWidth='1.25'/>
      {pins.map(n => <circle key={n} cx={px(n)} cy={py(n)} r='9' fill={fillOf(kind(n))} stroke={strokeOf(kind(n))} strokeWidth={kind(n) === 'none' ? 1.25 : 2.5} strokeDasharray={kind(n) === 'opt' ? '3 2' : 'none'} fillOpacity={kind(n) === 'gnd' ? 0.85 : 1}/>)}</g>
    <g data-claude-anchor='top-labels' fill={ink}>
      <text data-claude-text-id='p2' x='60' y='118' transform='rotate(-45 60 118)' fill={bad}>2 · 5V</text>
      <text data-claude-text-id='p4' x='94' y='118' transform='rotate(-45 94 118)' fill={bad}>4 · 5V</text>
      <text data-claude-text-id='p6' x='128' y='118' transform='rotate(-45 128 118)'>6 · GND</text>
      <text data-claude-text-id='p14' x='264' y='118' transform='rotate(-45 264 118)'>14 · GND</text>
      <text data-claude-text-id='p16' x='298' y='118' transform='rotate(-45 298 118)'>16 · GPIO23</text>
      <text data-claude-text-id='p18' x='332' y='118' transform='rotate(-45 332 118)'>18 · GPIO24</text>
      <text data-claude-text-id='p36' x='638' y='118' transform='rotate(-45 638 118)' fill={opt}>36 · GPIO16</text>
      <text data-claude-text-id='p38' x='672' y='118' transform='rotate(-45 672 118)' fill={opt}>38 · GPIO20</text>
      <text data-claude-text-id='p40' x='706' y='118' transform='rotate(-45 706 118)' fill={opt}>40 · GPIO21</text></g>
    <g data-claude-anchor='bottom-labels' fill={ink}>
      <text data-claude-text-id='p1' x='60' y='204' transform='rotate(45 60 204)'>1 · 3V3</text>
      <text data-claude-text-id='p3' x='94' y='204' transform='rotate(45 94 204)'>3 · SDA</text>
      <text data-claude-text-id='p5' x='128' y='204' transform='rotate(45 128 204)'>5 · SCL</text>
      <text data-claude-text-id='p11' x='230' y='204' transform='rotate(45 230 204)'>11 · GPIO17</text>
      <text data-claude-text-id='p13' x='264' y='204' transform='rotate(45 264 204)'>13 · GPIO27</text>
      <text data-claude-text-id='p15' x='298' y='204' transform='rotate(45 298 204)'>15 · GPIO22</text>
      <text data-claude-text-id='p39' x='706' y='204' transform='rotate(45 706 204)' fill={opt}>39 · GND</text></g>
    <g data-claude-anchor='legend'>
      {dot(722, 292, pow, false)}<text data-claude-text-id='lg-pow' x='708' y='296' direction='rtl' textAnchor='start' fill={ink}>3.3V לחיישן</text>
      {dot(612, 292, i2c, false)}<text data-claude-text-id='lg-i2c' x='598' y='296' direction='rtl' textAnchor='start' fill={ink}>I2C לחיישן</text>
      {dot(506, 292, led, false)}<text data-claude-text-id='lg-led' x='492' y='296' direction='rtl' textAnchor='start' fill={ink}>GPIO לנורות</text>
      {dot(392, 292, ink, false)}<text data-claude-text-id='lg-gnd' x='378' y='296' direction='rtl' textAnchor='start' fill={ink}>אדמה</text>
      {dot(312, 292, bad, true)}<text data-claude-text-id='lg-5v' x='298' y='296' direction='rtl' textAnchor='start' fill={bad}>5V – לא לחבר</text>
      {dot(196, 292, opt, true)}<text data-claude-text-id='lg-opt' x='182' y='296' direction='rtl' textAnchor='start' fill={ink}>DAC אופציונלי</text></g>
    <text data-claude-text-id='orient' x='736' y='326' direction='rtl' textAnchor='start' fontSize='12' fill={quiet}>מבט מלמעלה, המחבר בשפה העליונה של הלוח ושקעי ה־USB מימין. פין 1 מסומן בריבוע; השורה העליונה (זוגיים) צמודה לשפת הלוח.</text>
  </svg>;
};
