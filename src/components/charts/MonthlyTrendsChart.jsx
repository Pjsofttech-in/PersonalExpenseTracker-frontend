import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import "../../css/Charts.css";

function MonthlyTrendsChart() {
  const [transactions, setTransactions] = useState([]);

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

  const data = months.map((month, index) => {
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

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <h3>Monthly Trends</h3>
          <p>Income, Expense &amp; Saving/Loss overview</p>
        </div>
      </div>

      <div className="chart-area">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis dataKey="month" tick={{ fontSize: 11 }} />

            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => `₹${value}`}
            />

            <Tooltip
              formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`}
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
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default MonthlyTrendsChart;
