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
} from "recharts";

import { apiGetAssets, apiGetLiabilities } from "../../utils/api";

import "../../css/Charts.css";

function AssetsLiabilityChart() {
  const [chartType, setChartType] = useState("BAR");

  const [typeFilter, setTypeFilter] = useState("All");

  const [timeframe, setTimeframe] = useState("");

  const activeTimeframe = timeframe || "Monthly";

  const [assets, setAssets] = useState([]);

  const [liabilities, setLiabilities] = useState([]);

  const [loadError, setLoadError] = useState(false);

  /* =========================
       LOAD (BACKEND APIs)
     ========================= */

  const loadData = async () => {
    try {
      const [assetList, liabilityList] = await Promise.all([
        apiGetAssets(),
        apiGetLiabilities(),
      ]);

      setAssets(Array.isArray(assetList) ? assetList : []);

      setLiabilities(Array.isArray(liabilityList) ? liabilityList : []);

      setLoadError(false);
    } catch (error) {
      setAssets([]);

      setLiabilities([]);

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

  /* =========================
       VALUE HELPERS
     ========================= */

  // Asset ची आजची किंमत (currentValue नाही तर purchaseValue)

  const getAssetValue = (asset) =>
    Number(asset.currentValue || asset.purchaseValue || 0);

  // Liability ची बाकी रक्कम (outstandingAmount नाही तर principalAmount)

  const getLiabilityValue = (liability) =>
    Number(liability.outstandingAmount || liability.principalAmount || 0);

  const getAssetDate = (asset) => {
    if (!asset.purchaseDate) return null;

    const date = new Date(asset.purchaseDate);

    if (Number.isNaN(date.getTime())) return null;

    date.setHours(0, 0, 0, 0);

    return date;
  };

  const getLiabilityDate = (liability) => {
    if (!liability.startDate) return null;

    const date = new Date(liability.startDate);

    if (Number.isNaN(date.getTime())) return null;

    date.setHours(0, 0, 0, 0);

    return date;
  };

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  /* =========================
         MONTHLY DATA
     ========================= */

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
    const monthAssets = assets
      .filter((asset) => {
        const date = getAssetDate(asset);

        return date && date.getMonth() === index;
      })
      .reduce((sum, asset) => sum + getAssetValue(asset), 0);

    const monthLiabilities = liabilities
      .filter((liability) => {
        const date = getLiabilityDate(liability);

        return date && date.getMonth() === index;
      })
      .reduce((sum, liability) => sum + getLiabilityValue(liability), 0);

    return {
      month,
      assets: monthAssets,
      liabilities: monthLiabilities,
      net: monthAssets - monthLiabilities,
    };
  });

  /* =========================
         YEARLY DATA
     ========================= */

  const yearMap = {};

  assets.forEach((asset) => {
    const date = getAssetDate(asset);

    if (!date) return;

    const year = String(date.getFullYear());

    if (!yearMap[year]) {
      yearMap[year] = { year, assets: 0, liabilities: 0 };
    }

    yearMap[year].assets += getAssetValue(asset);
  });

  liabilities.forEach((liability) => {
    const date = getLiabilityDate(liability);

    if (!date) return;

    const year = String(date.getFullYear());

    if (!yearMap[year]) {
      yearMap[year] = { year, assets: 0, liabilities: 0 };
    }

    yearMap[year].liabilities += getLiabilityValue(liability);
  });

  const yearData = Object.values(yearMap)
    .map((item) => ({
      ...item,
      net: item.assets - item.liabilities,
    }))
    .sort((a, b) => a.year.localeCompare(b.year));

  /* =========================
         WEEKLY DATA
     ========================= */

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const weeklyAssets = assets
    .filter((asset) => {
      const date = getAssetDate(asset);

      return date && date >= weekStart && date <= weekEnd;
    })
    .reduce((sum, asset) => sum + getAssetValue(asset), 0);

  const weeklyLiabilities = liabilities
    .filter((liability) => {
      const date = getLiabilityDate(liability);

      return date && date >= weekStart && date <= weekEnd;
    })
    .reduce((sum, liability) => sum + getLiabilityValue(liability), 0);

  const weeklyData = [
    {
      period: "This Week",
      assets: weeklyAssets,
      liabilities: weeklyLiabilities,
      net: weeklyAssets - weeklyLiabilities,
    },
  ];

  /* =========================
         ALL TIME DATA
     ========================= */

  const allAssets = assets.reduce(
    (sum, asset) => sum + getAssetValue(asset),
    0,
  );

  const allLiabilities = liabilities.reduce(
    (sum, liability) => sum + getLiabilityValue(liability),
    0,
  );

  const allData = [
    {
      period: "All Time",
      assets: allAssets,
      liabilities: allLiabilities,
      net: allAssets - allLiabilities,
    },
  ];

  /* =========================
       SELECT CHART DATA
     ========================= */

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

  const hasData = assets.length > 0 || liabilities.length > 0;

  const showAssets = typeFilter !== "Liability";
  const showLiabilities = typeFilter !== "Asset";
  const showNet = typeFilter === "All";

  const title =
    activeTimeframe === "Monthly"
      ? "Assets & Liabilities Comparison"
      : `Assets & Liabilities - ${activeTimeframe}`;

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
      </div>

      {loadError ? (
        <div className="expense-empty">
          <p>Could not load assets / liabilities</p>
        </div>
      ) : !hasData ? (
        <div className="expense-empty">
          <p>No asset / liability data available</p>
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
