export default () => {
  const ink = 'var(--cds-text-primary)', quiet = 'var(--cds-text-secondary)', edge = 'var(--cds-chart-axis)', accent = 'var(--cds-chart-categorical-1)';
  const zig = (x0, y) => `M${x0} ${y}H${x0 + 4}l4 -7l8 14l8 -14l8 14l8 -14l8 14l4 -7H${x0 + 56}`;
  const coil = (x0, y) => `M${x0} ${y}H${x0 + 8}a6 6 0 0 1 12 0a6 6 0 0 1 12 0a6 6 0 0 1 12 0a6 6 0 0 1 12 0H${x0 + 64}`;
  return <svg viewBox='0 0 760 270' role='img' aria-label='המעגל הווירטואלי: RLC טורי שמוזן מזווית ההטיה' fontSize='13'>
    <text data-claude-text-id='title' x='736' y='30' direction='rtl' textAnchor='start' fontSize='15' fontWeight='600' fill={ink}>המעגל הווירטואלי: RLC טורי שמוזן מזווית ההטיה</text>
    <g data-claude-anchor='wires' fill='none' stroke={edge} strokeWidth='1.6'>
      <path d='M200 132V90H250'/><path d={zig(250, 90)}/><path d='M306 90H360'/><path d={coil(360, 90)}/>
      <path d='M424 90H486'/><path d='M486 76V104M494 76V104'/><path d='M494 90H600V200H200V168'/></g>
    <g data-claude-anchor='source'><circle cx='200' cy='150' r='18' fill='none' stroke={edge} strokeWidth='1.6'/>
      <text data-claude-text-id='src-plus' x='200' y='146' textAnchor='middle' fontSize='14' fill={ink}>+</text>
      <text data-claude-text-id='src-minus' x='200' y='163' textAnchor='middle' fontSize='14' fill={ink}>−</text>
      <text x='172' y='146' textAnchor='end' fill={ink}><tspan data-claude-text-id='vin-v'>v</tspan><tspan data-claude-text-id='vin-sub' fontSize='10.5' dy='4'>in</tspan><tspan data-claude-text-id='vin-t' dy='-4'>(t) = θ(t)</tspan></text>
      <text data-claude-text-id='src-note' x='172' y='170' direction='rtl' textAnchor='start' fontSize='12' fill={quiet}>זווית ההטיה, 1° ↔ 1 V</text></g>
    <g data-claude-anchor='r'>
      <text data-claude-text-id='r-plus' x='252' y='72' textAnchor='middle' fill={ink}>+</text>
      <text x='272' y='72' fill={ink}><tspan data-claude-text-id='vr-v'>v</tspan><tspan data-claude-text-id='vr-sub' fontSize='10.5' dy='4'>R</tspan></text>
      <text data-claude-text-id='r-minus' x='304' y='72' textAnchor='middle' fill={ink}>−</text>
      <text data-claude-text-id='r-name' x='278' y='118' textAnchor='middle' fill={ink}>R</text></g>
    <g data-claude-anchor='l'>
      <text data-claude-text-id='l-plus' x='364' y='72' textAnchor='middle' fill={ink}>+</text>
      <text x='386' y='72' fill={ink}><tspan data-claude-text-id='vl-v'>v</tspan><tspan data-claude-text-id='vl-sub' fontSize='10.5' dy='4'>L</tspan></text>
      <text data-claude-text-id='l-minus' x='420' y='72' textAnchor='middle' fill={ink}>−</text>
      <text data-claude-text-id='l-name' x='392' y='118' textAnchor='middle' fill={ink}>L</text></g>
    <g data-claude-anchor='c'>
      <text data-claude-text-id='c-plus' x='474' y='72' textAnchor='middle' fill={accent}>+</text>
      <text x='482' y='64' fill={accent} fontWeight='600'><tspan data-claude-text-id='vc-v'>v</tspan><tspan data-claude-text-id='vc-sub' fontSize='10.5' dy='4'>C</tspan></text>
      <text data-claude-text-id='c-minus' x='506' y='72' textAnchor='middle' fill={accent}>−</text>
      <text data-claude-text-id='c-name' x='490' y='122' textAnchor='middle' fill={ink}>C</text></g>
    <g data-claude-anchor='current'><polygon points='595,140 600,150 605,140' fill={ink}/>
      <text data-claude-text-id='i-label' x='612' y='150' fill={ink}>i(t)</text></g>
    <g data-claude-anchor='bubble-note'><path d='M520 66 C560 50 600 50 640 66' fill='none' stroke={accent} strokeWidth='1.25' strokeDasharray='4 4'/>
      <text data-claude-text-id='bubble' x='736' y='76' direction='rtl' textAnchor='start' fill={accent} fontWeight='600'>מיקום הבועה = v_C(t)</text></g>
    <text data-claude-text-id='kvl' x='400' y='232' textAnchor='middle' fill={ink}>KVL: v_R + v_L + v_C = v_in   ⇒   v_C″ + 2α v_C′ + ω₀² v_C = ω₀² v_in</text>
    <text data-claude-text-id='rc-note' x='400' y='256' direction='rtl' textAnchor='middle' fontSize='12.5' fill={quiet}>במעגל RC מחליפים את הסליל בקצר: τ v_C′ + v_C = v_in, τ = RC</text>
  </svg>;
};
