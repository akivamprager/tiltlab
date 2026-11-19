export default () => {
  const ink = 'var(--cds-text-primary)', quiet = 'var(--cds-text-secondary)', edge = 'var(--cds-chart-axis)', red = 'var(--cds-chart-status-critical)';
  const zig = (x0, y) => `M${x0} ${y}H${x0 + 4}l4 -7l8 14l8 -14l8 14l8 -14l8 14l4 -7H${x0 + 56}`;
  const sub = (id, main, s) => [<tspan data-claude-text-id={id + '-m'}>{main}</tspan>, <tspan data-claude-text-id={id + '-s'} fontSize='10.5' dy='4'>{s}</tspan>];
  return <svg viewBox='0 0 760 290' role='img' aria-label='המעגל: סוללה, מתג הטיה, שני נגדים, קבל ונורה' fontSize='13'>
    <defs><marker id='rc-arrow' viewBox='0 0 10 10' refX='9' refY='5' markerWidth='6' markerHeight='6' orient='auto-start-reverse'><path d='M0 0L10 5L0 10z' fill={red}/></marker></defs>
    <text data-claude-text-id='title' x='736' y='30' direction='rtl' textAnchor='start' fontSize='15' fontWeight='600' fill={ink}>המעגל: סוללה, מתג, שני נגדים, קבל ונורה</text>
    <g data-claude-anchor='thevenin-box'><rect x='34' y='50' width='296' height='184' rx='8' fill='none' stroke={quiet} strokeWidth='1.25' strokeDasharray='6 5'/>
      <text data-claude-text-id='box-label' x='182' y='256' direction='rtl' textAnchor='middle' fontSize='12.5' fill={quiet}>צד הטעינה: מקור מתח מעשי (שקול תבנין)</text></g>
    <g data-claude-anchor='wires' fill='none' stroke={edge} strokeWidth='1.6'>
      <path d='M90 140V90H150'/><path d='M90 150V210H640V154'/>
      <path d='M200 90H240'/><path d={zig(240, 90)}/><path d='M296 90H470'/>
      <path d='M400 90V138'/><path d='M400 148V210'/>
      <path d={zig(470, 90)}/><path d='M526 90H640V136'/></g>
    <g data-claude-anchor='battery' stroke={edge} strokeWidth='1.6'>
      <path d='M72 140H108' strokeWidth='2'/><path d='M81 150H99' strokeWidth='3'/>
      <text data-claude-text-id='bat-plus' x='64' y='136' textAnchor='middle' fontSize='14' fill={ink} stroke='none'>+</text>
      <text x='116' y='142' fill={ink} stroke='none'>{sub('vb', 'V', 'B')}</text>
      <text data-claude-text-id='bat-val' x='116' y='162' fill={ink} stroke='none'>6 V (4×AA)</text></g>
    <g data-claude-anchor='switch'><circle cx='150' cy='90' r='3.5' fill={ink}/><circle cx='200' cy='90' r='3.5' fill={ink}/>
      <path d='M150 90L195 70' stroke={edge} strokeWidth='1.6'/>
      <text data-claude-text-id='sw-label' x='172' y='60' textAnchor='middle' fill={ink}>S</text>
      <text data-claude-text-id='sw-name' x='175' y='114' direction='rtl' textAnchor='middle' fill={quiet}>מתג הטיה</text></g>
    <g data-claude-anchor='r1'><text x='260' y='74' fill={ink}>{sub('r1', 'R', '1')}</text>
      <text data-claude-text-id='r1-val' x='268' y='114' textAnchor='middle' fill={quiet}>47 Ω</text></g>
    <g data-claude-anchor='capacitor'><path d='M382 138H418M382 148H418' stroke={edge} strokeWidth='2.2'/>
      <circle cx='400' cy='90' r='3.5' fill={ink}/>
      <text data-claude-text-id='c-val' x='400' y='230' textAnchor='middle' fill={ink}>C = 1000 µF</text>
      <text data-claude-text-id='c-plus' x='428' y='124' fill={ink}>+</text>
      <text x='428' y='147' fill={ink}>{sub('vc', 'v', 'C')}</text>
      <text data-claude-text-id='c-minus' x='428' y='174' fill={ink}>−</text></g>
    <g data-claude-anchor='r2'><text x='490' y='74' fill={ink}>{sub('r2', 'R', '2')}</text>
      <text data-claude-text-id='r2-val' x='498' y='114' textAnchor='middle' fill={quiet}>1 kΩ</text></g>
    <g data-claude-anchor='current'><polygon points='572,85 582,90 572,95' fill={ink}/>
      <text data-claude-text-id='i-label' x='560' y='78' fill={ink}>i(t)</text></g>
    <g data-claude-anchor='led'><polygon points='630,136 650,136 640,154' fill='none' stroke={edge} strokeWidth='1.6'/><path d='M628 154H652' stroke={edge} strokeWidth='1.6'/>
      <path d='M626 142L610 130M628 152L612 140' stroke={red} strokeWidth='1.25' markerEnd='url(#rc-arrow)'/>
      <text data-claude-text-id='d-plus' x='660' y='132' fill={ink}>+</text>
      <text x='660' y='150' fill={ink}>{sub('vf', 'V', 'f')}<tspan data-claude-text-id='vf-val' dx='5' dy='-4'>≈ 1.8 V</tspan></text>
      <text data-claude-text-id='d-minus' x='660' y='170' fill={ink}>−</text>
      <text data-claude-text-id='led-label' x='630' y='190' direction='rtl' textAnchor='start' fill={ink}>נורה אדומה</text></g>
    <text data-claude-text-id='tau' x='736' y='256' textAnchor='end' fill={ink}>τ = R₂·C = 1 kΩ · 1000 µF = 1 s</text>
  </svg>;
};
