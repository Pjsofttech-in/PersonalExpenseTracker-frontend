import BalanceCard from "../components/cards/BalanceCard";
import ComparisonChart from "../components/charts/ComparisonChart";
import IncomeCategoryChart from "../components/charts/IncomeCategoryChart";
import ExpenseCategoryChart from "../components/charts/ExpenseCategoryChart";
import RecentTransactions from "../components/Tables/RecentTransactions";

import "../css/Dashboard.css";

function Dashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <BalanceCard />

        <div className="chart-full-row">
          <ComparisonChart />
        </div>

        <div className="category-chart-row">
          <IncomeCategoryChart />
          <ExpenseCategoryChart />
        </div>

        <RecentTransactions />
      </div>
    </div>
  );
}

export default Dashboard;
