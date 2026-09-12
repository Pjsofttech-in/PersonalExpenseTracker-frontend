import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import "../../css/Charts.css";

const COLORS = ["#1976d2", "#26a69a", "#ef6c00", "#8e24aa"];

const formatAmount = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

function PillAllocationChart({ title, data }) {
  const chartData = (data || []).filter((item) => Number(item.value || 0) > 0);

  if (chartData.length === 0) return null;

  return (
    <div className="allocation-chart-box">
      {title && <h3 className="allocation-chart-title">{title}</h3>}

      <ResponsiveContainer width="100%" height={230}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={72}
            innerRadius={42}
            paddingAngle={3}
            label={({ percent }) =>
              `${(Number(percent || 0) * 100).toFixed(1)}%`
            }
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip formatter={(value) => formatAmount(value)} />

          <Legend
            formatter={(value, entry) =>
              `${value} — ${formatAmount(
                entry && entry.payload ? entry.payload.value : 0,
              )}`
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PillAllocationChart;
