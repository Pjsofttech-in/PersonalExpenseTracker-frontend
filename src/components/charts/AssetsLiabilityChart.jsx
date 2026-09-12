import { useEffect, useMemo, useState } from "react";
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
  PieChart,
  Pie,
} from "recharts";

import { loadTransactionsFromBackend } from "../../utils/backendData";

import "../../css/Charts.css";

const PIE_COLORS = {
  Investment: "#16A34A",
  Banks: "#0EA5E9",
  Insurance: "#14B8A6",
  "Bills & Recharge": "#DC2626",
  "Credit Card": "#F59E0B",
  Loans: "#8B5CF6",
};

const ASSET_GROUPS = [
  {
    name: "Investment",
    categories: [
      "Gold",
      "Silver",
      "Platinum",
      "Diamond",
      "Ind Stock",
      "US Stock",
      "Mutual Fund",
      "Bitcoin",
      "Vehicle",
      "Plot",
      "Flat",
      "Land",
    ],
  },
  {
    name: "Banks",
    categories: ["Bank FD", "Bank RD", "Bonds", "NPS", "ESPO", "PPF", "SIF"],
  },
  {
    name: "Insurance",
    categories: [
      "Life Insurance",
      "Health Insurance",
      "Vehicle Insurance",
      "Term Insurance",
    ],
  },
];

const LIABILITY_GROUPS = [
  {
    name: "Bills & Recharge",
    categories: [
      "Wi-Fi Bill",
      "Mobile Bill",
      "Electric Bill",
      "TV/OTT Bill",
      "Insurance",
      "School Fee",
      "Tuition Fee",
    ],
  },
  { name: "Credit Card", categories: ["Credit Card"] },
  {
    name: "Loans",
    categories: [
      "Bank Loan",
      "Gold Loan",
      "Home Loan",
      "Vehicle Loan",
      "Education Loan",
    ],
  },
];

function AssetsLiabilityChart() {
  const [chartType, setChartType] = useState("BAR");

  const [typeFilter, setTypeFilter] = useState("All");

  const [timeframe, setTimeframe] = useState("");

  const activeTimeframe = timeframe || "Monthly";

  const [transactions, setTransactions] = useState([]);

  const [loadError, setLoadError] = useState(false);

  const loadData = async () => {
    try {
      const list = await loadTransactionsFromBackend();

      setTransactions(Array.isArray(list) ? list : []);

      setLoadError(false);
    } catch (error) {
      setTransactions([]);

      setLoadError(true);
    }
  };

  useEffect(() => {
    loadData();

    window.addEventListener("transactionUpdated", loadData);
    window.addEventListener("assetUpdated", loadData);
    window.addEventListener("storage", loadData);
    window.addEventListener("focus", loadData);

    return () => {
      window.removeEventListener("transactionUpdated", loadData);
      window.removeEventListener("assetUpdated", loadData);
      window.removeEventListener("storage", loadData);
      window.removeEventListener("focus", loadData);
    };
  }, []);

  const ASSET_CATEGORIES = [
    "Bank FD",
    "Bank RD",
    "Bonds",
    "NPS",
    "ESPO",
    "PPF",
    "SIF",
    "Gold",
    "Silver",
    "Platinum",
    "Diamond",
    "Ind Stock",
    "US Stock",
    "Mutual Fund",
    "Bitcoin",
    "Vehicle",
    "Plot",
    "Flat",
    "Land",
    "Life Insurance",
    "Health Insurance",
    "Vehicle Insurance",
    "Term Insurance",
  ];

  const LIABILITY_CATEGORIES = [
    "Wi-Fi Bill",
    "Mobile Bill",
    "Electric Bill",
    "TV/OTT Bill",
    "Insurance",
    "School Fee",
    "Tuition Fee",
    "Bank Loan",
    "Gold Loan",
    "Home Loan",
    "Vehicle Loan",
    "Education Loan",
    "Credit Card",
  ];

  const isAsset = (item) => ASSET_CATEGORIES.includes(item.category || "");

  const isLiability = (item) =>
    LIABILITY_CATEGORIES.includes(item.category || "");

  const getValue = (item) => Number(item.total || item.amount || 0);

  const getItemDate = (item) => {
    if (!item.date) return null;

    const date = new Date(item.date);

    if (Number.isNaN(date.getTime())) return null;

    date.setHours(0, 0, 0, 0);

    return date;
  };

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

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
    const monthAssets = transactions
      .filter((item) => {
        const date = getItemDate(item);

        return date && date.getMonth() === index && isAsset(item);
      })
      .reduce((sum, item) => sum + getValue(item), 0);

    const monthLiabilities = transactions
      .filter((item) => {
        const date = getItemDate(item);

        return date && date.getMonth() === index && isLiability(item);
      })
      .reduce((sum, item) => sum + getValue(item), 0);

    return {
      month,
      assets: monthAssets,
      liabilities: monthLiabilities,
      net: monthAssets - monthLiabilities,
    };
  });

  const yearMap = {};

  transactions.forEach((item) => {
    const date = getItemDate(item);

    if (!date) return;

    const year = String(date.getFullYear());

    if (!yearMap[year]) {
      yearMap[year] = { year, assets: 0, liabilities: 0 };
    }

    if (isAsset(item)) {
      yearMap[year].assets += getValue(item);
    }

    if (isLiability(item)) {
      yearMap[year].liabilities += getValue(item);
    }
  });

  const yearData = Object.values(yearMap)
    .map((item) => ({
      ...item,
      net: item.assets - item.liabilities,
    }))
    .sort((a, b) => a.year.localeCompare(b.year));

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const weeklyAssets = transactions
    .filter((item) => {
      const date = getItemDate(item);

      return date && date >= weekStart && date <= weekEnd && isAsset(item);
    })
    .reduce((sum, item) => sum + getValue(item), 0);

  const weeklyLiabilities = transactions
    .filter((item) => {
      const date = getItemDate(item);

      return date && date >= weekStart && date <= weekEnd && isLiability(item);
    })
    .reduce((sum, item) => sum + getValue(item), 0);

  const weeklyData = [
    {
      period: "This Week",
      assets: weeklyAssets,
      liabilities: weeklyLiabilities,
      net: weeklyAssets - weeklyLiabilities,
    },
  ];

  const allAssets = transactions
    .filter(isAsset)
    .reduce((sum, item) => sum + getValue(item), 0);

  const allLiabilities = transactions
    .filter(isLiability)
    .reduce((sum, item) => sum + getValue(item), 0);

  const allData = [
    {
      period: "All Time",
      assets: allAssets,
      liabilities: allLiabilities,
      net: allAssets - allLiabilities,
    },
  ];

  let data = monthData;
  let xKey = "month";

  if (activeTimeframe === "Yearly") {
    data = yearData;
    xKey = "year";
  }

  if (activeTimeframe === "Weekly") {
    data = weeklyData;
    xKey = "period";
  }

  if (activeTimeframe === "All") {
    data = allData;
    xKey = "period";
  }

  const hasData = transactions.some(isAsset) || transactions.some(isLiability);

  const showAssets = typeFilter !== "Liability";
  const showLiabilities = typeFilter !== "Asset";
  const showNet = typeFilter === "All";

  const title =
    activeTimeframe === "Monthly"
      ? "Assets & Liabilities Comparison"
      : `Assets & Liabilities - ${activeTimeframe}`;

  const buildAllocation = (groups) =>
    groups.map((group) => ({
      name: group.name,
      value: transactions
        .filter((item) => group.categories.includes(item.category || ""))
        .reduce((sum, item) => sum + getValue(item), 0),
    }));

  const pieData = [
    ...(showAssets ? buildAllocation(ASSET_GROUPS) : []),
    ...(showLiabilities ? buildAllocation(LIABILITY_GROUPS) : []),
  ].filter((item) => item.value > 0);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <h3>{title}</h3>
        </div>

        <div className="chart-toggle-group">
          <button
            className={chartType === "BAR" ? "active" : ""}
            onClick={() => setChartType("BAR")}
          >
            BAR
          </button>

          <button
            className={chartType === "LINE" ? "active" : ""}
            onClick={() => setChartType("LINE")}
          >
            LINE
          </button>

          <button
            className={chartType === "PIE" ? "active" : ""}
            onClick={() => setChartType("PIE")}
          >
            PIE
          </button>
        </div>
      </div>

      <div className="chart-controls chart-controls-row">
        <div className="chart-toggle-group">
          <button
            className={typeFilter === "All" ? "active" : ""}
            onClick={() => setTypeFilter("All")}
          >
            All
          </button>

          <button
            className={typeFilter === "Asset" ? "active" : ""}
            onClick={() => setTypeFilter("Asset")}
          >
            Assets Only
          </button>

          <button
            className={typeFilter === "Liability" ? "active" : ""}
            onClick={() => setTypeFilter("Liability")}
          >
            Liabilities Only
          </button>
        </div>

        {chartType !== "PIE" && (
          <select
            className="chart-timeframe-select"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="" disabled hidden>
              Timeframe
            </option>

            <option value="Monthly">Monthly</option>

            <option value="Weekly">Weekly</option>

            <option value="Yearly">Yearly</option>

            <option value="All">All Time</option>
          </select>
        )}
      </div>

      {loadError ? (
        <div className="expense-empty">
          <p>Could not load assets / liabilities</p>
          <span>
            Backend चालू आहे का? Login refresh करा (token expire झाला असेल).
          </span>
        </div>
      ) : !hasData ? (
        <div className="expense-empty">
          <p>No asset / liability data available</p>
          <span>Backend मध्ये अजून assets / liabilities add झालेले नाहीत.</span>
        </div>
      ) : chartType === "PIE" ? (
        <div className="chart-area">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={55}
                paddingAngle={3}
                label={({ percent }) =>
                  `${(Number(percent || 0) * 100).toFixed(1)}%`
                }
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[entry.name] || "#1976d2"}
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(value) =>
                  `₹${Number(value).toLocaleString("en-IN")}`
                }
              />

              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="chart-area">
          <ResponsiveContainer width="100%" height={300}>
            {chartType === "BAR" ? (
              <BarChart
                data={data}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 5,
                }}
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

                {showAssets && (
                  <Bar
                    dataKey="assets"
                    name="Assets"
                    fill="#16A34A"
                    radius={[5, 5, 0, 0]}
                    barSize={12}
                  />
                )}

                {showLiabilities && (
                  <Bar
                    dataKey="liabilities"
                    name="Liabilities"
                    fill="#DC2626"
                    radius={[5, 5, 0, 0]}
                    barSize={12}
                  />
                )}

                {showNet && (
                  <Bar
                    dataKey="net"
                    name="Net (A - L)"
                    radius={[5, 5, 0, 0]}
                    barSize={12}
                  >
                    {data.map((item, index) => (
                      <Cell
                        key={`net-${index}`}
                        fill={item.net >= 0 ? "#6366F1" : "#F59E0B"}
                      />
                    ))}
                  </Bar>
                )}
              </BarChart>
            ) : (
              <LineChart
                data={data}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 5,
                }}
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

                {showAssets && (
                  <Line
                    type="monotone"
                    dataKey="assets"
                    name="Assets"
                    stroke="#16A34A"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                )}

                {showLiabilities && (
                  <Line
                    type="monotone"
                    dataKey="liabilities"
                    name="Liabilities"
                    stroke="#DC2626"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                )}

                {showNet && (
                  <Line
                    type="monotone"
                    dataKey="net"
                    name="Net (A - L)"
                    stroke="#6366F1"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default AssetsLiabilityChart;
