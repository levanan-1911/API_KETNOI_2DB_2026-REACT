/**
 * Logo component – HR monogram SVG
 * Props:
 *   size    : number  – chiều rộng/cao (default 40)
 *   color   : string  – màu nét vẽ (default "#2563eb")
 *   bg      : string  – màu nền (default "transparent")
 *   rounded : bool    – bo góc nền (default false)
 *   className / style : pass-through
 */
export default function Logo({
  size    = 40,
  color   = "#2563eb",
  bg      = "transparent",
  rounded = false,
  className,
  style,
}) {
  const pad    = size * 0.12;
  const inner  = size - pad * 2;
  const stroke = Math.max(2, size * 0.075);
  const r      = rounded ? size * 0.22 : 0;

  /* ── Toạ độ tương đối (0-1) → scale theo inner ── */
  const s = (v) => pad + v * inner;

  // H: left vertical x=0.28, right/R vertical x=0.50
  // H crossbar y=0.50
  // R arc: từ x=0.50,y=0.21 → bán kính → x=0.50,y=0.50
  // R leg: từ x=0.50,y=0.50 → x=0.74,y=0.79

  const lx  = s(0.28);   // H left vertical x
  const rx  = s(0.50);   // H right / R stem x
  const top = s(0.21);   // top y
  const bot = s(0.79);   // bottom y
  const mid = s(0.50);   // crossbar y
  const arc = s(0.74);   // R arc right edge x
  const leg = s(0.74);   // R leg end x

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* Background */}
      {bg !== "transparent" && (
        <rect width={size} height={size} rx={r} ry={r} fill={bg} />
      )}

      {/* H – left vertical */}
      <line x1={lx} y1={top} x2={lx} y2={bot}
        stroke={color} strokeWidth={stroke} strokeLinecap="round" />

      {/* H / R – shared vertical stem */}
      <line x1={rx} y1={top} x2={rx} y2={bot}
        stroke={color} strokeWidth={stroke} strokeLinecap="round" />

      {/* H – crossbar */}
      <line x1={lx} y1={mid} x2={rx} y2={mid}
        stroke={color} strokeWidth={stroke} strokeLinecap="round" />

      {/* R – top arc (from stem top → arc right → stem mid) */}
      <path
        d={`M ${rx} ${top} Q ${arc} ${top} ${arc} ${s(0.355)} Q ${arc} ${mid} ${rx} ${mid}`}
        stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none"
      />

      {/* R – diagonal leg */}
      <line x1={rx} y1={mid} x2={leg} y2={bot}
        stroke={color} strokeWidth={stroke} strokeLinecap="round" />
    </svg>
  );
}
