import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import { getCurrentUser, AUTH_ENABLED } from "../../utils/auth";

import "../../css/TopNavigation.css";

function TopNavigation() {
  // CURRENT USER (login वर update होते)

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

  // NAV LINKS — AUTH_ENABLED false असताना
  // login नसलं तरी दिसतात

  const showNavLinks = AUTH_ENABLED ? Boolean(currentUser) : true;

  // THEME — light / dark mode toggle
  // (main.jsx startup ला localStorage मधून apply करतो)

  const [darkMode, setDarkMode] = useState(() =>
    document.body.classList.contains("dark"),
  );

  const toggleTheme = () => {
    const nextDark = !darkMode;

    setDarkMode(nextDark);
    document.body.classList.toggle("dark", nextDark);

    try {
      localStorage.setItem("theme", nextDark ? "dark" : "light");
    } catch (themeError) {
      // storage block असल्यास theme फक्त memory मध्ये राहील
    }
  };

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

          <NavLink to="/networth" className="nav-button">
            Net Worth
          </NavLink>

          <NavLink to="/users" className="nav-button">
            Users
          </NavLink>

          <NavLink to="/settings" className="nav-button">
            Settings
          </NavLink>
        </div>
      )}

      {/* THEME TOGGLE — light / dark */}

      <button
        type="button"
        className="theme-toggle"
        onClick={toggleTheme}
        title={darkMode ? "Light mode" : "Dark mode"}
        aria-label="Toggle light / dark mode"
      >
        {darkMode ? (
          /* sun — dark असताना दिसतो (click → light) */
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        ) : (
          /* moon — light असताना दिसतो (click → dark) */
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default TopNavigation;
