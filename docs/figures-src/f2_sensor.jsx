export default () => {
  const ink = 'var(--cds-text-primary)', quiet = 'var(--cds-text-secondary)', grid = 'var(--cds-chart-grid)', tint = 'var(--cds-chart-reference-tint)';
  const pow = 'var(--cds-chart-categorical-2)', i2c = 'var(--cds-chart-categorical-5)', sda = 'var(--cds-chart-categorical-3)', bad = 'var(--cds-chart-status-critical)';
  const pin = (x, y, c) => <circle cx={x} cy={y} r='9' fill={c} stroke={c} strokeWidth='2'/>;
  const mpin = (y, c) => <rect x='464' y={y - 6} width='12' height='12' rx='2' fill={c} stroke={c}/>;
  return <svg viewBox='0 0 760 300' role='img' aria-label='חיבור מד־התאוצה: ארבעה כבלים' fontSize='13'>
    <text data-claude-text-id='title' x='736' y='28' direction='rtl' textAnchor='start' fontSize='15' fontWeight='600' fill={ink}>החיישן: ארבעה כבלים בלבד, הזנה מ־3.3V</text>
    <g data-claude-anchor='pi'><rect x='60' y='86' width='150' height='96' rx='8' fill={tint} stroke={grid}/>
      {pin(90, 112, 'none')}{pin(130, 112, 'none')}{pin(170, 112, ink)}{pin(90, 156, pow)}{pin(130, 156, sda)}{pin(170, 156, i2c)}
      <circle cx='90' cy='112' r='9' fill='none' stroke={bad} strokeWidth='2'/><circle cx='130' cy='112' r='9' fill='none' stroke={bad} strokeWidth='2'/>
      <text data-claude-text-id='pi-name' x='135' y='68' direction='rtl' textAnchor='middle' fontWeight='600' fill={ink}>Raspberry Pi · פינים 1 עד 6</text>
      <text data-claude-text-id='p2' x='90' y='100' textAnchor='middle' fontSize='11.5' fill={bad}>5V</text>
      <text data-claude-text-id='p4' x='130' y='100' textAnchor='middle' fontSize='11.5' fill={bad}>5V</text>
      <text data-claude-text-id='p6' x='170' y='100' textAnchor='middle' fontSize='11.5' fill={ink}>6</text>
      <text data-claude-text-id='p1' x='75' y='160' textAnchor='middle' fontSize='11.5' fill={ink}>1</text>
      <text data-claude-text-id='p3' x='115' y='160' textAnchor='middle' fontSize='11.5' fill={ink}>3</text>
      <text data-claude-text-id='p5' x='155' y='160' textAnchor='middle' fontSize='11.5' fill={ink}>5</text></g>
    <g data-claude-anchor='wires' fill='none' strokeWidth='3' strokeLinecap='round'>
      <path d='M90 165V214C90 236 300 244 380 150S430 86 464 86' stroke={pow}/>
      <path d='M170 112C280 112 360 108 464 108' stroke={ink}/>
      <path d='M170 165V196C250 196 380 180 420 140S440 130 464 130' stroke={i2c}/>
      <path d='M130 165V232C130 260 360 262 420 200S440 152 464 152' stroke={sda}/></g>
    <g data-claude-anchor='module'><rect x='470' y='60' width='240' height='208' rx='10' fill='none' stroke={ink} strokeWidth='1.5'/>
      {mpin(86, pow)}{mpin(108, ink)}{mpin(130, i2c)}{mpin(152, sda)}{mpin(174, grid)}{mpin(196, grid)}{mpin(218, grid)}{mpin(240, grid)}
      <text data-claude-text-id='m-vcc' x='486' y='90' fontWeight='600' fill={ink}>VCC</text>
      <text data-claude-text-id='m-gnd' x='486' y='112' fontWeight='600' fill={ink}>GND</text>
      <text data-claude-text-id='m-scl' x='486' y='134' fontWeight='600' fill={ink}>SCL</text>
      <text data-claude-text-id='m-sda' x='486' y='156' fontWeight='600' fill={ink}>SDA</text>
      <text data-claude-text-id='m-xda' x='486' y='178' fill={quiet}>XDA</text>
      <text data-claude-text-id='m-xcl' x='486' y='200' fill={quiet}>XCL</text>
      <text data-claude-text-id='m-ad0' x='486' y='222' fill={quiet}>AD0</text>
      <text data-claude-text-id='m-int' x='486' y='244' fill={quiet}>INT</text>
      <text data-claude-text-id='w-vcc' x='698' y='90' direction='rtl' textAnchor='start' fill={ink}>לפין 1 (3.3V)</text>
      <text data-claude-text-id='w-gnd' x='698' y='112' direction='rtl' textAnchor='start' fill={ink}>לפין 6 (אדמה)</text>
      <text data-claude-text-id='w-scl' x='698' y='134' direction='rtl' textAnchor='start' fill={ink}>לפין 5</text>
      <text data-claude-text-id='w-sda' x='698' y='156' direction='rtl' textAnchor='start' fill={ink}>לפין 3</text>
      <text data-claude-text-id='w-rest' x='698' y='211' direction='rtl' textAnchor='start' fill={quiet}>לא מחברים</text>
      <text data-claude-text-id='m-name' x='590' y='290' direction='rtl' textAnchor='middle' fill={quiet}>מד־תאוצה, למשל GY-521 (MPU6050)</text></g>
  </svg>;
};
