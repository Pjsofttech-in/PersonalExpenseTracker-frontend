import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import { getCurrentUser, AUTH_ENABLED } from "../../utils/auth";

import "../../css/TopNavigation.css";

function TopNavigation() {
  // CURRENT USER

  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

  useEffect(() => {
    const syncUser = () => {
      setCurrentUser(getCurrentUser());
    };

    window.addEventListener("authUpdated", syncUser);
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("authUpdated", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  const showNavLinks = AUTH_ENABLED ? Boolean(currentUser) : true;

  // RETURN

  return (
    <div className="top-navigation">
      {/* NAV LINKS */}

      {showNavLinks && (
        <div className="nav-links">
          <NavLink to="/" className="nav-button">
            Dashboard
          </NavLink>

          <NavLink to="/income/add" className="nav-button">
            Add
          </NavLink>

          <NavLink to="/list" className="nav-button">
            List
          </NavLink>

          <NavLink to="/assets" className="nav-button">
            Assets
          </NavLink>

          <NavLink to="/liabilities" className="nav-button">
            Liabilities
          </NavLink>

          <NavLink to="/users" className="nav-button">
            Users
          </NavLink>

          <NavLink to="/settings" className="nav-button">
            Settings
          </NavLink>
        </div>
      )}
    </div>
  );
}

export default TopNavigation;
