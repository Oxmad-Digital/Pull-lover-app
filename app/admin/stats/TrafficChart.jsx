"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import styles from "./stats.module.css";

const VIEWS_COLOR = "#C75C5C";
const VISITORS_COLOR = "#243B3B";
const MUTED = "#706666";
const font = "var(--pl-sans)";

const formatDay = (day, options) => new Date(`${day}T00:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "UTC", ...options });

/** Point et valeur affichés uniquement au bout de la courbe (dernier jour). */
function EndDot({ cx, cy, index, value, color, last }) {
  if (index !== last || cx == null || cy == null) return <g />;
  return (
    <g>
      <circle cx={cx} cy={cy} r={4} fill={color} stroke="#fff" strokeWidth={2} />
      <text x={cx + 9} y={cy} dominantBaseline="middle" fontSize={11} fill={color} fontFamily={font} fontWeight={600}>
        {value.toLocaleString("fr-FR")}
      </text>
    </g>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipDate}>{formatDay(point.day, { weekday: "short", day: "2-digit", month: "long" })}</div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipKey} style={{ background: "#E8A9A9" }} />
        <strong>{point.views.toLocaleString("fr-FR")}</strong> vues
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipKey} style={{ background: "#fff" }} />
        <strong>{point.visitors.toLocaleString("fr-FR")}</strong> visiteurs
      </div>
    </div>
  );
}

export default function TrafficChart({ daily }) {
  const last = daily.length - 1;
  // Les valeurs finales se chevauchent si les deux courbes finissent trop près : on n'en garde qu'une
  const endValuesClose = Math.abs(daily[last].views - daily[last].visitors) <= Math.max(1, daily[last].views * 0.06);

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={daily} margin={{ top: 12, right: 44, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="rgba(36, 59, 59, 0.09)" vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={(day) => formatDay(day, { day: "2-digit", month: "2-digit" })}
            fontSize={10}
            tick={{ fill: MUTED, fontFamily: font }}
            tickLine={false}
            axisLine={false}
            minTickGap={28}
            tickMargin={10}
          />
          <YAxis allowDecimals={false} fontSize={10} tick={{ fill: MUTED, fontFamily: font }} tickLine={false} axisLine={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(36, 59, 59, 0.2)" }} />
          <Line
            type="linear"
            dataKey="visitors"
            name="Visiteurs uniques"
            stroke={VISITORS_COLOR}
            strokeWidth={2}
            dot={endValuesClose ? false : (props) => <EndDot key={props.index} {...props} color={VISITORS_COLOR} last={last} />}
            activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
            isAnimationActive={false}
          />
          <Line
            type="linear"
            dataKey="views"
            name="Vues"
            stroke={VIEWS_COLOR}
            strokeWidth={2}
            dot={(props) => <EndDot key={props.index} {...props} color={VIEWS_COLOR} last={last} />}
            activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className={styles.legend}>
        <span className={styles.legendItem}><span className={styles.legendKey} style={{ background: VIEWS_COLOR }} />Vues</span>
        <span className={styles.legendItem}><span className={styles.legendKey} style={{ background: VISITORS_COLOR }} />Visiteurs uniques</span>
      </div>
    </div>
  );
}
