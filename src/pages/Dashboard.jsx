import { useEffect, useState } from "react";

import BalanceCard from "../components/cards/BalanceCard";
import ComparisonChart from "../components/charts/ComparisonChart";
import AssetsLiabilityChart from "../components/charts/AssetsLiabilityChart";
import IncomeCategoryChart from "../components/charts/IncomeCategoryChart";
import RecentTransactions from "../components/Tables/RecentTransactions";
import { loadTransactionsFromBackend } from "../utils/backendData";

import "../css/Dashboard.css";

function Dashboard() {
  const [transactions, setTransactions] = useState([]);

  const loadTransactions = async () => {
    try {
      const data = await loadTransactionsFromBackend();

      setTransactions(data);
    } catch (error) {
      setTransactions([]);
    }
  };

  useEffect(() => {
    loadTransactions();

    const handleUpdate = () => {
      loadTransactions();
    };

    window.addEventListener("transactionUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("focus", handleUpdate);

    return () => {
      window.removeEventListener("transactionUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
    };
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <BalanceCard />

        {/* =========================
            INCOME / EXPENSE / SAVING
        ========================= */}

        <div className="chart-full-row">
          <ComparisonChart transactions={transactions} />
        </div>

        {/* =========================
            ASSETS & LIABILITIES COMPARISON
        ========================= */}

        <div className="chart-full-row">
          <AssetsLiabilityChart />
        </div>

        {/* =========================
            CATEGORY CHART 
        ========================= */}

        <div className="chart-full-row">
          <IncomeCategoryChart transactions={transactions} />
        </div>

        <RecentTransactions />
      </div>
    </div>
  );
}

export default Dashboard;
