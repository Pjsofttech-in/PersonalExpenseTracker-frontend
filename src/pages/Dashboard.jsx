import { useEffect, useState } from "react";

import BalanceCard from "../components/cards/BalanceCard";
import ComparisonChart from "../components/charts/ComparisonChart";
import AssetsLiabilityChart from "../components/charts/AssetsLiabilityChart";
import IncomeCategoryChart from "../components/charts/IncomeCategoryChart";
import RecentTransactions from "../components/Tables/RecentTransactions";
import { loadTransactionsFromBackend } from "../utils/backendData";

import "../css/Dashboard.css";
import "../css/Assets.css";

const AL_PILLS = [
  {
    id: "INVESTMENT",
    label: "Investment",
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
    id: "BANKS",
    label: "Banks",
    categories: ["Bank FD", "Bank RD", "Bonds", "NPS", "ESPO", "PPF", "SIF"],
  },
  {
    id: "INSURANCE",
    label: "Insurance",
    categories: [
      "Life Insurance",
      "Health Insurance",
      "Vehicle Insurance",
      "Term Insurance",
    ],
  },
  {
    id: "BILLS",
    label: "Bills & Recharge",
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
  {
    id: "CARD",
    label: "Credit Card",
    categories: ["Credit Card"],
  },
  {
    id: "LOANS",
    label: "Loans",
    categories: [
      "Bank Loan",
      "Gold Loan",
      "Home Loan",
      "Vehicle Loan",
      "Education Loan",
    ],
  },
];

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

  const formatAmount = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const getAmount = (item) => Number(item.total || item.amount || 0);

  const getPaid = (item) => {
    if (item.paymentStatus === "Complete") {
      return getAmount(item);
    }

    return Number(item.paid || 0);
  };

  const getPending = (item) => {
    if (item.paymentStatus === "Complete") {
      return 0;
    }

    return Math.max(getAmount(item) - getPaid(item), 0);
  };

  const alPillStats = AL_PILLS.map((pill) => {
    const txns = transactions.filter((item) =>
      pill.categories.includes(item.category || ""),
    );

    return {
      id: pill.id,
      label: pill.label,
      paid: txns.reduce((sum, item) => sum + getPaid(item), 0),
      unpaid: txns.reduce((sum, item) => sum + getPending(item), 0),
      amount: txns.reduce((sum, item) => sum + getAmount(item), 0),
    };
  });

  const assetsTotal = alPillStats
    .slice(0, 3)
    .reduce((sum, pill) => sum + pill.amount, 0);

  const liabilitiesTotal = alPillStats
    .slice(3)
    .reduce((sum, pill) => sum + pill.amount, 0);

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div className="fin-pills dashboard-al-pills">
          {alPillStats.map((pill) => (
            <div className="fin-pill" key={pill.id}>
              <span className="fin-pill-label">{pill.label}</span>

              <span className="fin-pill-amounts">
                <span className="pill-paid">
                  Paid: {formatAmount(pill.paid)}
                </span>

                <span className="pill-unpaid">
                  Unpaid: {formatAmount(pill.unpaid)}
                </span>
              </span>
            </div>
          ))}

          <span className="fin-list-total">
            Assets Total: {formatAmount(assetsTotal)}
          </span>

          <span className="fin-list-total">
            Liabilities Total: {formatAmount(liabilitiesTotal)}
          </span>
        </div>

        <BalanceCard />

        <div className="chart-full-row">
          <ComparisonChart transactions={transactions} />
        </div>

        <div className="chart-full-row">
          <AssetsLiabilityChart />
        </div>

        <div className="chart-full-row">
          <IncomeCategoryChart transactions={transactions} />
        </div>

        <RecentTransactions />
      </div>
    </div>
  );
}

export default Dashboard;
