export default () => {
  const ink = 'var(--cds-text-primary)', quiet = 'var(--cds-text-secondary)', edge = 'var(--cds-chart-axis)', red = 'var(--cds-chart-status-critical)';
  const zig = (x0, y) => `M${x0} ${y}H${x0 + 4}l4 -7l8 14l8 -14l8 14l8 -14l8 14l4 -7H${x0 + 56}`;
  const zigV = (x, y0) => `M${x} ${y0}V${y0 + 4}l-7 4l14 8l-14 8l14 8l-14 8l14 8l-7 4V${y0 + 56}`;
  const gnd = (x, y) => `M${x} ${y}V${y + 8}M${x - 12} ${y + 8}H${x + 12}M${x - 8} ${y + 13}H${x + 8}M${x - 4} ${y + 18}H${x + 4}`;
  const src = (cx, cy) => <circle cx={cx} cy={cy} r='16' fill='none' stroke={edge} strokeWidth='1.6'/>;
  const diode = (x, y) => <g><polygon points={`${x - 10},${y - 9} ${x + 10},${y - 9} ${x},${y + 9}`} fill='none' stroke={edge} strokeWidth='1.6'/><path d={`M${x - 12} ${y + 9}H${x + 12}`} stroke={edge} strokeWidth='1.6'/></g>;
  return <svg viewBox='0 0 760 290' role='img' aria-label='DAC מסוג R-2R ושקול התבנין שלו' fontSize='13'>
    <text data-claude-text-id='title' x='736' y='30' direction='rtl' textAnchor='start' fontSize='15' fontWeight='600' fill={ink}>ממיר DAC מסוג R-2R: כל הסולם שקול למקור יחיד בטור עם R</text>
    <g data-claude-anchor='ladder-wires' fill='none' stroke={edge} strokeWidth='1.6'>
      <path d='M140 100H70V110'/><path d={zigV(70, 110)}/><path d={'M70 166V240' + gnd(70, 240)}/>
      <path d='M140 100H172'/><path d={zig(172, 100)}/><path d='M228 100H292'/><path d={zig(292, 100)}/><path d='M348 100H440V156'/>
      <path d={'M140 100V110'}/><path d={zigV(140, 110)}/><path d={'M140 166V184M140 216V240' + gnd(140, 240)}/>
      <path d={'M260 100V110'}/><path d={zigV(260, 110)}/><path d={'M260 166V184M260 216V240' + gnd(260, 240)}/>
      <path d={'M380 100V110'}/><path d={zigV(380, 110)}/><path d={'M380 166V184M380 216V240' + gnd(380, 240)}/>
      <path d={'M440 174V240' + gnd(440, 240)}/></g>
    <g data-claude-anchor='ladder-parts'>{src(140, 200)}{src(260, 200)}{src(380, 200)}{diode(440, 165)}
      <circle cx='140' cy='100' r='3.5' fill={ink}/><circle cx='260' cy='100' r='3.5' fill={ink}/><circle cx='380' cy='100' r='3.5' fill={ink}/>
      <text data-claude-text-id='s0-plus' x='140' y='196' textAnchor='middle' fontSize='12' fill={ink}>+</text><text data-claude-text-id='s0-minus' x='140' y='211' textAnchor='middle' fontSize='12' fill={ink}>−</text>
      <text data-claude-text-id='s1-plus' x='260' y='196' textAnchor='middle' fontSize='12' fill={ink}>+</text><text data-claude-text-id='s1-minus' x='260' y='211' textAnchor='middle' fontSize='12' fill={ink}>−</text>
      <text data-claude-text-id='s2-plus' x='380' y='196' textAnchor='middle' fontSize='12' fill={ink}>+</text><text data-claude-text-id='s2-minus' x='380' y='211' textAnchor='middle' fontSize='12' fill={ink}>−</text>
      <text data-claude-text-id='n0' x='140' y='88' textAnchor='middle' fill={ink}>N0</text>
      <text data-claude-text-id='n1' x='260' y='88' textAnchor='middle' fill={ink}>N1</text>
      <text data-claude-text-id='n2' x='380' y='88' textAnchor='middle' fill={ink}>N2</text>
      <text data-claude-text-id='r1' x='200' y='86' textAnchor='middle' fill={ink}>R</text>
      <text data-claude-text-id='r2' x='320' y='86' textAnchor='middle' fill={ink}>R</text>
      <text data-claude-text-id='term' x='58' y='142' textAnchor='end' fill={ink}>2R</text>
      <text data-claude-text-id='leg0' x='128' y='142' textAnchor='end' fill={ink}>2R</text>
      <text data-claude-text-id='leg1' x='248' y='142' textAnchor='end' fill={ink}>2R</text>
      <text data-claude-text-id='leg2' x='368' y='142' textAnchor='end' fill={ink}>2R</text>
      <text data-claude-text-id='b0' x='160' y='205' fill={ink}>b0·V</text>
      <text data-claude-text-id='b1' x='280' y='205' fill={ink}>b1·V</text>
      <text data-claude-text-id='b2' x='400' y='205' fill={ink}>b2·V</text>
      <text data-claude-text-id='led1' x='454' y='170' fill={red}>LED</text>
      <text data-claude-text-id='ladder-cap' x='250' y='282' direction='rtl' textAnchor='middle' fill={quiet}>סולם R-2R עם 3 ביטים (GPIO 16, 20, 21)</text></g>
    <text data-claude-text-id='equiv' x='510' y='176' textAnchor='middle' fontSize='22' fill={quiet}>⇔</text>
    <g data-claude-anchor='thevenin' >
      <path d={'M560 152V100H600'} fill='none' stroke={edge} strokeWidth='1.6'/><path d={zig(600, 100)} fill='none' stroke={edge} strokeWidth='1.6'/>
      <path d={'M656 100H710V156M710 174V240H560V188'} fill='none' stroke={edge} strokeWidth='1.6'/>
      <circle cx='560' cy='170' r='18' fill='none' stroke={edge} strokeWidth='1.6'/>{diode(710, 165)}
      <text data-claude-text-id='th-plus' x='560' y='166' textAnchor='middle' fontSize='14' fill={ink}>+</text>
      <text data-claude-text-id='th-minus' x='560' y='183' textAnchor='middle' fontSize='14' fill={ink}>−</text>
      <text data-claude-text-id='rth' x='628' y='86' textAnchor='middle' fill={ink}>R_th = R</text>
      <text data-claude-text-id='vth' x='586' y='212' fill={ink}>V_th = 3.3·D/8</text>
      <text data-claude-text-id='led2' x='724' y='170' fill={red}>LED</text>
      <text data-claude-text-id='th-cap' x='636' y='282' direction='rtl' textAnchor='middle' fill={quiet}>שקול תבנין, D = 4b2 + 2b1 + b0</text></g>
  </svg>;
};
