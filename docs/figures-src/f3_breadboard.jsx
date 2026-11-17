export default () => {
  const ink = 'var(--cds-text-primary)', quiet = 'var(--cds-text-secondary)', grid = 'var(--cds-chart-grid)', tint = 'var(--cds-chart-reference-tint)';
  const wire = 'var(--cds-chart-categorical-1)', red = 'var(--cds-chart-status-critical)', accent = 'var(--cds-chart-categorical-1)';
  const cols = Array.from({ length: 29 }, (_, c) => 218 + 18 * c);
  const rowsY = [110, 128, 146, 164, 182, 218, 236, 254, 272, 290];
  const ledX = [254, 362, 470, 578, 686], pinY = [116, 156, 196, 236, 276];
  const badge = (x, y) => <circle cx={x} cy={y} r='10' fill={accent} fillOpacity='0.15' stroke={accent} strokeWidth='1.5'/>;
  return <svg viewBox='0 0 760 480' role='img' aria-label='המטריצה: 5 נורות, 5 נגדים ופס אדמה' fontSize='13'>
    <text data-claude-text-id='title' x='736' y='28' direction='rtl' textAnchor='start' fontSize='15' fontWeight='600' fill={ink}>המטריצה: לכל נורה כבל, נגד ונורה בעמודה משלה</text>
    <g data-claude-anchor='breakout'><rect x='24' y='86' width='152' height='296' rx='8' fill={tint} stroke={grid}/>
      <text data-claude-text-id='bo-name' x='100' y='74' direction='rtl' textAnchor='middle' fontWeight='600' fill={ink}>לוח הפריצה / פיני ה־Pi</text>
      {pinY.map(y => <rect key={y} x='164' y={y - 6} width='12' height='12' rx='2' fill={wire}/>)}<rect x='164' y='346' width='12' height='12' rx='2' fill={ink}/>
      <text data-claude-text-id='bo-17' x='156' y='120' textAnchor='end' fill={ink}>GPIO17 · 11</text>
      <text data-claude-text-id='bo-27' x='156' y='160' textAnchor='end' fill={ink}>GPIO27 · 13</text>
      <text data-claude-text-id='bo-22' x='156' y='200' textAnchor='end' fill={ink}>GPIO22 · 15</text>
      <text data-claude-text-id='bo-23' x='156' y='240' textAnchor='end' fill={ink}>GPIO23 · 16</text>
      <text data-claude-text-id='bo-24' x='156' y='280' textAnchor='end' fill={ink}>GPIO24 · 18</text>
      <text data-claude-text-id='bo-gnd' x='156' y='356' textAnchor='end' fill={ink}>GND · 14</text></g>
    <g data-claude-anchor='board'><rect x='200' y='86' width='540' height='296' rx='10' fill={tint} stroke={grid}/>
      <rect x='206' y='194' width='528' height='12' fill={grid}/>
      {cols.map(x => <g key={x}>{rowsY.map(y => <rect key={y} x={x - 3} y={y - 3} width='6' height='6' rx='1' fill={grid}/>)}<rect x={x - 3} y='349' width='6' height='6' rx='1' fill={grid}/></g>)}
      <path d='M210 336H730' stroke={ink} strokeWidth='1.5'/>
      <text data-claude-text-id='rail' x='730' y='374' direction='rtl' textAnchor='start' fontSize='12' fill={ink}>פס אדמה (−)</text>
      <text data-claude-text-id='channel' x='452' y='204' direction='rtl' textAnchor='start' fontSize='11' fill={quiet}>תעלה מרכזית</text></g>
    <g data-claude-anchor='wires' fill='none' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
      <path d='M176 116H180V76H254V110' stroke={wire}/>
      <path d='M176 156H184V69H362V110' stroke={wire}/>
      <path d='M176 196H188V62H470V110' stroke={wire}/>
      <path d='M176 236H192V55H578V110' stroke={wire}/>
      <path d='M176 276H196V48H686V110' stroke={wire}/>
      <path d='M176 352H218' stroke={ink}/></g>
    <g data-claude-anchor='resistors'>{ledX.map(x => <g key={x}><path d={`M${x} 146V254`} stroke={quiet} strokeWidth='1.5'/><rect x={x - 6} y='178' width='12' height='44' rx='5' fill={tint} stroke={ink} strokeWidth='1.25'/><path d={`M${x - 6} 188H${x + 6}M${x - 6} 196H${x + 6}M${x - 6} 204H${x + 6}`} stroke={ink} strokeWidth='2'/></g>)}
      <text data-claude-text-id='r-val' x='300' y='154' fontSize='12' fill={ink}>330 Ω</text></g>
    <g data-claude-anchor='leds'>{ledX.map(x => <g key={x}><path d={`M${x} 290L${x + 5} 310M${x + 13} 326L${x + 18} 352`} stroke={quiet} strokeWidth='1.5'/><circle cx={x + 9} cy='318' r='9' fill={red} fillOpacity='0.85'/></g>)}
      <text data-claude-text-id='led-plus' x='242' y='304' textAnchor='end' fontSize='12' fill={ink}>+</text>
      <text data-claude-text-id='led-minus' x='286' y='348' fontSize='12' fill={ink}>−</text></g>
    <g data-claude-anchor='badges'>{badge(236, 96)}{badge(286, 150)}{badge(304, 312)}{badge(196, 336)}
      <text data-claude-text-id='b1' x='236' y='100' textAnchor='middle' fontSize='12' fontWeight='600' fill={ink}>1</text>
      <text data-claude-text-id='b2' x='286' y='154' textAnchor='middle' fontSize='12' fontWeight='600' fill={ink}>2</text>
      <text data-claude-text-id='b3' x='304' y='316' textAnchor='middle' fontSize='12' fontWeight='600' fill={ink}>3</text>
      <text data-claude-text-id='b4' x='196' y='340' textAnchor='middle' fontSize='12' fontWeight='600' fill={ink}>4</text></g>
    <g data-claude-anchor='legend'>
      <text data-claude-text-id='l1' x='736' y='414' direction='rtl' textAnchor='start' fill={ink}>1 · כבל מכל פין GPIO לעמודה משלו בחצי העליון</text>
      <text data-claude-text-id='l2' x='360' y='414' direction='rtl' textAnchor='start' fill={ink}>2 · נגד 330 Ω מגשר על התעלה המרכזית</text>
      <text data-claude-text-id='l3' x='736' y='440' direction='rtl' textAnchor='start' fill={ink}>3 · רגל ארוכה (+) באותה עמודה בחצי התחתון, רגל קצרה (−) בפס האדמה</text>
      <text data-claude-text-id='l4' x='736' y='466' direction='rtl' textAnchor='start' fill={ink}>4 · כבל שחור מפס האדמה לפין GND</text>
      <text data-claude-text-id='l5' x='360' y='466' direction='rtl' textAnchor='start' fontSize='12' fill={quiet}>בכל עמודה, 5 החורים בכל חצי מחוברים ביניהם</text></g>
  </svg>;
};
