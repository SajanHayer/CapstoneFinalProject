import { useMemo } from "react";

type Point = { x: number; y: number };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function Sparkline({ values, height = 36 }: { values: number[]; height?: number }) {
  const w = Math.max(80, values.length * 18);

  const { path, area } = useMemo(() => {
    const v = values.length ? values : [0];
    const min = Math.min(...v);
    const max = Math.max(...v);
    const range = max - min || 1;

    const pts: Point[] = v.map((val, i) => {
      const x = (i / (v.length - 1 || 1)) * (w - 4) + 2;
      const y = (1 - (val - min) / range) * (height - 8) + 4;
      return { x, y };
    });

    const d = pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(" ");

    const a = `${d} L${(w - 2).toFixed(2)},${(height - 2).toFixed(2)} L2,${(height - 2).toFixed(2)} Z`;
    return { path: d, area: a };
  }, [values, w, height]);

  return (
    <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="spark" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.95" />
          <stop offset="1" stopColor="var(--accent2)" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--accent2)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--accent2)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkFill)" />
      <path d={path} fill="none" stroke="url(#spark)" strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  );
}

export function BarMiniChart({
  labels,
  values,
  height = 110,
}: {
  labels: string[];
  values: number[];
  height?: number;
}) {
  const max = Math.max(1, ...values);
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${values.length}, 1fr)`, gap: "8px", alignItems: "end" }}>
      {values.map((v, i) => {
        const h = clamp((v / max) * height, 8, height);
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <div
              title={`${labels[i]}: ${v}`}
              style={{
                width: "100%",
                height: `${h}px`,
                borderRadius: "12px",
                background: "linear-gradient(180deg, var(--accent), var(--accent2))",
                boxShadow: "0 10px 18px var(--ring)",
              }}
            />
            <div style={{ fontSize: "0.7rem", color: "var(--muted)", textAlign: "center", lineHeight: 1.1 }}>
              {labels[i]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
