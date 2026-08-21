import { NavLink } from "react-router-dom";
import "../../css/TopNavigation.css";

function TopNavigation() {
  return (
    <div className="top-navigation">
      <NavLink to="/" className="nav-button">
        Dashboard
      </NavLink>

      <NavLink to="/income/add" className="nav-button">
        Add Income/Expense
      </NavLink>

      <NavLink to="/list" className="nav-button">
        List
      </NavLink>

      <NavLink to="/settings" className="nav-button">
        Settings
      </NavLink>
    </div>
  );
}

export default TopNavigation;
