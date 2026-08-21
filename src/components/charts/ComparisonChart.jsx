import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";

import "../../css/Charts.css";

// एकच FULL-WIDTH chart card:
//   PIE  -> Income, Expense & Saving/Loss Comparison (bar)
//   BAR  -> Monthly Trends (line)

function ComparisonChart() {
  const [transactions, setTransactions] = useState([]);

  const [chartType, setChartType] = useState("PIE"); // PIE | BAR
  const [viewMode, setViewMode] = useState("Month"); // Month | Year
  const [typeFilter, setTypeFilter] = useState("All"); // All | Income | Expense

  const loadTransactions = () => {
    const saved = JSON.parse(localStorage.getItem("transactions")) || [];
    setTransactions(saved);
  };

  useEffect(() => {
    loadTransactions();
    window.addEventListener("storage", loadTransactions);
    window.addEventListener("focus", loadTransactions);
    window.addEventListener("transactionUpdated", loadTransactions);
    return () => {
      window.removeEventListener("storage", loadTransactions);
      window.removeEventListener("focus", loadTransactions);
      window.removeEventListener("transactionUpdated", loadTransactions);
    };
  }, []);

  const getAmount = (item) => Number(item.total || item.amount || 0);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthData = months.map((month, index) => {
    const list = transactions.filter(
      (item) => item.date && new Date(item.date).getMonth() === index,
    );

    const income = list
      .filter((item) => item.type === "Income")
      .reduce((sum, item) => sum + getAmount(item), 0);

    const expense = list
      .filter((item) => item.type === "Expense")
      .reduce((sum, item) => sum + getAmount(item), 0);

    return { month, income, expense, savings: income - expense };
  });

  const yearMap = {};
  transactions.forEach((item) => {
    if (!item.date) return;
    const year = String(new Date(item.date).getFullYear());
    if (!yearMap[year]) yearMap[year] = { year, income: 0, expense: 0 };
    if (item.type === "Income") yearMap[year].income += getAmount(item);
    if (item.type === "Expense") yearMap[year].expense += getAmount(item);
  });

  const yearData = Object.values(yearMap)
    .map((d) => ({ ...d, savings: d.income - d.expense }))
    .sort((a, b) => a.year.localeCompare(b.year));

  const data = viewMode === "Month" ? monthData : yearData;
  const xKey = viewMode === "Month" ? "month" : "year";

  const showIncome = typeFilter !== "Expense";
  const showExpense = typeFilter !== "Income";
  const showSavings = typeFilter === "All";

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <h3>
            {chartType === "PIE"
              ? "Income, Expense & Saving/Loss Comparison"
              : "Monthly Trends"}
          </h3>
          <p>
            {chartType === "PIE"
              ? "Monthly income, expense and savings comparison"
              : "Income, Expense & Saving/Loss overview"}
          </p>
        </div>

        {/* PIE | BAR - नेहमी उजवीकडे */}

        <div className="chart-toggle-group">
          <button
            className={chartType === "PIE" ? "active" : ""}
            onClick={() => setChartType("PIE")}
          >
            PIE
          </button>
          <button
            className={chartType === "BAR" ? "active" : ""}
            onClick={() => setChartType("BAR")}
          >
            BAR
          </button>
        </div>
      </div>

      {/* Month/Year + filters - फक्त PIE view मध्ये, header खाली */}

      {chartType === "PIE" && (
        <div className="chart-controls chart-controls-row">
          <div className="chart-toggle-group">
            <button
              className={viewMode === "Month" ? "active" : ""}
              onClick={() => setViewMode("Month")}
            >
              Month
            </button>
            <button
              className={viewMode === "Year" ? "active" : ""}
              onClick={() => setViewMode("Year")}
            >
              Year
            </button>
          </div>

          <div className="chart-toggle-group">
            <button
              className={typeFilter === "All" ? "active" : ""}
              onClick={() => setTypeFilter("All")}
            >
              All
            </button>
            <button
              className={typeFilter === "Income" ? "active" : ""}
              onClick={() => setTypeFilter("Income")}
            >
              Income Only
            </button>
            <button
              className={typeFilter === "Expense" ? "active" : ""}
              onClick={() => setTypeFilter("Expense")}
            >
              Expense Only
            </button>
          </div>
        </div>
      )}

      <div className="chart-area">
        <ResponsiveContainer width="100%" height={300}>
          {chartType === "PIE" ? (
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />

              <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />

              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `₹${value}`}
              />

              <Tooltip
                formatter={(value) =>
                  `₹${Number(value).toLocaleString("en-IN")}`
                }
              />

              <Legend />

              {showIncome && (
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#16A34A"
                  radius={[5, 5, 0, 0]}
                  barSize={12}
                />
              )}

              {showExpense && (
                <Bar
                  dataKey="expense"
                  name="Expense"
                  fill="#DC2626"
                  radius={[5, 5, 0, 0]}
                  barSize={12}
                />
              )}

              {showSavings && (
                <Bar
                  dataKey="savings"
                  name="Saving/Loss"
                  radius={[5, 5, 0, 0]}
                  barSize={12}
                >
                  {data.map((d, i) => (
                    <Cell
                      key={`sav-${i}`}
                      fill={d.savings >= 0 ? "#6366F1" : "#F59E0B"}
                    />
                  ))}
                </Bar>
              )}
            </BarChart>
          ) : (
            <LineChart
              data={monthData}
              margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />

              <XAxis dataKey="month" tick={{ fontSize: 11 }} />

              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `₹${value}`}
              />

              <Tooltip
                formatter={(value) =>
                  `₹${Number(value).toLocaleString("en-IN")}`
                }
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#16A34A"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />

              <Line
                type="monotone"
                dataKey="expense"
                name="Expense"
                stroke="#DC2626"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />

              <Line
                type="monotone"
                dataKey="savings"
                name="Saving/Loss"
                stroke="#6366F1"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ComparisonChart;
