import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import "../../css/Charts.css";

function ExpenseCategoryChart() {
  const [chartData, setChartData] = useState([]);
  const [chartMode, setChartMode] = useState("PIE"); // PIE | BAR

  const loadChartData = () => {
    const transactions = JSON.parse(localStorage.getItem("transactions")) || [];

    const expenses = transactions.filter((item) => item.type === "Expense");

    const categoryTotals = {};

    expenses.forEach((item) => {
      const category = item.category || "Other";
      const amount = Number(item.total || item.amount || 0);
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    });

    const data = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
    }));

    setChartData(data);
  };

  useEffect(() => {
    loadChartData();

    const handleUpdate = () => loadChartData();

    window.addEventListener("transactionUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("focus", handleUpdate);

    return () => {
      window.removeEventListener("transactionUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
    };
  }, []);

  const formatAmount = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

  const colors = [
    "#F97316",
    "#DC2626",
    "#8B5CF6",
    "#0EA5E9",
    "#EC4899",
    "#F59E0B",
  ];

  return (
    <div className="expense-category-card">
      <div className="expense-category-header">
        <div>
          <h3>Expenses by Category</h3>
          <p>Category-wise expense distribution</p>
        </div>

        <div className="chart-controls">
          <div className="chart-toggle-group">
            <button
              className={chartMode === "PIE" ? "active" : ""}
              onClick={() => setChartMode("PIE")}
            >
              PIE
            </button>
            <button
              className={chartMode === "BAR" ? "active" : ""}
              onClick={() => setChartMode("BAR")}
            >
              BAR
            </button>
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="expense-empty">
          <p>No expense data available</p>
          <span>Add an expense to see the category chart.</span>
        </div>
      ) : (
        <div className="expense-chart-wrapper">
          {chartMode === "PIE" ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={55}
                  paddingAngle={3}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Pie>

                <Tooltip formatter={(value) => formatAmount(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />

                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => `₹${value}`}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 11 }}
                />

                <Tooltip formatter={(value) => formatAmount(value)} />

                <Bar
                  dataKey="value"
                  name="Expense"
                  radius={[0, 6, 6, 0]}
                  barSize={18}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}

export default ExpenseCategoryChart;
