export default () => {
  const ink = 'var(--cds-text-primary)', quiet = 'var(--cds-text-secondary)', edge = 'var(--cds-chart-axis)', red = 'var(--cds-chart-status-critical)';
  const zig = (x0, y) => `M${x0} ${y}H${x0 + 4}l4 -7l8 14l8 -14l8 14l8 -14l8 14l4 -7H${x0 + 56}`;
  return <svg viewBox='0 0 760 264' role='img' aria-label='ענף נורה: פין GPIO כמקור מתח מעשי, נגד ונורה בטור' fontSize='13'>
    <defs><marker id='s1-arrow' viewBox='0 0 10 10' refX='9' refY='5' markerWidth='6' markerHeight='6' orient='auto-start-reverse'><path d='M0 0L10 5L0 10z' fill={red}/></marker></defs>
    <text data-claude-text-id='title' x='736' y='30' direction='rtl' textAnchor='start' fontSize='15' fontWeight='600' fill={ink}>ענף נורה אחד: פין GPIO כמקור מתח מעשי, נגד ונורה בטור</text>
    <g data-claude-anchor='thevenin-box'><rect x='36' y='56' width='214' height='170' rx='8' fill='none' stroke={quiet} strokeWidth='1.25' strokeDasharray='6 5'/>
      <text data-claude-text-id='box-label' x='143' y='250' direction='rtl' textAnchor='middle' fontSize='12.5' fill={quiet}>שקול תבנין של פין ה־GPIO</text></g>
    <g data-claude-anchor='wires' fill='none' stroke={edge} strokeWidth='1.6'>
      <path d='M110 127V90H170'/><path d={zig(170, 90)}/><path d='M226 90H330'/><path d={zig(330, 90)}/>
      <path d='M386 90H600V136'/><path d='M600 154V200H110V163'/>
      <path d='M350 200V210M338 210H362M342 215H358M346 220H354'/></g>
    <g data-claude-anchor='source'><circle cx='110' cy='145' r='18' fill='none' stroke={edge} strokeWidth='1.6'/>
      <text data-claude-text-id='src-plus' x='110' y='141' textAnchor='middle' fontSize='14' fill={ink}>+</text>
      <text data-claude-text-id='src-minus' x='110' y='158' textAnchor='middle' fontSize='14' fill={ink}>−</text>
      <text x='136' y='140' fill={ink}><tspan data-claude-text-id='vgpio-v'>V</tspan><tspan data-claude-text-id='vgpio-sub' fontSize='10.5' dy='4'>GPIO</tspan></text>
      <text data-claude-text-id='vgpio-val' x='136' y='160' fill={ink}>3.3 V</text></g>
    <g data-claude-anchor='rout'><text x='190' y='76' fill={ink}><tspan data-claude-text-id='rout-r'>R</tspan><tspan data-claude-text-id='rout-sub' fontSize='10.5' dy='4'>out</tspan></text>
      <text data-claude-text-id='rout-val' x='198' y='114' textAnchor='middle' fill={quiet}>≈ 25 Ω</text></g>
    <g data-claude-anchor='pin'><circle cx='286' cy='90' r='3.5' fill={ink}/>
      <text data-claude-text-id='pin-label' x='286' y='76' direction='rtl' textAnchor='middle' fill={ink}>פין GPIO</text></g>
    <g data-claude-anchor='resistor'>
      <text data-claude-text-id='r-plus' x='332' y='74' textAnchor='middle' fill={ink}>+</text>
      <text x='352' y='74' fill={ink}><tspan data-claude-text-id='vr-v'>v</tspan><tspan data-claude-text-id='vr-sub' fontSize='10.5' dy='4'>R</tspan></text>
      <text data-claude-text-id='r-minus' x='384' y='74' textAnchor='middle' fill={ink}>−</text>
      <text data-claude-text-id='r-val' x='358' y='116' textAnchor='middle' fill={ink}>R = 330 Ω</text></g>
    <g data-claude-anchor='current'><polygon points='462,85 472,90 462,95' fill={ink}/>
      <text x='440' y='78' fill={ink}><tspan data-claude-text-id='id-i'>i</tspan><tspan data-claude-text-id='id-sub' fontSize='10.5' dy='4'>D</tspan></text></g>
    <g data-claude-anchor='led'><polygon points='590,136 610,136 600,154' fill='none' stroke={edge} strokeWidth='1.6'/><path d='M588 154H612' stroke={edge} strokeWidth='1.6'/>
      <path d='M586 142L570 130M588 152L572 140' stroke={red} strokeWidth='1.25' markerEnd='url(#s1-arrow)'/>
      <text data-claude-text-id='d-plus' x='620' y='132' fill={ink}>+</text>
      <text x='620' y='150' fill={ink}><tspan data-claude-text-id='vd-v'>v</tspan><tspan data-claude-text-id='vd-sub' fontSize='10.5' dy='4'>D</tspan></text>
      <text data-claude-text-id='d-minus' x='620' y='170' fill={ink}>−</text>
      <text data-claude-text-id='led-label' x='580' y='184' direction='rtl' textAnchor='start' fill={ink}>נורת LED (דיודה)</text></g>
    <text data-claude-text-id='gnd' x='350' y='240' direction='rtl' textAnchor='middle' fill={quiet}>אדמה (GND)</text>
    <text data-claude-text-id='kvl' x='736' y='240' textAnchor='end' fill={ink}>KVL: V = i·(R_out + R) + v_D</text>
  </svg>;
};
